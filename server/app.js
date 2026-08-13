const path = require('path');
const express = require('express');
const sessionMiddleware = require('./middleware/session');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const tribeRoutes = require('./routes/tribes');
const tribePanelRoutes = require('./routes/tribePanel');
const gameRoutes = require('./routes/game');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(sessionMiddleware);

app.get('/', (req, res) => {
  res.redirect(req.session.userId ? '/game' : '/login');
});

app.use(authRoutes);
app.use(characterRoutes);
app.use(tribeRoutes);
app.use(tribePanelRoutes);
app.use(gameRoutes);

module.exports = app;
