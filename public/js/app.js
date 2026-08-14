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

// Purely client-side: clicking a map pin swaps which location's detail
// card is shown. No server round-trip since it's all static reference
// content already rendered on the page.
function initMapPanel() {
  const pins = document.querySelectorAll('.map-pin');
  if (pins.length === 0) return;

  const showLocation = (key) => {
    document.querySelectorAll('.map-pin').forEach((pin) => {
      pin.classList.toggle('active', pin.dataset.location === key);
    });
    document.querySelectorAll('.location-detail').forEach((card) => {
      card.classList.toggle('active', card.dataset.locationDetail === key);
    });
  };

  pins.forEach((pin) => {
    pin.addEventListener('click', () => showLocation(pin.dataset.location));
    pin.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showLocation(pin.dataset.location);
      }
    });
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
  initMapPanel();
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
  initMapPanel();
});
