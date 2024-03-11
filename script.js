var phoneNavBar = document.getElementById("phoneNavId");
var navBarButton = document.getElementById("phoneNavButtonId");

function showPhoneNav(){
    if(phoneNavBar.style.visibility == "hidden"){
        phoneNavBar.style.visibility = "visible";
        navBarButton.style.position = "fixed";
    } 
    else {
        phoneNavBar.style.visibility = "hidden";
        navBarButton.style.position = "absolute";
    }
}

function removePhoneNav(){
    phoneNavBar.style.visibility = "hidden";
    navBarButton.style.position = "absolute";
}

function toggleDisplay(popupId){ //function for dispalaying popups
    var popUpElement = document.getElementById(popupId);
    popUpElement.classList.toggle('active');
}

function checkSlotsAndProiveForm(){ //function to provide registration form if slots available
    if(document.getElementById("slotsAvailable").textContent == '0'){
        alert("Sorry! No more slots available.");
    }
    else{
        toggleDisplay('registerPopUpId');
    }
}

function checkPhoneNumber(phNum){
    if (phNum.length != 10){
        alert("Invalid phone number! Should be 10 characters long");
        return false;
    } 
    else if ((phNum.substring(0,2) != "98") && (phNum.substring(0,2) != "97")) {
        alert("Phone number should begin with 98 or 97");
        return false;
    }
    else {
        //checking if the phone number is only digits
        var numChecker = true;
        for(let i = 2; i < phNum.length; i++){
            if(!(phNum[i] == "0" || phNum[i] == "1" || phNum[i] == "2" || phNum[i] == "3" || phNum[i] == "4" || phNum[i] == "5" || phNum[i] == "6" || phNum[i] == "7" || phNum[i] == "8" || phNum[i] == "9")){
                numChecker = false;
                alert("Invalid phone number! Enter only numbers");
                break;
            }
        }
        return numChecker;
    }
}

function checkForm(event){ //function for validating registration form
    event.preventDefault();
    var valid = false;
    var form = document.forms["registerForm"];
    var name = form["name"].value;
    var address = form["address"].value;
    var phNum = form["phone"].value;
    var email = form["email"].value;

    if(name == '' || address == '' || phNum == '' || email == ''){
        alert("Empty fields found, please fill all the fields");
    }
    else{
        valid = checkPhoneNumber(phNum);
    }

    if(valid == true){
        alert("Thank you for registering! We will email you with the payment information!");
        toggleDisplay('registerPopUpId');
        form["name"].value = '';
        form["address"].value = '';
        form["phone"].value = '';
        form["email"].value = '';
        document.getElementById("slotsAvailable").textContent = parseInt(document.getElementById("slotsAvailable").textContent) - 1;
        if(document.getElementById("slotsAvailable").textContent <= 10){
            document.getElementById("slotsAvailable").style.color = "red";
        }
    }
}

var limits = [3, 7, 2, 7, 1, 7, 4, 7, 5, 7, 4, 7]; //limits on bikes and days respectively 
var prices = [1700, 1850, 1600, 1400, 1300, 1400]; //rent price for every bike

function increaseCounter(index){ //function to increase the bike quantity or days counter
    var counterId = "counter"+index;
    var counterCatcher = document.getElementById(counterId);
    if(parseInt(counterCatcher.textContent) < limits[index]){
        if((counterCatcher.textContent == '0') && (index % 2 == 0)){
            if(document.getElementById("counter" + (index + 1)).textContent == '0'){
                document.getElementById("counter" + (index + 1)).textContent = '1';
            }
        }
        counterCatcher.textContent = parseInt(counterCatcher.textContent) +1;
        updateTotal();
    }
    else{
        counterCatcher.textContent = limits[index];
    }
}

function decreaseCounter(index){ //function to decrease the bike quantity or days counter
    var counterId = "counter"+index;
    var counterCatcher = document.getElementById(counterId);
    if(parseInt(counterCatcher.textContent) > 0){
        if(counterCatcher.textContent == '1'){
            if (index % 2 == 0) {
                document.getElementById("counter" + (index + 1)).textContent = 0;
            }
            else {
                if(parseInt(document.getElementById("counter" + (index - 1)).textContent) > 0){
                    counterCatcher.textContent = "2";
                }
            }
        }
        counterCatcher.textContent = parseInt(counterCatcher.textContent) - 1;
        updateTotal();
    }
    else {
        counterCatcher.textContent = 0;
    }
}

var total = 0;
var bikeElement;
var daysElement;
var bikeQuantity;
var daysCount;

function updateTotal(){ //function to update the total price for rent
    total = 0;
    for(let i = 0; i < 11; i+=2){
        bikeElement = document.getElementById("counter" + i);
        daysElement = document.getElementById("counter" + (i+1));
        bikeQuantity = parseInt(bikeElement.textContent);
        daysCount = parseInt(daysElement.textContent);
        total = total + bikeQuantity*daysCount*prices[i/2];
    }
    document.getElementById("totalPrice").textContent = total;
}

var bikeDetails = [
    {
        name: "Royal Enfield Classic 350",
        imgSrc: "royalEnfield.png"
    },

    {
        name: "Royal Enfield Himalayan 410",
        imgSrc: "royalEnfield410.png"
    },

    {
        name: "Yamaha XTZ 150",
        imgSrc: "xtz150.png"
    },

    {
        name: "Suzuki Gixxer 155",
        imgSrc: "gixer.png"
    },

    {
        name: "Bajaj Pulsar NS 200",
        imgSrc: "ns200.png"
    },

    {
        name: "Apache RTR 200V",
        imgSrc: "apache.png"
    }

];
var selected;
var bikeDiv = document.getElementById("bikeLists"); 

function showConfirmPopUp(){ //function to show popup for rent confirm
    selected = [];
    for(let i = 0; i < 11; i+=2){
        if(document.getElementById("counter"+ i).textContent != '0'){
            selected.push(i);
        }
    }

    if(selected.length == 0){
        alert("No Bike Selected!");
    }
    else{
        toggleDisplay('confirmPopUpId');
        bikeDiv.innerHTML = '';
        for(let j = 0; j < selected.length; j++){
            const newDiv = document.createElement("div");
            newDiv.className = "bikeRentals__confirmPopUp__bikeLists__bike";
            bikeDiv.appendChild(newDiv);

            const bikeimg = document.createElement("img");
            bikeimg.className = "bikeRentals__confirmPopUp__bikeLists__bike__image";
            bikeimg.src = "./Images/" + bikeDetails[selected[j]/2].imgSrc;
            newDiv.appendChild(bikeimg);

            const contentDiv = document.createElement("div");
            contentDiv.className = "bikeRentals__confirmPopUp__bikeLists__bike__details";
            newDiv.appendChild(contentDiv);

            const heading = document.createElement("h2");
            heading.className = "bikeRentals__confirmPopUp__bikeLists__bike__details__heading";
            heading.textContent = bikeDetails[selected[j]/2].name;
            contentDiv.appendChild(heading);

            const quantityAndDays = document.createElement("p");
            quantityAndDays.className = "bikeRentals__confirmPopUp__bikeLists__bike__details__quantityAndDays";
            quantityAndDays.innerHTML = "Quantity: " + document.getElementById('counter' + selected[j]).textContent + "<br/>Days: " + document.getElementById('counter' + (selected[j] + 1)).textContent;
            contentDiv.appendChild(quantityAndDays);
            
            var totalBikePrice = (parseInt(document.getElementById('counter' + selected[j]).textContent) * parseInt(document.getElementById('counter' + (selected[j] + 1)).textContent)) * prices[selected[j]/2];
            const totalPrice = document.createElement("p");
            totalPrice.className = "bikeRentals__confirmPopUp__bikeLists__bike__details__totalPrice";
            totalPrice.textContent = "Total Price: Rs. " + totalBikePrice;
            contentDiv.appendChild(totalPrice);
        }
        if(selected.length ==1){
            if(window.innerWidth > 565){
                document.getElementById("confirmPopUpId").style.height = "520px";
            }else {
                document.getElementById("confirmPopUpId").style.height = "820px";
            }
        } else {
            if(window.innerWidth > 565){
                document.getElementById("confirmPopUpId").style.height = "710px";
            }else {
                document.getElementById("confirmPopUpId").style.height = "790px";
            }
        }
        document.getElementById("totalPriceOnPopUp").textContent = total;
    }
}

//validating form for bike rentals
function validateConfirmForm(event){
    event.preventDefault();
    var confirmForm = document.forms["confirmForm"];
    var confirmFormName = confirmForm["confirmFormName"].value;
    var confirmFormNumber = confirmForm["confirmFormNumber"].value;
    if(confirmFormName == '' || confirmFormNumber == ''){
        alert("Empty fields! Please fill out everything");
    }
    else{
        if (checkPhoneNumber(confirmFormNumber)){
            alert("Thank you for renting! We will call you for further processing");
            confirmForm["confirmFormName"].value = "";
            confirmForm["confirmFormNumber"].value = "";
            toggleDisplay("confirmPopUpId");
            for(let i = 0; i < selected.length; i+=1){
                document.getElementById("counter" + selected[i]).textContent = '0';
                document.getElementById("counter" + (selected[i] + 1)).textContent = '0';
            }
        }
    }
}


//javascript for team members message and image change

var messages = [];
for(let i = 1; i < 4; i++){
    messages.push(document.getElementById("member" + i).innerHTML);
}
var activeMessage = messages[1];

function changeMessageContent(){ //function to change team message
    var j = 0;
    while(activeMessage != messages[j]){
        j++;
    }

    if(j == 0){
        document.getElementById("member1").innerHTML = messages[1];
        document.getElementById("member2").innerHTML = messages[2];
        document.getElementById("member3").innerHTML = messages[0];
        activeMessage = messages[2];
    }
    else if(j == 1){
        document.getElementById("member1").innerHTML = messages[2];
        document.getElementById("member2").innerHTML = messages[0];
        document.getElementById("member3").innerHTML = messages[1];
        activeMessage = messages[0];
    }
    else{
        document.getElementById("member1").innerHTML = messages[0];
        document.getElementById("member2").innerHTML = messages[1];
        document.getElementById("member3").innerHTML = messages[2];
        activeMessage = messages[1];
    }
}

var avatars = ["avatar1", "avatar2", "avatar3"];
var active = "avatar2";

function changeAvatarContent(){ //function to change team avatar accroding to message change
    var i = 0;
    while(active != avatars[i]){
        i++;
    }

    if(i == 0){
        document.getElementById("avatar1").src = "./Images/avatar2.png";
        document.getElementById("avatar2").src = "./Images/avatar3.png";
        document.getElementById("avatar3").src = "./Images/avatar1.png";
        active = "avatar3";
    }
    else if(i == 1){
        document.getElementById("avatar1").src = "./Images/avatar3.png";
        document.getElementById("avatar2").src = "./Images/avatar1.png";
        document.getElementById("avatar3").src = "./Images/avatar2.png";
        active = "avatar1";
    }
    else{
        document.getElementById("avatar1").src = "./Images/avatar1.png";
        document.getElementById("avatar2").src = "./Images/avatar2.png";
        document.getElementById("avatar3").src = "./Images/avatar3.png";
        active = "avatar2";
    }
}

//setting auto intervals for two above functions
setInterval(changeMessageContent, 5000);
setInterval(changeAvatarContent, 5000);

function checkNonEmpty(event, formName){ //function to check the email field is not empty in footer
    event.preventDefault();
    var emailId = document.forms[formName]["newsLetterId"].value;
    if(emailId === ''){
        alert("Empty email");
    }
    else{
        alert("Thank you! You will be alerted of our updates");
        document.forms[formName]["newsLetterId"].value = '';
    }
}
