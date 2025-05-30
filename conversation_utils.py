import json
from typing import AsyncGenerator
from app.connection.establish_db_connection import get_node_db
from llm_wrapper.core.llm_interface import LLMInterface
from app.utils.logs_utils import get_path
from datetime import datetime, timezone
from app.connection.establish_db_connection import get_mongo_db
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

class ConversationUtils():
    
    def __init__(self, context=None) -> None:
        if context:
            self.llm = LLMInterface(get_path(), 'conversation_title_finder', context.user_id, context.project_id, context.agent_name, mongo_handler= get_mongo_db())

    @property
    def node_db(self):
        return get_node_db()

    async def _yield_event(self, content: str) -> AsyncGenerator[str, None]:
        yield f"data: {json.dumps({'content': content})}\n\n"
        yield f"event: stop\n"
        yield f"data: stopped\n\n"
        
    async def _ask_for_title(self, discussion_id, messages):
        # Add the new message to ask for a title
        title_prompt = "Please provide a concise four or five word title for this conversation, without using any quotes."
        
        system_prompt = 'You are a concise title generator. Your task is to create a short, descriptive title for the given conversation. The title should be 2-3 words long, capture the main topic or theme of the conversation, and not use any quotation marks. Be specific and avoid generic titles.'
        
        max_attempts = 3
        for attempt in range(max_attempts):
            content = await self.llm.llm_interaction_wrapper(
                messages=messages,
                user_prompt=title_prompt,
                system_prompt=system_prompt,
                response_format={'type': 'text'},
                model='gpt-4o-mini'
            )
            
            # Remove any leading/trailing whitespace and split into words
            words = content.strip().split()
            current_time = datetime.now(timezone.utc).isoformat()

            if len(words) <= 5:
                # If the title is 5 words or less, update the node and return
                await self.node_db.update_node_by_id(int(discussion_id), {'Title': ' '.join(words), 'created_at': current_time })
                return
                
            # If we've reached the maximum attempts, use the first 5 words of the last attempt
            if attempt == max_attempts - 1:
                truncated_title = ' '.join(words[:5])
                await self.node_db.update_node_by_id(int(discussion_id), {'Title': truncated_title, 'created_at': current_time })
                return
            
            # If the title is too long, update the prompt for the next attempt
            title_prompt = f"The previous title was too long. Please provide an even more concise title of 2-3 words, and no more than 5 words."

    async def _get_chat_history(self, user_id, limit, project_id):
        discussion_node = await self.node_db.get_general_discussions_by_user(user_id, limit, project_id)
        if discussion_node:
            discussion_so_far = []
            for _id, discussion in enumerate(discussion_node):
                chat_history = json.loads(discussion['d'].get('Discussion', '[]'))
                               
                # session_id = json.loads(discussion['d'].get('Discussion', '[]'))

                # Remove the system prompt (first dictionary) if it exists
                if chat_history and chat_history[0].get('role') == 'system':
                    chat_history = chat_history[1:]
                
                project_id = discussion['d'].get('ProjectId')
                project_node = await self.node_db.get_node_by_id(project_id)
                if not project_node:
                    continue
                discussion_so_far.append({
                    "name": discussion['d'].get('Title', 'Untitled Discussion'),
                    "created_at": discussion['d'].get('CreatedAt'),
                    "discussion_id": discussion_node[_id]['ID(d)'],
                    "project_id": discussion['d'].get('ProjectId'),
                    "project_name": project_node.get('properties').get('Title')
                })
            
            return discussion_so_far
        
        return []  # Return an empty list if no chat history was found
    @staticmethod
    def calculate_duration(start_time_str: str, end_time_str: str) -> str:
        """Calculate duration between two timestamps with granular details"""
        try:
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            
            # Calculate difference in seconds
            diff_seconds = int((end_time - start_time).total_seconds())
            
            # Convert to various units
            minutes = diff_seconds // 60
            hours = minutes // 60
            days = hours // 24
            weeks = days // 7
            years = days // 365
            
            # Calculate remaining values
            remaining_weeks = (days % 365) // 7
            remaining_days = days % 7
            remaining_hours = hours % 24
            remaining_minutes = minutes % 60
            remaining_seconds = diff_seconds % 60
            
            # Return appropriate unit based on duration
            if years >= 1:
                return f"{years}y {remaining_weeks}w"
            elif weeks >= 1:
                return f"{weeks}w {remaining_days}d"
            elif days >= 1:
                return f"{days}d {remaining_hours}h"
            elif hours >= 1:
                return f"{hours}h {remaining_minutes}m"
            elif minutes >= 1:
                return f"{minutes}m {remaining_seconds}s"
            else:
                return "<1m"
            
        except Exception as e:
            print(f"Error calculating duration: {e}")
            return "unknown"
    async def get_query_history(self, user_id, limit,skip, project_id):
        discussion_nodes = await self.node_db.get_general_query_discussions_by_user(user_id, limit,skip, project_id)
        if discussion_nodes:
            discussion_so_far = []
            for discussion in discussion_nodes:
                # Extract properties from the Node object
                node_properties = dict(discussion['d'])
                
                # Parse the Discussion JSON string
                chat_history = json.loads(node_properties.get('Discussion', '[]'))
                            # Get the last message timestamp
                last_timestamp = None
                for msg in reversed(chat_history):
                    if msg.get('timestamp'):
                        last_timestamp = msg['timestamp']
                        break
                 
                
                # Format the messages
                formatted_messages = []
                for idx, msg in enumerate(chat_history):
                    if msg.get('role') != 'function':
                        formatted_msg = {
                            'sender': 'AI' if msg.get('role') == 'assistant' else 'user',
                            'text': msg.get('content'),
                            'id': idx + 1,
                            "timestamp":msg.get('timestamp')
                        }
                        formatted_messages.append(formatted_msg)
                # Create the discussion entry using Neo4j ID
                discussion_entry = {
                    "created_at": node_properties.get('CreatedAt'),
                    "discussion_id": discussion['node_id'],  # Use Neo4j ID
                    "project_id": node_properties.get('ProjectId'),
                    "duration": ConversationUtils.calculate_duration(node_properties.get('CreatedAt'),last_timestamp) if last_timestamp else "unknown",
                    "project_name": discussion['project_title'],
                    "username": node_properties.get('Username'),
                    "session_name":node_properties.get("session_name","untitled"),
                    "session_id":node_properties.get("session_id"),
                    "description":node_properties.get("description",""),
                    # "messages": formatted_messages,  # Add formatted messages
                    "build_ids": node_properties.get('BuildIds', []),  # Add BuildIds from node properties
                }
                
                discussion_so_far.append(discussion_entry)
                result =  {
                        "data": discussion_so_far,
                        "total": discussion_nodes[0]['total'],
                        "limit": limit,
                        "skip": skip
                    }
            return result
        
        return {}
    
    async def _load_discussion(self,discussion_id, count=None, system=None):
                
        discussion_node = await self.node_db.get_node_by_id(discussion_id)
        if discussion_node:
            discussion_data = discussion_node['properties'].get('Discussion')
            if discussion_data:  # Check if discussion_data is not None
                discussion_so_far = json.loads(discussion_data)
                
                if not system:
                    # Remove the system message if it exists
                    discussion_so_far = [msg for msg in discussion_so_far if msg.get('role') != 'system']

                if count:
                    discussion_so_far = discussion_so_far[-count:][-count:]
                
                return discussion_so_far
            else:
                # Handle the case where 'Discussion' is None
                # For example, return an empty list or a default value
                return []
        return []