const characters = require('../models/character');
const territories = require('../models/territory');
const chatMessages = require('../models/chatMessage');

const EMOTE_PREFIX = '/me ';
const MAX_MESSAGE_LENGTH = 500;

function registerChatHandlers(io) {
  io.on('connection', (socket) => {
    const userId = socket.handshake.session.userId;
    const character = userId ? characters.getByUserId(userId) : null;
    if (!character) {
      socket.disconnect(true);
      return;
    }

    const territory = territories.getById(character.location_id);
    const room = `territory:${territory.id}`;
    socket.join(room);

    socket.on('chat:send', (rawBody) => {
      const body = String(rawBody || '').trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!body) return;

      const isEmote = body.startsWith(EMOTE_PREFIX);
      const text = isEmote ? body.slice(EMOTE_PREFIX.length).trim() : body;
      if (!text) return;

      const message = chatMessages.create({
        channel: 'local',
        scope_id: territory.id,
        sender_character_id: character.id,
        sender_name: character.name,
        body: text,
        type: isEmote ? 'emote' : 'say',
      });

      io.to(room).emit('chat:message', message);
    });
  });
}

module.exports = registerChatHandlers;
