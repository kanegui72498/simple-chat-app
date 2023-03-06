var socket = io();
      
var sendContainer = document.getElementById('send-container');
var message = document.getElementById('message');
var messageList = document.getElementById('message-list');
var usersTyping = document.getElementById('users-typing');
var usersOnline = document.getElementById('users-online-list');

//ask for username
const username = prompt('Enter username:');

//create user object
let user = {
    name: (username) ? username : 'Anonymous', //name is 'Anonymous' if nothing is inputted
    id: '', 
}

sendMessage('You joined.'); //show that you have connected to the chat
socket.emit('user created', user);

//create event listener for sending message
sendContainer.addEventListener('submit', function(e) {
    e.preventDefault(); //prevents page from refreshing after sending message
    if (message.value) {
        socket.emit('chat message', message.value); //send message (as long as not empty) to the server
        sendMessage(`You: ${message.value}`) //show your own message
        message.value = ''; //empty out the message box
    }
});

//create event listener for when a user is typing
message.addEventListener('keyup', function(e) {
    if(message.value) {
        socket.emit('user is typing'); //tell the server that this user is typing
    } else {
        socket.emit('user not typing'); //if input is tell the server this user is no longer typing
    }
});

//event handling for other users sending messages
socket.on('chat message', function(messageData) {
    sendMessage(`${messageData.username}: ${messageData.message}`);
});

//event handling for other users connecting
socket.on('user connected', (data) => {
    //send message that some user connected as long as its not the current one
    if(data.user.name !== user.name) {
        sendMessage(`${data.user.name} has connected.`);
    }
    displayUsersOnline(data.usersConnected);
});

//event handling for other users disconnectiong
socket.on('user disconnected', (data) => {
    sendMessage(`${data.user.name} has disconnected`);
    delete data.usersConnected[data.user.id]; //delete the user that disconnected from the list
    displayUsersOnline(data.usersConnected);
});

//event handling for displaying all users typing
socket.on('users typing', (users) => {
    displayUsersTyping(users);
});

//helper function for creating and appending message
function sendMessage(message) {
    var messageToSend = document.createElement('li');
    messageToSend.textContent = message;
    messageList.appendChild(messageToSend);
    window.scrollTo(0, document.body.scrollHeight);
}

//function to display other users typing
function displayUsersTyping(users) {
    var numUsersTyping = Object.keys(users).length;
    const usernames = Object.values(users);

    // current user should not be included in number of other users typing
    if(usernames.includes(user.name)) { 
        numUsersTyping--;
    } 
    
    if(numUsersTyping == 1) {
        let username = (usernames[0] != user.name) ? usernames[0] : usernames[1]; //display the user that is not the current one
        usersTyping.innerText = `${username} is typing...`;
    } else if (numUsersTyping == 0) {
        usersTyping.innerText = '';
    } else {
        let message = '';
        for(let i = 0; i < usernames.length; i++){
            //on the last user concat 'and' instead
            if(i == usernames.length - 1){
               message += `and ${usernames[i]} `;
               break;
            }

            //display if it does not match the current user
            if(usernames[i] != user.name) {
                message += `${usernames[i]}, `
            }
        }
        message += 'are typing...'
        usersTyping.innerText = message;
    }
}

//function to display the users that are currently online
function displayUsersOnline(users) {
    usersOnline.innerHTML = ''; //clear out old state
    const userData = Object.values(users);

    //iterate over users connected and create new list
    for(let i = 0; i < userData.length; i++){
        let username = document.createElement('li');
        username.textContent = userData[i].name;
        usersOnline.appendChild(username);
    }
}