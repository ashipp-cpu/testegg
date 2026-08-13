const http = require('http');
const { Server } = require('socket.io');
const sharedSession = require('express-socket.io-session');

const app = require('./app');
const sessionMiddleware = require('./middleware/session');
const seed = require('./db/seed');
const registerChatHandlers = require('./sockets/chat');

seed();

const server = http.createServer(app);
const io = new Server(server);

io.use(sharedSession(sessionMiddleware, { autoSave: true }));
registerChatHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Tribe prototype listening on http://localhost:${PORT}`);
});
