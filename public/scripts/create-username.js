var usernameForm = document.getElementById('username-form');
var username = document.getElementById('username');

usernameForm.addEventListener('submit', function(e) {
    //create user object
    localStorage.setItem("username", username.value); //store the username in local storage so it can be accessed again if user refreshes
});

