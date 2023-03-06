const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const usersConnected = {}; //create mapping for all users that are connected
const usersTyping = {}; //create mapping for all users that are typing

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//when user loads website create a socket
io.on('connection', (socket) => {
  //On username creation inform all other connected sockets
  socket.on('user created', (user) => {
    user.id = socket.id; //set the user id to socket id
    usersConnected[socket.id] = user; //every socket has unique id, set the username to array
    io.emit('user connected', {user: user, usersConnected: usersConnected});
  })

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
      socket.broadcast.emit('chat message', {message: message, username: currentUser(socket.id).name});
      delete usersTyping[socket.id]; //user is no longer typing after sending message
      socket.broadcast.emit('users typing', usersTyping); //send updated list of users typing to other sockets
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