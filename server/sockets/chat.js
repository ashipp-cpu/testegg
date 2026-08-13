const characters = require('../models/character');
const territories = require('../models/territory');
const tribeMemberships = require('../models/tribeMembership');
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
    const localRoom = `territory:${territory.id}`;
    socket.join(localRoom);

    const membership = tribeMemberships.getByCharacterId(character.id);
    const tribeRoom = membership ? `tribe:${membership.tribe_id}` : null;
    if (tribeRoom) socket.join(tribeRoom);

    socket.on('chat:send', (payload) => {
      const channel = payload && payload.channel === 'tribe' ? 'tribe' : 'local';
      const rawBody = payload && payload.body;
      const body = String(rawBody || '').trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!body) return;
      if (channel === 'tribe' && !tribeRoom) return;

      const isEmote = body.startsWith(EMOTE_PREFIX);
      const text = isEmote ? body.slice(EMOTE_PREFIX.length).trim() : body;
      if (!text) return;

      const scopeId = channel === 'tribe' ? membership.tribe_id : territory.id;
      const room = channel === 'tribe' ? tribeRoom : localRoom;

      const message = chatMessages.create({
        channel,
        scope_id: scopeId,
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
