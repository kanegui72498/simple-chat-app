const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const usersConnected = {}; //create mapping for all users that are connected
const usersTyping = {}; //create mapping for all users that are typing
var anonUserCount = 0;

app.use(express.static(__dirname + '/public'));

//route for chat page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//route for create username page
app.get('/create-username', (req, res) => {
  res.sendFile(__dirname + '/create-username.html');
});

//redirect to chat page after creating username
app.post('/create-username', (req, res) => {
  res.redirect('/');
});

//when user connects retrieve their socket
io.on('connection', (socket) => {
  //On username creation inform all other connected sockets
  socket.on('user created', (user) => {
    user.id = socket.id; //set the user id to socket id
    usersConnected[socket.id] = user; //every socket has unique id, set the user with it
    io.emit('user connected', {user: user, usersConnected: usersConnected});
  })

  //create random user if username was not created
  socket.on('create random username', () => {
    generatedName = `Anonymous${++anonUserCount}`;
    socket.emit('random username generated', generatedName);
  });

  //On socket disconnect inform all other connected sockets
  socket.on('disconnect', () => {
    if(currentUser(socket.id)) { // check to see user exists
      socket.broadcast.emit('user disconnected', {user: currentUser(socket.id), usersConnected: usersConnected});
      delete usersConnected[socket.id]; //remove the user from the list of connected users
      delete usersTyping[socket.id]; //user can no longer be typing if they are not connected
    }
  });

  //On chat message, send the message to all other sockets connected
  socket.on('chat message', (message) => {
    if(currentUser(socket.id)){
      if(message.slice(0,2) === '[/') { //messages that start with '[/' are considered commands
        executeCommand(socket, message);
      } else {
        socket.broadcast.emit('chat message', {messageTag: currentUser(socket.id).name, message: message});
        delete usersTyping[socket.id]; //user is no longer typing after sending message
        socket.broadcast.emit('users typing', usersTyping); //send updated list of users typing to other sockets
      }
    }
  });

  //On some user typing, inform all other sockets connected
  socket.on('user is typing', () => {
    if(currentUser(socket.id)) { //check to see user exists
      usersTyping[socket.id] = currentUser(socket.id).name; //add current user to the list of users typing
      socket.broadcast.emit('users typing', usersTyping);
    }
  });

  //On some user no longer typing, stop informing all other sockets
  socket.on('user not typing', () => {
    delete usersTyping[socket.id];
    socket.broadcast.emit('users typing', usersTyping);
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

//helper function to get the current user
function currentUser(socketId){
  return usersConnected[socketId];
}

//helper function to parse commands. commands begin with '/' and enclosed in [ ]
function executeCommand(socket, fullString){
  let closingIndex = fullString.indexOf(']');
  let message = fullString.slice(closingIndex + 1); // get the message
  let commandTag = fullString.slice(1, closingIndex); //get the command tag [command arg arg ...]
  let commandAndArgs = commandTag.split(' ');
  let command = commandAndArgs[0]; 

  //improperly formatted command tag
  if(closingIndex == -1){
    socket.emit('server message', 'Command not properly formatted. Missing closing bracket');
    return;
  }

  //private messaging
  if(command === '/whisper') {
    let username = commandAndArgs[1];
    let user = getUserByName(username);

    if(!user) {
      //user does not exist
      socket.emit('server message', 'User does not exist.');
      return;
    }

    if(!message){
      socket.emit('server message', 'Message cannot be empty.');
      return;
    }

    if(user) {
      //user cannot private message themselves
      if(user.id === socket.id) {
        socket.emit('server message', 'You cannot whisper yourself.');
      } else {
        //show your own private message that you sent
        socket.emit('private message', {
          messageTag: `[<b>You</b> <i>whispered</i> <b>${username}</b>]`,
           message: message, 
           type: 'your-private-message'
        });
        
        //send private message to user by id
        socket.to(user.id).emit('private message', {
          messageTag: `[<b>${currentUser(socket.id).name}</b> <i>whispered</i>]`, 
          message: message, 
          type: 'private-message'
        });
      }
      return;
    }

  //send information on the current number of users online
  } else if(command === '/online') { 
    let numUsersOnline = Object.values(usersConnected).length;
    socket.emit('server message', `There are currently ${numUsersOnline} user(s) online.`);
    return;

  //get username from server
  } else if(command === '/whoami') {
    socket.emit('server message', `You are <b>${currentUser(socket.id).name}.</b>`);
    return;

  //unable to match command
  } else {
    socket.emit('server message', 'Invalid command.');
    return;
  }
}

//helper function to find if user exists
function getUserByName(username) {
  var userFound;
  Object.values(usersConnected).forEach((user) => {
    if(user.name === username){
      userFound = user;
    }
  });
  return userFound;
} 