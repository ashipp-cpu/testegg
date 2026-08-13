// Persistent for the whole session — the shell only loads once now, so
// the socket survives panel navigation instead of reconnecting each time.
const socket = io();

function appendChatMessage(log, msg) {
  const p = document.createElement('p');
  p.className = `chat-line chat-${msg.type}`;

  if (msg.type === 'system') {
    p.appendChild(document.createTextNode(msg.body));
  } else {
    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = msg.type === 'emote' ? msg.sender_name : `${msg.sender_name}:`;
    p.appendChild(sender);
    p.appendChild(document.createTextNode(' ' + msg.body));
  }

  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

socket.on('chat:message', (msg) => {
  const form = document.getElementById('chat-form');
  const log = document.getElementById('chat-log');
  if (!form || !log || form.dataset.channel !== msg.channel) return;
  appendChatMessage(log, msg);
});

// Re-run after every panel load (initial page load and every htmx swap)
// since the chat widget's DOM nodes are recreated each time.
function initChatWidget() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const log = document.getElementById('chat-log');
  if (!form || !input || !log) return;

  log.scrollTop = log.scrollHeight;
  const channel = form.dataset.channel || 'local';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    socket.emit('chat:send', { channel, body: value });
    input.value = '';
  });
}

function syncActiveNav(panelName) {
  document.querySelectorAll('a[data-panel]').forEach((link) => {
    link.classList.toggle('active', link.dataset.panel === panelName);
  });
}

function currentPanelName() {
  const root = document.getElementById('panel-root');
  return root && root.firstElementChild && root.firstElementChild.dataset.panel;
}

document.addEventListener('DOMContentLoaded', () => {
  initChatWidget();
  const panelName = currentPanelName();
  if (panelName) syncActiveNav(panelName);
});

// Fires after htmx swaps #panel-root's content — a nav click (explicit
// hx-target="#panel-root") or a form submission inside it (inherited
// target, since those forms are actual descendants of #panel-root).
document.body.addEventListener('htmx:afterSettle', (event) => {
  if (event.target.id !== 'panel-root') return;
  const panelName = currentPanelName();
  if (panelName) syncActiveNav(panelName);
  initChatWidget();
});
