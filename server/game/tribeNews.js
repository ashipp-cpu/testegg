const chatMessages = require('../models/chatMessage');
const { getIO } = require('../sockets/ioRegistry');

// Posts a system message into a tribe's chat/news feed and pushes it live
// to anyone with the tribe panel open.
function announce(tribeId, body) {
  const message = chatMessages.postSystem('tribe', tribeId, body);
  const io = getIO();
  if (io) io.to(`tribe:${tribeId}`).emit('chat:message', message);
  return message;
}

module.exports = { announce };
