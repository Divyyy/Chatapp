const socket = io(); 

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');
const dmButton = document.getElementById('dm-button');

const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message', position);
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; // Auto scroll
};

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (!message.trim()) return; 
    append(`You: ${message}`, 'right');
    socket.emit('send', message);
    messageInput.value = '';
});

const name = prompt("Enter your name to join");

// Example profile data (customize as you want)
const profile = {
  avatar: '',
  bio: 'Hello! I just joined the chat'
};

socket.emit('new-user-joined', { name, profile });

socket.on('user-joined', name => {
    append(`${name} joined the chat`, 'right');
});

socket.on('receive', data => {
    append(`${data.name}: ${data.message}`, 'left');
});

socket.on('left', name => {
    append(`${name} left the chat`, 'left');
});

// DM send function
function sendDirectMessage() {
  const to = prompt("Enter the name of the user to DM:");
  if (!to || to.trim() === '') return alert('No user specified.');

  const message = prompt("Enter your direct message:");
  if (!message || message.trim() === '') return alert('No message entered.');

  append(`You (DM to ${to}): ${message}`, 'right');

  socket.emit('dm-send', { to, message });
}

dmButton.addEventListener('click', sendDirectMessage);

socket.on('dm-receive', ({ from, message }) => {
  append(`DM from ${from}: ${message}`, 'left');
});

socket.on('dm-error', (errorMsg) => {
  alert(errorMsg);
});
