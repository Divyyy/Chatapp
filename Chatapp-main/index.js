const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = {};    // socket.id => username
const profiles = {}; // socket.id => profile object

io.on('connection', socket => {

  // User joins with { name, profile }
  socket.on('new-user-joined', (data) => {
    let name, profile;
    if (typeof data === 'string') {
      name = data;
      profile = null;
    } else if (typeof data === 'object' && data !== null) {
      name = data.name;
      profile = data.profile;
    } else {
      return;
    }

    users[socket.id] = name;

    if (profile && typeof profile === 'object' && Object.keys(profile).length > 0) {
      profiles[socket.id] = profile;
    } else {
      delete profiles[socket.id];
    }

    socket.broadcast.emit('user-joined', name);
  });

  // Broadcast normal messages
  socket.on('send', message => {
    const userProfile = profiles[socket.id];
    const dataToSend = {
      message,
      name: users[socket.id]
    };

    if (userProfile && Object.keys(userProfile).length > 0) {
      dataToSend.profile = userProfile;
    }

    socket.broadcast.emit('receive', dataToSend);
  });

  // Update profile on demand
  socket.on('update-profile', profile => {
    if (profile && typeof profile === 'object' && Object.keys(profile).length > 0) {
      profiles[socket.id] = profile;
    } else {
      delete profiles[socket.id];
    }
  });

  // Direct Message handling
  socket.on('dm-send', ({ to, message }) => {
    const targetSocketId = Object.keys(users).find(id => users[id] === to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('dm-receive', {
        from: users[socket.id],
        message
      });
    } else {
      socket.emit('dm-error', `User "${to}" not found or not online.`);
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('left', users[socket.id]);
    delete users[socket.id];
    delete profiles[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
