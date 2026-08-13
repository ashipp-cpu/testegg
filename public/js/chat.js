const socket = io();
const log = document.getElementById('chat-log');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const channel = form.dataset.channel || 'local';

function appendMessage(msg) {
  const p = document.createElement('p');
  p.className = `chat-line chat-${msg.type}`;

  const sender = document.createElement('span');
  sender.className = 'sender';
  sender.textContent = msg.type === 'emote' ? msg.sender_name : `${msg.sender_name}:`;

  p.appendChild(sender);
  p.appendChild(document.createTextNode(' ' + msg.body));
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

socket.on('chat:message', (msg) => {
  if (msg.channel === channel) appendMessage(msg);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  socket.emit('chat:send', { channel, body: value });
  input.value = '';
});

log.scrollTop = log.scrollHeight;
