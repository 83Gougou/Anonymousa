const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ─── Game Data ───────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'experiment_7',
    title: 'EXPÉRIENCE N°7',
    description: 'Un sujet a disparu du Complexe Delta. Quelqu\'un sait ce qui s\'est vraiment passé.',
    truth: 'Le sujet s\'est échappé par le conduit B-7 avec l\'aide d\'un agent infiltré.',
    rooms: [
      {
        id: 'A',
        color: '#ff3030',
        name: 'SALLE ROUGE',
        info: 'Le sujet a été vu vivant à 03h47. La caméra de surveillance montre une silhouette non identifiée.'
      },
      {
        id: 'B',
        color: '#3088ff',
        name: 'SALLE BLEUE',
        info: 'Le conduit B-7 a été forcé de l\'intérieur. Des traces de magnésium ont été retrouvées.'
      },
      {
        id: 'C',
        color: '#30ff88',
        name: 'SALLE VERTE',
        info: 'Le badge d\'accès du Dr. Morin a été utilisé à 03h52. Le Dr. Morin affirme dormir à cette heure-là.'
      },
      {
        id: 'D',
        color: '#cc44ff',
        name: 'SALLE VIOLETTE',
        info: 'Un message crypté a été intercepté : "SUJET LIBRE. OPÉRATION RÉUSSIE." Expéditeur inconnu.'
      }
    ],
    fakeInfo: 'Le sujet s\'est suicidé dans sa cellule. Cas classé.'
  },
  {
    id: 'heist_zero',
    title: 'OPÉRATION ZÉRO',
    description: 'Un vol a eu lieu au Vault Numérique. Le coupable est parmi vous.',
    truth: 'L\'agent double a utilisé le terminal fantôme pour extraire les données à 00h00.',
    rooms: [
      {
        id: 'A',
        color: '#ff3030',
        name: 'SALLE ROUGE',
        info: 'Un accès non autorisé a été détecté sur le réseau interne entre 23h58 et 00h02.'
      },
      {
        id: 'B',
        color: '#3088ff',
        name: 'SALLE BLEUE',
        info: 'Le terminal fantôme — protocole black market — a été activé. Localisation : Secteur 9.'
      },
      {
        id: 'C',
        color: '#30ff88',
        name: 'SALLE VERTE',
        info: 'Agent ECHO était hors du bâtiment à minuit. Alibi confirmé par la sécurité extérieure... ou presque.'
      },
      {
        id: 'D',
        color: '#cc44ff',
        name: 'SALLE VIOLETTE',
        info: 'Les données extraites ont été retrouvées cryptées sur un serveur aux Îles Caïmans. 48h plus tard.'
      }
    ],
    fakeInfo: 'Une panne système a causé une fausse alerte. Aucun vol confirmé.'
  }
];

const ROLES = {
  NEUTRAL: { id: 'NEUTRAL', name: 'AGENT', desc: 'Trouvez la vérité. Analysez les informations collectées.', color: '#aaaaaa' },
  TRAITOR: { id: 'TRAITOR', name: 'TRAÎTRE', desc: 'Semez le chaos. Faites douter les autres. Évitez d\'être démasqué.', color: '#ff3030' },
  ANALYST: { id: 'ANALYST', name: 'ANALYSTE', desc: 'Vous pouvez vérifier UNE info une seule fois pendant la phase de débat.', color: '#3088ff' },
  MANIPULATOR: { id: 'MANIPULATOR', name: 'MANIPULATEUR', desc: 'Vous pouvez changer UNE info dans une room (visible par tous les joueurs qui y étaient).', color: '#cc44ff' }
};

// ─── Game State ───────────────────────────────────────────────────────────────

const lobbies = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function assignRooms(players, scenario) {
  // Each player misses exactly 1 room
  // Room A: all except player[3]
  // Room B: all except player[2]
  // Room C: all except player[1]
  // Room D: all except player[0]
  const pids = players.map(p => p.id);
  const assignments = {};

  players.forEach((player, i) => {
    assignments[player.id] = scenario.rooms
      .filter((_, roomIdx) => roomIdx !== (players.length - 1 - i))
      .map(r => r.id);
  });

  return assignments;
}

function assignRoles(players) {
  const roleKeys = ['TRAITOR', 'ANALYST', 'MANIPULATOR'];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const roles = {};

  shuffled.forEach((p, i) => {
    roles[p.id] = i < roleKeys.length ? roleKeys[i] : 'NEUTRAL';
  });

  return roles;
}

function getLobby(code) {
  return lobbies[code];
}

// ─── Socket Logic ─────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // Create lobby
  socket.on('create_lobby', ({ username }) => {
    const code = generateCode();
    lobbies[code] = {
      code,
      host: socket.id,
      players: [{ id: socket.id, username, ready: false }],
      phase: 'lobby', // lobby > rooms > debate > vote > result
      scenario: null,
      roles: {},
      roomAssignments: {},
      currentRoom: {},
      messages: {},
      roomMessages: {},
      votes: {},
      manipulatorUsed: {},
      analystUsed: {},
      manipulations: {} // roomId -> new fake info
    };

    socket.join(code);
    socket.emit('lobby_joined', { code, lobby: sanitizeLobby(lobbies[code], socket.id) });
    console.log(`Lobby ${code} created by ${username}`);
  });

  // Join lobby
  socket.on('join_lobby', ({ code, username }) => {
    const lobby = getLobby(code);
    if (!lobby) return socket.emit('error', { msg: 'Code invalide.' });
    if (lobby.phase !== 'lobby') return socket.emit('error', { msg: 'Partie déjà en cours.' });
    if (lobby.players.length >= 4) return socket.emit('error', { msg: 'Lobby plein (4 joueurs max).' });
    if (lobby.players.find(p => p.username === username)) return socket.emit('error', { msg: 'Pseudo déjà pris.' });

    lobby.players.push({ id: socket.id, username, ready: false });
    socket.join(code);

    io.to(code).emit('lobby_update', { lobby: sanitizeLobby(lobby, socket.id) });
    socket.emit('lobby_joined', { code, lobby: sanitizeLobby(lobby, socket.id) });
  });

  // Start game (host only, 2-4 players)
  socket.on('start_game', ({ code }) => {
    const lobby = getLobby(code);
    if (!lobby) return;
    if (lobby.host !== socket.id) return socket.emit('error', { msg: 'Seul le host peut lancer.' });
    if (lobby.players.length < 2) return socket.emit('error', { msg: 'Minimum 2 joueurs.' });

    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    lobby.scenario = scenario;
    lobby.phase = 'rooms';
    lobby.roles = assignRoles(lobby.players);
    lobby.roomAssignments = assignRooms(lobby.players, scenario);

    // Initialize current room for each player (first assigned room)
    lobby.players.forEach(p => {
      lobby.currentRoom[p.id] = lobby.roomAssignments[p.id][0];
    });

    // Room chat messages: { roomId: [{playerId, username, text, ts}] }
    scenario.rooms.forEach(r => { lobby.roomMessages[r.id] = []; });
    lobby.messages = [];

    // Send each player their role + scenario
    lobby.players.forEach(p => {
      const role = ROLES[lobby.roles[p.id]];
      const assignedRooms = lobby.roomAssignments[p.id].map(rid =>
        scenario.rooms.find(r => r.id === rid)
      );

      // Apply any manipulations
      const roomsWithManip = assignedRooms.map(room => {
        if (lobby.manipulations[room.id]) {
          return { ...room, info: lobby.manipulations[room.id], manipulated: true };
        }
        return room;
      });

      io.to(p.id).emit('game_start', {
        scenario: { id: scenario.id, title: scenario.title, description: scenario.description },
        role,
        rooms: roomsWithManip,
        roomAssignments: lobby.roomAssignments[p.id],
        allPlayers: lobby.players.map(pl => ({ id: pl.id, username: pl.username }))
      });
    });

    io.to(code).emit('phase_change', { phase: 'rooms', duration: 120 });
  });

  // Room chat
  socket.on('room_message', ({ code, roomId, text }) => {
    const lobby = getLobby(code);
    if (!lobby || lobby.phase !== 'rooms') return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    // Check player is assigned to this room
    const assigned = lobby.roomAssignments[socket.id] || [];
    if (!assigned.includes(roomId)) return socket.emit('error', { msg: 'Vous n\'êtes pas dans cette room.' });

    const msg = { playerId: socket.id, username: player.username, text, ts: Date.now() };
    lobby.roomMessages[roomId].push(msg);

    // Send to all players in this room
    const playersInRoom = lobby.players.filter(p =>
      lobby.roomAssignments[p.id]?.includes(roomId)
    );
    playersInRoom.forEach(p => {
      io.to(p.id).emit('room_message', { roomId, msg });
    });
  });

  // Manipulator uses power
  socket.on('manipulate_room', ({ code, roomId, newInfo }) => {
    const lobby = getLobby(code);
    if (!lobby) return;
    if (lobby.roles[socket.id] !== 'MANIPULATOR') return socket.emit('error', { msg: 'Vous n\'êtes pas le Manipulateur.' });
    if (lobby.manipulatorUsed[socket.id]) return socket.emit('error', { msg: 'Pouvoir déjà utilisé.' });

    lobby.manipulations[roomId] = newInfo;
    lobby.manipulatorUsed[socket.id] = true;

    // Notify players who were in that room
    const affectedPlayers = lobby.players.filter(p =>
      lobby.roomAssignments[p.id]?.includes(roomId)
    );
    affectedPlayers.forEach(p => {
      io.to(p.id).emit('info_manipulated', { roomId, newInfo });
    });

    socket.emit('power_used', { power: 'MANIPULATOR' });
  });

  // Move to debate phase
  socket.on('start_debate', ({ code }) => {
    const lobby = getLobby(code);
    if (!lobby || lobby.host !== socket.id) return;

    lobby.phase = 'debate';
    io.to(code).emit('phase_change', { phase: 'debate', duration: 180 });
  });

  // Global debate chat
  socket.on('debate_message', ({ code, text }) => {
    const lobby = getLobby(code);
    if (!lobby || lobby.phase !== 'debate') return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    const msg = { playerId: socket.id, username: player.username, text, ts: Date.now() };
    lobby.messages.push(msg);
    io.to(code).emit('debate_message', { msg });
  });

  // Analyst verifies info
  socket.on('analyst_verify', ({ code, roomId }) => {
    const lobby = getLobby(code);
    if (!lobby) return;
    if (lobby.roles[socket.id] !== 'ANALYST') return socket.emit('error', { msg: 'Vous n\'êtes pas l\'Analyste.' });
    if (lobby.analystUsed[socket.id]) return socket.emit('error', { msg: 'Pouvoir déjà utilisé.' });

    lobby.analystUsed[socket.id] = true;
    const room = lobby.scenario.rooms.find(r => r.id === roomId);
    const isManipulated = !!lobby.manipulations[roomId];

    socket.emit('analyst_result', {
      roomId,
      isManipulated,
      realInfo: room.info
    });
    socket.emit('power_used', { power: 'ANALYST' });
  });

  // Move to vote phase
  socket.on('start_vote', ({ code }) => {
    const lobby = getLobby(code);
    if (!lobby || lobby.host !== socket.id) return;

    lobby.phase = 'vote';
    lobby.votes = {};
    io.to(code).emit('phase_change', { phase: 'vote' });
  });

  // Cast vote
  socket.on('cast_vote', ({ code, targetId }) => {
    const lobby = getLobby(code);
    if (!lobby || lobby.phase !== 'vote') return;

    lobby.votes[socket.id] = targetId;

    io.to(code).emit('vote_update', {
      votesIn: Object.keys(lobby.votes).length,
      total: lobby.players.length
    });

    // All voted
    if (Object.keys(lobby.votes).length >= lobby.players.length) {
      resolveGame(code);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    for (const code in lobbies) {
      const lobby = lobbies[code];
      const idx = lobby.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        const username = lobby.players[idx].username;
        lobby.players.splice(idx, 1);

        if (lobby.players.length === 0) {
          delete lobbies[code];
        } else {
          if (lobby.host === socket.id) {
            lobby.host = lobby.players[0].id;
          }
          io.to(code).emit('player_left', { username, lobby: sanitizeLobby(lobby, lobby.host) });
        }
        break;
      }
    }
  });
});

function resolveGame(code) {
  const lobby = lobbies[code];
  if (!lobby) return;

  lobby.phase = 'result';

  // Tally votes
  const tally = {};
  lobby.players.forEach(p => { tally[p.id] = 0; });
  Object.values(lobby.votes).forEach(targetId => {
    if (tally[targetId] !== undefined) tally[targetId]++;
  });

  // Most voted
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const accusedId = sorted[0][0];
  const accusedPlayer = lobby.players.find(p => p.id === accusedId);
  const accusedRole = lobby.roles[accusedId];
  const isTraitorCaught = accusedRole === 'TRAITOR';

  // Scores
  const scores = {};
  lobby.players.forEach(p => {
    let score = 0;
    const role = lobby.roles[p.id];

    if (role === 'TRAITOR') {
      if (!isTraitorCaught || accusedId !== p.id) score += 20;
      else score -= 5;
    } else {
      if (isTraitorCaught && lobby.votes[p.id] === accusedId) score += 15;
      else if (!isTraitorCaught) score -= 5;
    }

    scores[p.id] = score;
  });

  // Reveal all roles
  const roleReveal = {};
  lobby.players.forEach(p => {
    roleReveal[p.id] = { username: p.username, role: ROLES[lobby.roles[p.id]] };
  });

  io.to(code).emit('game_result', {
    accusedPlayer: { id: accusedId, username: accusedPlayer?.username },
    accusedRole: ROLES[accusedRole],
    isTraitorCaught,
    truth: lobby.scenario.truth,
    fakeInfo: lobby.scenario.fakeInfo,
    votes: lobby.votes,
    scores,
    roleReveal,
    tally
  });
}

function sanitizeLobby(lobby, viewerId) {
  return {
    code: lobby.code,
    host: lobby.host,
    phase: lobby.phase,
    players: lobby.players.map(p => ({ id: p.id, username: p.username, ready: p.ready })),
    isHost: lobby.host === viewerId
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ROOMS OF LIES — Port ${PORT}`));

