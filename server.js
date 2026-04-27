const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '5mb' }));

// ─── State ────────────────────────────────────────────────────────────────────

const lobbies = {}; // lobbyId → lobby object

function createLobby(hostSocket, pseudo) {
  const id = generateCode();
  const player = makePlayer(hostSocket.id, pseudo);
  player.isHost = true;
  lobbies[id] = {
    id,
    players: [player],
    phase: 'lobby',       // lobby | music | drawing | vote | results | final
    round: 0,
    maxRounds: 0,         // set at game start = player count
    masterIndex: 0,
    currentMusic: null,
    drawings: {},         // socketId → { dataUrl, pseudo }
    votes: {},            // voterSocketId → targetSocketId
    roundScores: {},
    timer: null,
    timerEnd: null,
    drawingDuration: 0,
  };
  return { lobby: lobbies[id], player };
}

function makePlayer(socketId, pseudo) {
  return { id: socketId, pseudo, score: 0, isHost: false, connected: true };
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while (lobbies[code]);
  return code;
}

function getLobbyOfSocket(socketId) {
  return Object.values(lobbies).find(l => l.players.some(p => p.id === socketId));
}

function publicLobby(lobby) {
  return {
    id: lobby.id,
    phase: lobby.phase,
    round: lobby.round,
    maxRounds: lobby.maxRounds,
    masterIndex: lobby.masterIndex,
    timerEnd: lobby.timerEnd,
    currentMusic: lobby.currentMusic,
    players: lobby.players.map(p => ({ id: p.id, pseudo: p.pseudo, score: p.score, isHost: p.isHost, connected: p.connected })),
  };
}

function broadcastLobby(lobby) {
  io.to(lobby.id).emit('lobby:update', publicLobby(lobby));
}

function getMaster(lobby) {
  const connected = lobby.players.filter(p => p.connected);
  if (!connected.length) return null;
  return lobby.players[lobby.masterIndex % lobby.players.length];
}

// ─── YouTube validation ───────────────────────────────────────────────────────

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    return u.searchParams.get('v');
  } catch { return null; }
}

async function validateYouTube(url) {
  const videoId = extractVideoId(url);
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return { valid: false, error: 'Lien YouTube invalide.' };
  try {
    const res = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { timeout: 5000 });
    return { valid: true, videoId, title: res.data.title, thumbnail: res.data.thumbnail_url };
  } catch (e) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) return { valid: false, error: 'Vidéo privée ou non disponible.' };
    if (e.response && e.response.status === 404) return { valid: false, error: 'Vidéo introuvable.' };
    return { valid: false, error: 'Impossible de vérifier la vidéo.' };
  }
}

// ─── Game flow ────────────────────────────────────────────────────────────────

function clearLobbyTimer(lobby) {
  if (lobby.timer) { clearTimeout(lobby.timer); lobby.timer = null; }
}

function startDrawingPhase(lobby, music) {
  lobby.phase = 'drawing';
  lobby.drawings = {};
  lobby.currentMusic = music;
  const duration = Math.min(music.duration || 120, 120) * 1000;
  lobby.drawingDuration = duration;
  lobby.timerEnd = Date.now() + duration;

  broadcastLobby(lobby);
  io.to(lobby.id).emit('phase:drawing', { music, duration: Math.floor(duration / 1000) });

  clearLobbyTimer(lobby);
  lobby.timer = setTimeout(() => endDrawingPhase(lobby), duration + 2000);
}

function endDrawingPhase(lobby) {
  clearLobbyTimer(lobby);
  lobby.phase = 'vote';
  const VOTE_DURATION = 25000;
  lobby.timerEnd = Date.now() + VOTE_DURATION;
  lobby.votes = {};

  const drawingList = Object.entries(lobby.drawings).map(([sid, d]) => ({ id: sid, dataUrl: d.dataUrl }));
  const master = getMaster(lobby);

  broadcastLobby(lobby);
  io.to(lobby.id).emit('phase:vote', {
    drawings: drawingList,
    thumbnail: lobby.currentMusic?.thumbnail,
    duration: VOTE_DURATION / 1000
  });

  lobby.timer = setTimeout(() => endVotePhase(lobby), VOTE_DURATION);
}

function endVotePhase(lobby) {
  clearLobbyTimer(lobby);
  lobby.phase = 'results';

  // tally votes
  const tally = {};
  lobby.players.forEach(p => { tally[p.id] = 0; });
  Object.values(lobby.votes).forEach(targetId => { if (tally[targetId] !== undefined) tally[targetId]++; });

  // apply scores
  lobby.roundScores = {};
  lobby.players.forEach(p => {
    const earned = tally[p.id] || 0;
    p.score += earned;
    lobby.roundScores[p.id] = earned;
  });

  const drawingReveal = Object.entries(lobby.drawings).map(([sid, d]) => {
    const player = lobby.players.find(p => p.id === sid);
    return { id: sid, pseudo: player?.pseudo || '?', dataUrl: d.dataUrl, votes: tally[sid] || 0 };
  });

  broadcastLobby(lobby);
  io.to(lobby.id).emit('phase:results', {
    drawings: drawingReveal,
    votes: lobby.votes,
    roundScores: lobby.roundScores,
    players: lobby.players.map(p => ({ id: p.id, pseudo: p.pseudo, score: p.score }))
  });

  lobby.timer = setTimeout(() => nextRound(lobby), 8000);
}

function nextRound(lobby) {
  clearLobbyTimer(lobby);
  lobby.round++;

  if (lobby.round >= lobby.maxRounds) {
    endGame(lobby);
    return;
  }

  // rotate master
  const connected = lobby.players.filter(p => p.connected);
  lobby.masterIndex = (lobby.masterIndex + 1) % lobby.players.length;
  // skip disconnected
  let tries = 0;
  while (!lobby.players[lobby.masterIndex % lobby.players.length]?.connected && tries < lobby.players.length) {
    lobby.masterIndex++;
    tries++;
  }

  lobby.phase = 'music';
  lobby.currentMusic = null;
  lobby.timerEnd = null;
  broadcastLobby(lobby);
  io.to(lobby.id).emit('phase:music', { master: getMaster(lobby) });
}

function endGame(lobby) {
  lobby.phase = 'final';
  const sorted = [...lobby.players].sort((a, b) => b.score - a.score);
  broadcastLobby(lobby);
  io.to(lobby.id).emit('phase:final', { players: sorted.map(p => ({ id: p.id, pseudo: p.pseudo, score: p.score })) });
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rateLimits = {};
function rateLimit(socketId, action, maxPerSec = 5) {
  const key = `${socketId}:${action}`;
  const now = Date.now();
  if (!rateLimits[key]) rateLimits[key] = [];
  rateLimits[key] = rateLimits[key].filter(t => now - t < 1000);
  if (rateLimits[key].length >= maxPerSec) return false;
  rateLimits[key].push(now);
  return true;
}

// ─── Socket handlers ──────────────────────────────────────────────────────────

io.on('connection', (socket) => {

  // ── Lobby creation
  socket.on('lobby:create', ({ pseudo }) => {
    pseudo = String(pseudo || '').trim().slice(0, 20);
    if (!pseudo) return socket.emit('error', 'Pseudo requis.');
    const { lobby, player } = createLobby(socket, pseudo);
    socket.join(lobby.id);
    socket.emit('lobby:joined', { lobbyId: lobby.id, playerId: socket.id, isHost: true });
    broadcastLobby(lobby);
  });

  // ── Lobby join
  socket.on('lobby:join', ({ lobbyId, pseudo }) => {
    pseudo = String(pseudo || '').trim().slice(0, 20);
    lobbyId = String(lobbyId || '').trim().toUpperCase();
    if (!pseudo) return socket.emit('error', 'Pseudo requis.');
    const lobby = lobbies[lobbyId];
    if (!lobby) return socket.emit('error', 'Lobby introuvable.');
    if (lobby.phase !== 'lobby') return socket.emit('error', 'Partie déjà en cours.');

    // check reconnect
    const existing = lobby.players.find(p => p.pseudo.toLowerCase() === pseudo.toLowerCase() && !p.connected);
    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
      socket.join(lobbyId);
      socket.emit('lobby:joined', { lobbyId, playerId: socket.id, isHost: existing.isHost });
      broadcastLobby(lobby);
      return;
    }

    if (lobby.players.length >= 6) return socket.emit('error', 'Lobby plein (max 6).');
    const pseudoTaken = lobby.players.some(p => p.pseudo.toLowerCase() === pseudo.toLowerCase() && p.connected);
    if (pseudoTaken) return socket.emit('error', 'Pseudo déjà pris.');

    const player = makePlayer(socket.id, pseudo);
    lobby.players.push(player);
    socket.join(lobbyId);
    socket.emit('lobby:joined', { lobbyId, playerId: socket.id, isHost: false });
    broadcastLobby(lobby);
  });

  // ── Start game
  socket.on('game:start', () => {
    const lobby = getLobbyOfSocket(socket.id);
    if (!lobby) return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player?.isHost) return socket.emit('error', 'Seul le host peut démarrer.');
    const connected = lobby.players.filter(p => p.connected);
    if (connected.length < 2) return socket.emit('error', 'Il faut au moins 2 joueurs.');

    lobby.round = 0;
    lobby.maxRounds = lobby.players.length;
    lobby.masterIndex = Math.floor(Math.random() * lobby.players.length);
    lobby.phase = 'music';
    lobby.timerEnd = null;

    broadcastLobby(lobby);
    io.to(lobby.id).emit('phase:music', { master: getMaster(lobby) });
  });

  // ── Music submit (master only)
  socket.on('music:submit', async ({ url }) => {
    if (!rateLimit(socket.id, 'music', 2)) return;
    const lobby = getLobbyOfSocket(socket.id);
    if (!lobby || lobby.phase !== 'music') return;
    const master = getMaster(lobby);
    if (!master || master.id !== socket.id) return socket.emit('error', 'Tu n\'es pas le maître du jeu.');

    url = String(url || '').trim().slice(0, 200);
    socket.emit('music:validating');

    const result = await validateYouTube(url);
    if (!result.valid) return socket.emit('error', result.error);

    const music = { videoId: result.videoId, title: result.title, thumbnail: result.thumbnail, url, duration: 90 };
    startDrawingPhase(lobby, music);
  });

  // ── Drawing submit
  socket.on('drawing:submit', ({ dataUrl }) => {
    if (!rateLimit(socket.id, 'drawing', 3)) return;
    const lobby = getLobbyOfSocket(socket.id);
    if (!lobby || lobby.phase !== 'drawing') return;
    if (!dataUrl || typeof dataUrl !== 'string') return;
    if (dataUrl.length > 2 * 1024 * 1024) return socket.emit('error', 'Dessin trop lourd.');
    if (!dataUrl.startsWith('data:image/')) return;

    lobby.drawings[socket.id] = { dataUrl };
    socket.emit('drawing:saved');

    // auto-end if all connected non-master players submitted
    const connected = lobby.players.filter(p => p.connected);
    const submitted = connected.filter(p => lobby.drawings[p.id]);
    if (submitted.length >= connected.length) {
      clearLobbyTimer(lobby);
      setTimeout(() => endDrawingPhase(lobby), 800);
    }
  });

  // ── Vote
  socket.on('vote:cast', ({ targetId }) => {
    if (!rateLimit(socket.id, 'vote', 3)) return;
    const lobby = getLobbyOfSocket(socket.id);
    if (!lobby || lobby.phase !== 'vote') return;
    if (lobby.votes[socket.id]) return; // already voted
    if (targetId === socket.id) return socket.emit('error', 'Tu ne peux pas voter pour toi-même.');
    if (!lobby.drawings[targetId]) return;

    lobby.votes[socket.id] = targetId;
    socket.emit('vote:confirmed');

    const connected = lobby.players.filter(p => p.connected);
    const eligible = connected.filter(p => lobby.drawings[p.id]); // only those who drew
    const voted = connected.filter(p => lobby.votes[p.id] !== undefined);
    if (voted.length >= connected.length - 1 || voted.length >= eligible.length) {
      clearLobbyTimer(lobby);
      setTimeout(() => endVotePhase(lobby), 500);
    }
  });

  // ── Replay
  socket.on('game:replay', () => {
    const lobby = getLobbyOfSocket(socket.id);
    if (!lobby || lobby.phase !== 'final') return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player?.isHost) return;
    lobby.players.forEach(p => { p.score = 0; });
    lobby.round = 0;
    lobby.maxRounds = 0;
    lobby.phase = 'lobby';
    lobby.currentMusic = null;
    lobby.drawings = {};
    lobby.votes = {};
    broadcastLobby(lobby);
  });

  // ── Disconnect
  socket.on('disconnect', () => {
    const lobby = getLobbyOfSocket(socket.id);
    if (!lobby) return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;
    player.connected = false;

    const connected = lobby.players.filter(p => p.connected);
    if (connected.length === 0) {
      clearLobbyTimer(lobby);
      setTimeout(() => { if (lobbies[lobby.id] && lobbies[lobby.id].players.every(p => !p.connected)) delete lobbies[lobby.id]; }, 300000);
      return;
    }

    // if host left, reassign
    if (player.isHost) {
      player.isHost = false;
      connected[0].isHost = true;
    }

    broadcastLobby(lobby);
    io.to(lobby.id).emit('player:disconnected', { pseudo: player.pseudo });

    // if master disconnected during music phase, skip to next
    if (lobby.phase === 'music') {
      const master = getMaster(lobby);
      if (!master || !master.connected) nextRound(lobby);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Synesthesia running on port ${PORT}`));
