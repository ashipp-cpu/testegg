// Lets HTTP route handlers push a live socket event (e.g. a system message
// after an election resolves) without threading the io instance through
// every function call. Set once in server.js.
let io = null;

function setIO(instance) {
  io = instance;
}

function getIO() {
  return io;
}

module.exports = { setIO, getIO };
