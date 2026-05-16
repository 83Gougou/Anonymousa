const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const VALID_ITEMS = require('./items-server');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const TURN_TIME = 30;
const MAX_PLAYERS = 4;

function genCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on('connection', (socket) => {

  socket.on('create_room', ({ username }) => {
    const code = genCode();
    rooms[code] = {
      code, players: [{ id: socket.id, username, alive: true }],
      usedItems: [], usedSet: new Set(),
      currentIdx: 0, gameStarted: false, turnTimeout: null,
      rematchReady: new Set()
    };
    socket.join(code);
    socket.roomCode = code;
    socket.username = username;
    socket.emit('room_created', { code });
    broadcastLobby(code);
  });

  socket.on('join_room', ({ code, username }) => {
    const room = rooms[code];
    if (!room) return socket.emit('error', 'Room introuvable !');
    if (room.gameStarted) return socket.emit('error', 'Partie déjà en cours !');
    if (room.players.length >= MAX_PLAYERS) return socket.emit('error', 'Room pleine (4 max) !');
    if (room.players.find(p => p.username === username)) return socket.emit('error', 'Pseudo déjà pris !');

    room.players.push({ id: socket.id, username, alive: true });
    socket.join(code);
    socket.roomCode = code;
    socket.username = username;
    socket.emit('room_joined', { code });
    broadcastLobby(code);
  });

  socket.on('start_game', () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room || room.gameStarted) return;
    if (room.players[0].id !== socket.id) return socket.emit('error', 'Seul le créateur peut lancer !');
    if (room.players.length < 2) return socket.emit('error', 'Il faut au moins 2 joueurs !');
    startGame(code);
  });

  socket.on('submit_item', ({ item }) => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room || !room.gameStarted) return;
    const alive = room.players.filter(p => p.alive);
    const current = alive[room.currentIdx % alive.length];
    if (!current || current.id !== socket.id) return socket.emit('not_your_turn');

    const norm = item.toLowerCase().trim().replace(/ /g, '_');
    if (!VALID_ITEMS.has(norm)) return socket.emit('item_result', { ok: false, reason: 'invalid', item: norm });
    if (room.usedSet.has(norm)) return socket.emit('item_result', { ok: false, reason: 'used', item: norm });

    clearTimeout(room.turnTimeout);
    room.usedItems.push({ player: socket.username, item: norm });
    room.usedSet.add(norm);

    io.to(code).emit('item_accepted', { player: socket.username, item: norm, total: room.usedItems.length });
    socket.emit('item_result', { ok: true, item: norm });
    room.currentIdx++;
    nextTurn(code);
  });

  socket.on('give_up', () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room || !room.gameStarted) return;
    eliminatePlayer(code, socket.id, 'abandon');
  });

  socket.on('rematch', () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room) return;
    room.rematchReady.add(socket.id);
    io.to(code).emit('rematch_status', { ready: room.rematchReady.size, total: room.players.length });
    if (room.rematchReady.size >= room.players.length) {
      room.rematchReady.clear();
      startGame(code);
    }
  });

  socket.on('disconnect', () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room) return;
    if (room.gameStarted) {
      eliminatePlayer(code, socket.id, 'disconnect');
    } else {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) { delete rooms[code]; return; }
      broadcastLobby(code);
    }
  });
});

function broadcastLobby(code) {
  const room = rooms[code];
  io.to(code).emit('lobby_update', {
    players: room.players.map(p => ({ username: p.username, isHost: p.id === room.players[0].id })),
    canStart: room.players.length >= 2
  });
}

function startGame(code) {
  const room = rooms[code];
  room.gameStarted = true;
  room.usedItems = [];
  room.usedSet = new Set();
  room.currentIdx = 0;
  room.players.forEach(p => p.alive = true);
  // shuffle
  for (let i = room.players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [room.players[i], room.players[j]] = [room.players[j], room.players[i]];
  }
  io.to(code).emit('game_start', { players: room.players.map(p => p.username) });
  setTimeout(() => nextTurn(code), 1200);
}

function nextTurn(code) {
  const room = rooms[code];
  if (!room) return;
  const alive = room.players.filter(p => p.alive);
  if (alive.length <= 1) {
    endGame(code, alive[0]?.username);
    return;
  }
  const current = alive[room.currentIdx % alive.length];
  io.to(code).emit('turn_start', { player: current.username, timeLimit: TURN_TIME });
  room.turnTimeout = setTimeout(() => {
    eliminatePlayer(code, current.id, 'timeout');
  }, TURN_TIME * 1000);
}

function eliminatePlayer(code, socketId, reason) {
  const room = rooms[code];
  if (!room) return;
  clearTimeout(room.turnTimeout);
  const player = room.players.find(p => p.id === socketId);
  if (!player || !player.alive) return;
  player.alive = false;

  const alive = room.players.filter(p => p.alive);
  io.to(code).emit('player_eliminated', { player: player.username, reason, aliveCount: alive.length });

  if (alive.length <= 1) {
    setTimeout(() => endGame(code, alive[0]?.username), 800);
  } else {
    // adjust idx
    const newAlive = room.players.filter(p => p.alive);
    room.currentIdx = room.currentIdx % newAlive.length;
    setTimeout(() => nextTurn(code), 1200);
  }
}

function endGame(code, winner) {
  const room = rooms[code];
  if (!room) return;
  room.gameStarted = false;
  room.rematchReady = new Set();
  io.to(code).emit('game_over', {
    winner,
    usedItems: room.usedItems,
    total: room.usedItems.length
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
