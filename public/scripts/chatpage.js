const socket = io(); //initialize socket connection

var sendContainer = document.getElementById('send-container');
var message = document.getElementById('message');
var messageList = document.getElementById('message-list');
var usersTyping = document.getElementById('users-typing');
var usersOnline = document.getElementById('users-online-list');
var messageContainer = document.getElementById('message-container');
let username = sessionStorage.getItem('username');

//map of valid commands and number of arguments they tank
var validCommands = new Map();
validCommands.set('/whisper', 1);
validCommands.set('/online', 0);
validCommands.set('/whoami', 0);

//create user object
var user = {
    name: username,
    id: socket.id,
}

//if username exists then user was created, else we need to create a random username
if(username) {
    socket.emit('user created', user);
} else {
    socket.emit('create random username', user);
}

//create event listener for sending message
sendContainer.addEventListener('submit', function(e) {
    e.preventDefault(); //prevents page from refreshing after sending message
    if (message.value) {
        //if first char is '/' that means the command is invalid because it wasnt enclosed
        if(message.value.charAt(0) === '/'){
            receiveMessage('', 'Invalid command.', 'server-message');
            message.value = ''; //empty out the message box
            return;
        }

        //as long as message is not a command show your own message
        if (message.value.slice(0,2) !== '[/') { 
            receiveMessage('You', message.value, 'your-message');
        }

        socket.emit('chat message', message.value); //send message (as long as not empty) to the server to broadcast
        message.value = ''; 
        messageContainer.scrollTop = messageContainer.scrollHeight; //scroll to bottom of messages after sending one
    }
});

//create event listener for when a user is typing
message.addEventListener('keyup', (event) => {
    let isCommand = message.value.charAt(0) === '/'; 
    if (isCommand) {
        formatCommand();
    } else if( message.value) {
        socket.emit('user is typing'); //tell the server that this user is typing
    } else {
        socket.emit('user not typing'); //if input is empty tell the server this user is no longer typing
    }
});

//event handling for other users sending messages
socket.on('chat message', (messageData) => {
    receiveMessage(messageData.messageTag, messageData.message, 'public-message');
});

//event handling for other users sending a private message
socket.on('private message', (messageData) => {
    receiveMessage('', `${messageData.messageTag}: ${messageData.message}`, messageData.type);
});

//event handling for server messages
socket.on('server message', (message) => {
    receiveMessage('', message, 'server-message');
})

//event handling for creating anonymous users
socket.on('random username generated', (username) => {
    user.name = username; 
    socket.emit('user created', user); //user done creating
});

//event handling for other users connecting
socket.on('user connected', (data) => {
    //receive message that some user connected as long as its not the current one
    if(data.user.name !== user.name) {
        receiveMessage('', `${data.user.name} has connected.`, 'server-message');
    } else {
        receiveMessage('', 'You joined.', 'server-message'); //show that you have connected to the chat
    }
    displayUsersOnline(data.usersConnected);
});

//event handling for other users disconnectiong
socket.on('user disconnected', (data) => {
    receiveMessage('', `${data.user.name} has disconnected`, 'server-message');
    delete data.usersConnected[data.user.id]; //delete the user that disconnected from the list
    displayUsersOnline(data.usersConnected);
});

//event handling for displaying all users typing
socket.on('users typing', (users) => {
    displayUsersTyping(users);
});

//helper function for creating and appending message
function receiveMessage(username, message, type) {
    var messageToReceive = document.createElement('li');
    var usernameTag = document.createElement('p')
    var messageText = document.createElement('p')

    // set ids for stylings
    messageToReceive.setAttribute('id', type); 
    // if it is your message adjust the usernametag id for styling purposes
    (type === 'your-message') ? usernameTag.setAttribute('id', 'your-tag') : usernameTag.setAttribute('id', 'username-tag');
    messageText.setAttribute('id', 'message-text');

    messageText.innerHTML = message;

    //if username is provided then initialize the tag
    if (username) { 
        usernameTag.innerHTML = username;
        messageToReceive.appendChild(usernameTag); 
    }

    messageToReceive.appendChild(messageText);
    messageList.appendChild(messageToReceive);
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
    
    //determines the users and text to be displayed
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

        //Show where the current user is on the list
        if(user.name === userData[i].name) {
            username.textContent += ' (You)';
        }

        usersOnline.appendChild(username);
    }
}

//helper function to format commands in textbox
function formatCommand(){
    let words = message.value.split(' ');
    let command = words[0];
    let numArgs = validCommands.get(command);
    
    if(validCommands.has(command)) {
        //if command takes 0 arguments we can format it directly
        if(numArgs == 0) {
            message.value = '[' + command + '] ';
        } else {
            if(numArgs + 2 == words.length){
                message.value = '[' + words.slice(0,2).join(' ') + '] ';
            }
        }
    } else {
        if(words.length == 2) {
            message.value = '[' + command + '] ';
        }
    }
    return;
}