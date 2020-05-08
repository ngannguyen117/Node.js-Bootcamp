const http = require('http');
const socketio = require('socket.io');
const app = require('./src/app');

const port = process.env.PORT;

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  socket.emit('message', 'Welcome to our chatroom');
  socket.broadcast.emit('message', 'A new user has join');

  socket.on('sendMessage', (msg) => {
    io.emit('message', msg);
  });

  socket.on('sendLocation', ({ lat, lng }) =>
    io.emit('message', `https://www.google.com/maps?q=${lat},${lng}`)
  );

  socket.on('disconnect', () => {
    io.emit('message', 'A new has left');
  });
});

server.listen(port, () => console.log(`Server is up on port ${port}`));