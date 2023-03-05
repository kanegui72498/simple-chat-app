var socket = io();
      
var chatBox = document.getElementById('chat-box');
var message = document.getElementById('message');
var messageList = document.getElementById('message-list');

//ask for username
const username = prompt('Enter username:');
messageList.append('You joined.'); //show that you have connected to the chat
socket.emit('user created', username)

//create event listener for sending message
chatBox.addEventListener('submit', function(e) {
    e.preventDefault(); //prevents page from refreshing after sending message
    if (message.value) {
        socket.emit('chat message', message.value); //send message (as long as not empty) to the server
        messageList.append(`You: ${message.value}`) //show your own message
        message.value = ''; //empty out the message box
    }
});

//event handling for 'chat message'
socket.on('chat message', function(messageData) {
    sendMessage(`${messageData.username}: ${messageData.message}`);
});

//event handling for 'user connected'
socket.on('user connected', username => {
   sendMessage(`${username} has connected.`);
});

//event handling for 'user disconnected'
socket.on('user disconnected', (username) => {
    sendMessage(`${username} has disconnected`);
});

//helper function for creating and appending message
function sendMessage(message) {
    var messageToSend = document.createElement('li');
    messageToSend.textContent = message;
    messageList.appendChild(messageToSend);
    window.scrollTo(0, document.body.scrollHeight);
}