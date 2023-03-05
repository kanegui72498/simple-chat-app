const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const usersConnected = []; //empty array of all users connected

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//when user loads website create a socket
io.on('connection', (socket) => {
  //On username creation inform all other connected sockets
  socket.on('user created', (username) => {
    usersConnected[socket.id] = username; //every socket has unique id, set the username to array
    socket.broadcast.emit('user connected', username)
  })

  //On socket disconnect inform all other connected sockets
  socket.on('disconnect', () => {
    if(usersConnected[socket.id]) { // check if user actually existed to avoid null state
      socket.broadcast.emit('user disconnected', usersConnected[socket.id]);
    }
  });

  //On chat message, send the message to all other sockets connected
  socket.on('chat message', (message) => {
    socket.broadcast.emit('chat message', message);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});