var usernameForm = document.getElementById('username-form');
var username = document.getElementById('username');

usernameForm.addEventListener('submit', function(e) {
    //create user object
    sessionStorage.setItem("username", username.value); //store the username in session storage so it can work accross multiple windows
});

