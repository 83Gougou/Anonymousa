<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Synesthesia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap" rel="stylesheet">
<style>
  /* ── Reset & Variables ───────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #FAFAFA;
    --surface: #FFFFFF;
    --border: #E8E8E8;
    --border-dark: #D0D0D0;
    --text: #1A1A1A;
    --text-muted: #888888;
    --text-light: #BBBBBB;
    --green: #2ECC71;
    --green-dark: #27AE60;
    --green-pale: #F0FDF6;
    --red: #E74C3C;
    --yellow: #F39C12;
    --radius: 8px;
    --radius-lg: 14px;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  }

  html, body {
    height: 100%;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 15px;
    line-height: 1.5;
  }

  /* ── Typography ──────────────────────────────────────────── */
  .mono { font-family: 'DM Mono', monospace; }
  h1 { font-size: 2rem; font-weight: 600; letter-spacing: -0.03em; }
  h2 { font-size: 1.4rem; font-weight: 600; letter-spacing: -0.02em; }
  h3 { font-size: 1.1rem; font-weight: 500; }

  /* ── Layout ──────────────────────────────────────────────── */
  #app {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .screen {
    display: none;
    width: 100%;
    max-width: 600px;
    animation: fadeUp 0.25s ease;
  }
  .screen.active { display: block; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Card ────────────────────────────────────────────────── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
    box-shadow: var(--shadow);
  }
  .card-sm { padding: 20px 24px; }

  /* ── Inputs ──────────────────────────────────────────────── */
  input[type="text"] {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 15px;
    color: var(--text);
    background: var(--surface);
    transition: border-color 0.15s;
    outline: none;
  }
  input[type="text"]:focus { border-color: var(--green); }
  input[type="text"]::placeholder { color: var(--text-light); }

  /* ── Buttons ─────────────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
    white-space: nowrap;
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: var(--green); color: #fff; border-color: var(--green); }
  .btn-primary:hover:not(:disabled) { background: var(--green-dark); border-color: var(--green-dark); }
  .btn-secondary { background: var(--surface); color: var(--text); border-color: var(--border-dark); }
  .btn-secondary:hover:not(:disabled) { background: var(--bg); }
  .btn-ghost { background: transparent; color: var(--text-muted); border-color: transparent; }
  .btn-ghost:hover:not(:disabled) { color: var(--text); background: var(--bg); }
  .btn-full { width: 100%; }
  .btn-sm { padding: 7px 14px; font-size: 13px; }

  /* ── Separator ───────────────────────────────────────────── */
  .sep {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    font-size: 13px;
    margin: 20px 0;
  }
  .sep::before, .sep::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* ── Logo ────────────────────────────────────────────────── */
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }
  .logo-mark {
    width: 36px; height: 36px;
    background: var(--text);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .logo-mark svg { width: 20px; height: 20px; fill: none; stroke: var(--green); stroke-width: 2; }
  .logo-text { font-size: 1.2rem; font-weight: 600; letter-spacing: -0.02em; }
  .logo-sub { font-size: 12px; color: var(--text-muted); font-family: 'DM Mono', monospace; }

  /* ── Player list ─────────────────────────────────────────── */
  .player-list { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; }
  .player-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
  }
  .player-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: #fff;
    flex-shrink: 0;
  }
  .player-name { flex: 1; font-weight: 500; }
  .player-score { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--text-muted); }
  .player-badge {
    font-size: 11px; padding: 2px 7px;
    border-radius: 4px;
    font-family: 'DM Mono', monospace;
  }
  .badge-host { background: var(--text); color: #fff; }
  .badge-master { background: var(--green); color: #fff; }
  .badge-you { background: var(--bg); color: var(--text-muted); border: 1px solid var(--border); }
  .badge-off { background: #eee; color: #aaa; }

  /* ── Lobby code ──────────────────────────────────────────── */
  .lobby-code {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 16px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .lobby-code:hover { border-color: var(--green); }
  .lobby-code-text { font-family: 'DM Mono', monospace; font-size: 1.3rem; font-weight: 500; letter-spacing: 0.1em; }
  .lobby-code-hint { font-size: 12px; color: var(--text-muted); }

  /* ── Timer bar ───────────────────────────────────────────── */
  .timer-wrap { margin-bottom: 20px; }
  .timer-bar-bg {
    height: 4px; background: var(--border);
    border-radius: 2px; overflow: hidden;
  }
  .timer-bar {
    height: 100%;
    background: var(--green);
    border-radius: 2px;
    transition: width 1s linear, background 0.3s;
  }
  .timer-bar.urgent { background: var(--red); }
  .timer-label {
    display: flex; justify-content: space-between;
    font-size: 12px; color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    margin-top: 6px;
  }

  /* ── Canvas area ─────────────────────────────────────────── */
  #draw-screen {
    max-width: 900px;
    display: none;
  }
  #draw-screen.active { display: block; }

  .draw-layout {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 16px;
    align-items: start;
  }

  .canvas-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: relative;
  }
  #draw-canvas {
    display: block;
    cursor: crosshair;
    touch-action: none;
  }

  .toolbar {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .toolbar-section { display: flex; flex-direction: column; gap: 8px; }
  .toolbar-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: 500; }

  .color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
  .color-swatch {
    width: 100%; aspect-ratio: 1;
    border-radius: 5px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.1s, border-color 0.1s;
  }
  .color-swatch:hover { transform: scale(1.1); }
  .color-swatch.active { border-color: var(--text); }

  .tool-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    color: var(--text);
    transition: background 0.15s, border-color 0.15s;
    width: 100%;
  }
  .tool-btn:hover { background: var(--bg); }
  .tool-btn.active { background: var(--green-pale); border-color: var(--green); color: var(--green-dark); }

  input[type="range"] {
    width: 100%;
    accent-color: var(--green);
    height: 4px;
    cursor: pointer;
  }

  /* ── Music player strip ──────────────────────────────────── */
  .music-strip {
    background: var(--text);
    color: #fff;
    border-radius: var(--radius);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 13px;
  }
  .music-strip-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green);
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .music-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.85; }

  /* ── Vote phase ──────────────────────────────────────────── */
  .vote-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }
  .vote-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.1s;
  }
  .vote-card:hover:not(.voted):not(.self) { border-color: var(--green); transform: translateY(-2px); }
  .vote-card.selected { border-color: var(--green); background: var(--green-pale); }
  .vote-card.self { cursor: default; opacity: 0.5; }
  .vote-card img { width: 100%; aspect-ratio: 1; object-fit: contain; background: #fafafa; display: block; }
  .vote-card-label { padding: 8px 12px; font-size: 12px; color: var(--text-muted); font-family: 'DM Mono', monospace; text-align: center; }

  .reference-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-align: center;
    margin-bottom: 20px;
  }
  .reference-card img { width: 100%; max-height: 180px; object-fit: cover; display: block; }
  .reference-card-label { padding: 8px 12px; font-size: 12px; color: var(--text-muted); }

  /* ── Results ─────────────────────────────────────────────── */
  .result-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin: 16px 0; }
  .result-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    animation: fadeUp 0.3s ease both;
  }
  .result-card img { width: 100%; aspect-ratio: 1; object-fit: contain; background: #fafafa; display: block; }
  .result-card-info { padding: 8px 10px; }
  .result-card-pseudo { font-size: 13px; font-weight: 500; }
  .result-card-votes { font-size: 12px; color: var(--green-dark); font-family: 'DM Mono', monospace; }

  .score-list { display: flex; flex-direction: column; gap: 6px; }
  .score-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    background: var(--bg);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }
  .score-rank { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--text-muted); width: 20px; }
  .score-name { flex: 1; font-weight: 500; }
  .score-pts { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; }
  .score-delta { font-size: 12px; color: var(--green-dark); font-family: 'DM Mono', monospace; }
  .podium-1 { border-color: #F5C842; background: #FFFDF0; }
  .podium-2 { border-color: #B0B0B0; background: #F8F8F8; }
  .podium-3 { border-color: #CD7F32; background: #FFF8F4; }

  /* ── Notification toast ──────────────────────────────────── */
  #toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--text); color: #fff;
    padding: 10px 20px; border-radius: var(--radius);
    font-size: 14px; font-weight: 500;
    pointer-events: none;
    opacity: 0; transition: opacity 0.2s;
    z-index: 999;
    white-space: nowrap;
  }
  #toast.show { opacity: 1; }
  #toast.error { background: var(--red); }
  #toast.success { background: var(--green-dark); }

  /* ── YouTube hidden player ───────────────────────────────── */
  #yt-player-wrap { position: fixed; bottom: -200px; left: 0; width: 1px; height: 1px; overflow: hidden; pointer-events: none; }

  /* ── Utilities ───────────────────────────────────────────── */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-8 { gap: 8px; }
  .gap-12 { gap: 12px; }
  .gap-16 { gap: 16px; }
  .gap-20 { gap: 20px; }
  .mt-8 { margin-top: 8px; }
  .mt-12 { margin-top: 12px; }
  .mt-16 { margin-top: 16px; }
  .mt-20 { margin-top: 20px; }
  .mb-4 { margin-bottom: 4px; }
  .mb-8 { margin-bottom: 8px; }
  .mb-12 { margin-bottom: 12px; }
  .mb-20 { margin-bottom: 20px; }
  .text-muted { color: var(--text-muted); }
  .text-sm { font-size: 13px; }
  .text-xs { font-size: 12px; }
  .text-center { text-align: center; }
  .fw-500 { font-weight: 500; }
  .hidden { display: none !important; }
  .w-full { width: 100%; }

  /* ── Phase tag ───────────────────────────────────────────── */
  .phase-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    font-family: 'DM Mono', monospace; font-weight: 500;
    padding: 3px 8px; border-radius: 4px;
    background: var(--bg); color: var(--text-muted);
    border: 1px solid var(--border);
  }
  .phase-tag.green { background: var(--green-pale); color: var(--green-dark); border-color: #b2f0d0; }

  /* ── Waiting state ───────────────────────────────────────── */
  .waiting-dot {
    display: inline-block;
    animation: blink 1s step-start infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  /* ── Divider ─────────────────────────────────────────────── */
  hr.divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* ── Responsive ──────────────────────────────────────────── */
  @media (max-width: 700px) {
    .draw-layout { grid-template-columns: 1fr; }
    .toolbar { flex-direction: row; flex-wrap: wrap; }
    .toolbar-section { flex: 1; min-width: 120px; }
    .vote-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<div id="app">

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: HOME
  ══════════════════════════════════════════════════════════ -->
  <div id="screen-home" class="screen active">
    <div class="card">
      <div class="logo">
        <div class="logo-mark">
          <svg viewBox="0 0 24 24"><path d="M12 3 C12 3 4 8 4 14 A8 8 0 0 0 20 14 C20 8 12 3 12 3Z"/><line x1="12" y1="14" x2="12" y2="20"/></svg>
        </div>
        <div>
          <div class="logo-text">Synesthesia</div>
          <div class="logo-sub">musique → dessin</div>
        </div>
      </div>

      <div class="mb-20">
        <label class="toolbar-label mb-8" for="home-pseudo">Ton pseudo</label>
        <input type="text" id="home-pseudo" placeholder="ex: Picsou42" maxlength="20" autocomplete="off">
      </div>

      <button class="btn btn-primary btn-full" id="btn-create">Créer une partie</button>

      <div class="sep">ou</div>

      <div class="flex gap-8">
        <input type="text" id="home-code" placeholder="Code du lobby (ex: AX7K2P)" maxlength="6" style="text-transform:uppercase; font-family: 'DM Mono', monospace; letter-spacing: 0.1em;">
        <button class="btn btn-secondary" id="btn-join" style="flex-shrink:0">Rejoindre</button>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: LOBBY
  ══════════════════════════════════════════════════════════ -->
  <div id="screen-lobby" class="screen">
    <div class="card">
      <div class="flex items-center justify-between mb-20">
        <div>
          <h2>Lobby</h2>
          <p class="text-sm text-muted mt-8">Partage le code pour inviter des joueurs</p>
        </div>
        <div class="lobby-code" id="lobby-code-copy" title="Cliquer pour copier">
          <div>
            <div class="lobby-code-text" id="lobby-code-display">------</div>
            <div class="lobby-code-hint">cliquer pour copier</div>
          </div>
        </div>
      </div>

      <div class="toolbar-label mb-8">Joueurs (<span id="lobby-count">0</span>/6)</div>
      <div class="player-list" id="lobby-player-list"></div>

      <div class="mt-20">
        <button class="btn btn-primary btn-full" id="btn-start" disabled>
          Démarrer la partie
        </button>
        <p class="text-xs text-muted text-center mt-8" id="lobby-start-hint">Il faut au moins 2 joueurs</p>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: MUSIC (master picks a song)
  ══════════════════════════════════════════════════════════ -->
  <div id="screen-music" class="screen">
    <div class="card">
      <div class="flex items-center justify-between mb-20">
        <div>
          <div class="phase-tag green mb-8">Round <span id="music-round">1</span> / <span id="music-maxrounds">?</span></div>
          <h2>Phase musique</h2>
        </div>
        <div class="phase-tag" id="music-master-tag">♛ <span id="music-master-name">?</span></div>
      </div>

      <div id="music-master-section">
        <p class="text-sm text-muted mb-12">Choisis une musique YouTube. Les joueurs dessineront ce qu'elle leur évoque.</p>
        <div class="flex gap-8 mb-12">
          <input type="text" id="music-url-input" placeholder="https://www.youtube.com/watch?v=..." style="flex:1">
          <button class="btn btn-primary" id="btn-submit-music" style="flex-shrink:0">Valider</button>
        </div>
        <p class="text-xs text-muted" id="music-error-msg" style="color: var(--red);"></p>
      </div>

      <div id="music-waiting-section" class="hidden">
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 12px;">🎵</div>
          <p class="fw-500"><span id="music-wait-master">?</span> choisit une musique<span class="waiting-dot">...</span></p>
          <p class="text-sm mt-8">Détends-toi, ça arrive</p>
        </div>
      </div>

      <hr class="divider">
      <div class="toolbar-label mb-8">Joueurs</div>
      <div class="player-list" id="music-player-list"></div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: DRAWING
  ══════════════════════════════════════════════════════════ -->
  <div id="draw-screen" class="screen">
    <div id="yt-player-wrap"><div id="yt-player"></div></div>

    <div class="music-strip">
      <div class="music-strip-dot"></div>
      <span class="music-title" id="draw-music-title">Chargement...</span>
    </div>

    <div class="flex items-center justify-between mb-12">
      <div class="phase-tag green">Round <span id="draw-round">1</span></div>
      <div class="timer-wrap" style="flex:1; margin: 0 16px 0;">
        <div class="timer-bar-bg"><div class="timer-bar" id="draw-timer-bar" style="width:100%"></div></div>
        <div class="timer-label"><span>dessin libre</span><span id="draw-timer-text">--</span></div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-submit-drawing">Envoyer ✓</button>
    </div>

    <div class="draw-layout">
      <div class="canvas-wrap">
        <canvas id="draw-canvas"></canvas>
      </div>
      <div class="toolbar">
        <div class="toolbar-section">
          <div class="toolbar-label">Outil</div>
          <button class="tool-btn active" id="tool-brush" data-tool="brush">
            <span>✏️</span> Pinceau
          </button>
          <button class="tool-btn" id="tool-eraser" data-tool="eraser">
            <span>🧹</span> Gomme
          </button>
        </div>

        <div class="toolbar-section">
          <div class="toolbar-label">Taille</div>
          <input type="range" id="brush-size" min="2" max="40" value="6">
          <div class="text-xs text-muted text-center" id="brush-size-label">6px</div>
        </div>

        <div class="toolbar-section">
          <div class="toolbar-label">Couleur</div>
          <div class="color-grid" id="color-grid"></div>
        </div>

        <div class="toolbar-section">
          <button class="tool-btn" id="btn-clear-canvas">
            <span>🗑️</span> Effacer tout
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: VOTE
  ══════════════════════════════════════════════════════════ -->
  <div id="screen-vote" class="screen">
    <div class="card">
      <div class="flex items-center justify-between mb-12">
        <div>
          <div class="phase-tag green mb-8">Vote</div>
          <h2>Pour qui votes-tu ?</h2>
          <p class="text-sm text-muted mt-4">Quel dessin représente le mieux la musique ?</p>
        </div>
        <div>
          <div class="timer-bar-bg" style="width:80px"><div class="timer-bar" id="vote-timer-bar" style="width:100%"></div></div>
          <div class="text-xs text-muted text-center font-mono mt-4" id="vote-timer-text">--s</div>
        </div>
      </div>

      <div class="reference-card">
        <img id="vote-thumbnail" src="" alt="Cover YouTube" onerror="this.style.display='none'">
        <div class="reference-card-label">🎵 <span id="vote-music-title">?</span></div>
      </div>

      <div class="vote-grid" id="vote-grid"></div>

      <p class="text-xs text-muted text-center" id="vote-hint">Clique sur un dessin pour voter</p>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: RESULTS
  ══════════════════════════════════════════════════════════ -->
  <div id="screen-results" class="screen">
    <div class="card">
      <div class="flex items-center justify-between mb-20">
        <div>
          <div class="phase-tag green mb-8">Round <span id="results-round">1</span></div>
          <h2>Résultats</h2>
        </div>
        <div class="phase-tag" id="results-next-tag">Prochain round dans <span id="results-countdown">8</span>s</div>
      </div>

      <div class="toolbar-label mb-8">Dessins</div>
      <div class="result-grid" id="results-grid"></div>

      <hr class="divider">

      <div class="toolbar-label mb-8">Classement</div>
      <div class="score-list" id="results-score-list"></div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       SCREEN: FINAL
  ══════════════════════════════════════════════════════════ -->
  <div id="screen-final" class="screen">
    <div class="card" style="text-align:center">
      <div style="font-size: 3rem; margin-bottom: 12px;">🏆</div>
      <h2 class="mb-8">Fin de partie !</h2>
      <p class="text-sm text-muted mb-20">Classement final</p>

      <div class="score-list mb-20" id="final-score-list"></div>

      <button class="btn btn-primary btn-full" id="btn-replay">Rejouer</button>
      <button class="btn btn-ghost btn-full mt-8" id="btn-home">Retour à l'accueil</button>
    </div>
  </div>

</div>

<!-- Toast -->
<div id="toast"></div>

<script src="/socket.io/socket.io.js"></script>
<script>
// ════════════════════════════════════════════════════════════════
//  SYNESTHESIA — Client
// ════════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────
const state = {
  socket: null,
  lobbyId: null,
  playerId: null,
  isHost: false,
  pseudo: '',
  lobby: null,
  currentPhase: 'home',
  votedFor: null,
  drawingSubmitted: false,
  myDrawingDataUrl: null,
  ytPlayer: null,
  ytReady: false,
  timerInterval: null,
  countdownInterval: null,
};

// ── Colors ────────────────────────────────────────────────────
const COLORS = [
  '#1A1A1A','#FFFFFF','#E74C3C','#E67E22',
  '#F1C40F','#2ECC71','#1ABC9C','#3498DB',
  '#9B59B6','#E91E63','#795548','#9E9E9E',
];
const AVATAR_COLORS = ['#E74C3C','#E67E22','#F39C12','#2ECC71','#1ABC9C','#3498DB','#9B59B6','#E91E63','#34495E'];

function avatarColor(pseudo) {
  let h = 0; for (const c of pseudo) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initial(pseudo) { return (pseudo || '?').charAt(0).toUpperCase(); }

// ── Sounds ────────────────────────────────────────────────────
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, duration, type = 'sine', vol = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}
function sfxClick() { playTone(880, 0.06, 'sine', 0.1); }
function sfxSuccess() { playTone(660, 0.08); setTimeout(() => playTone(880, 0.12), 80); }
function sfxVote() { playTone(500, 0.1, 'triangle', 0.1); }
function sfxTimerEnd() { playTone(330, 0.3, 'square', 0.08); }
function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2), i * 100));
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('btn') || e.target.closest('.btn')) sfxClick();
}, true);

// ── Toast ─────────────────────────────────────────────────────
let toastTimeout;
function toast(msg, type = '', duration = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.className = '', duration);
}

// ── Screen router ──────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id) || document.getElementById(id + '-screen') || document.getElementById(id);
  if (el) el.classList.add('active');
  state.currentPhase = id;
}

// ── Socket setup ──────────────────────────────────────────────
function initSocket() {
  state.socket = io({ transports: ['websocket', 'polling'] });
  const s = state.socket;

  s.on('connect', () => {
    if (state.lobbyId && state.pseudo && state.currentPhase !== 'home') {
      s.emit('lobby:join', { lobbyId: state.lobbyId, pseudo: state.pseudo });
    }
  });

  s.on('lobby:joined', ({ lobbyId, playerId, isHost }) => {
    state.lobbyId = lobbyId;
    state.playerId = playerId;
    state.isHost = isHost;
    document.getElementById('lobby-code-display').textContent = lobbyId;
    showScreen('lobby');
  });

  s.on('lobby:update', (lobby) => {
    state.lobby = lobby;
    updateLobbyUI(lobby);
  });

  s.on('error', (msg) => {
    toast(msg, 'error');
    document.getElementById('music-error-msg').textContent = msg;
    document.getElementById('btn-submit-music').disabled = false;
    document.getElementById('music-url-input').disabled = false;
  });

  s.on('player:disconnected', ({ pseudo }) => toast(`${pseudo} s'est déconnecté`, '', 2500));

  s.on('phase:music', ({ master }) => startMusicPhase(master));
  s.on('music:validating', () => {
    document.getElementById('btn-submit-music').disabled = true;
    document.getElementById('music-url-input').disabled = true;
    document.getElementById('music-error-msg').textContent = 'Vérification...';
  });
  s.on('phase:drawing', ({ music, duration }) => startDrawingPhase(music, duration));
  s.on('drawing:saved', () => {
    state.drawingSubmitted = true;
    document.getElementById('btn-submit-drawing').textContent = '✓ Envoyé';
    document.getElementById('btn-submit-drawing').disabled = true;
    sfxSuccess();
    toast('Dessin enregistré !', 'success');
  });
  s.on('phase:vote', ({ drawings, thumbnail, duration }) => startVotePhase(drawings, thumbnail, duration));
  s.on('vote:confirmed', () => {
    sfxVote();
    toast('Vote enregistré !', 'success');
    document.getElementById('vote-hint').textContent = '✓ Vote enregistré — attente des autres joueurs';
  });
  s.on('phase:results', (data) => showResults(data));
  s.on('phase:final', (data) => showFinal(data));
}

// ── Lobby UI ──────────────────────────────────────────────────
function updateLobbyUI(lobby) {
  const iAm = lobby.players.find(p => p.id === state.playerId);
  if (iAm) state.isHost = iAm.isHost;

  const master = lobby.players[lobby.masterIndex % lobby.players.length];

  // If game started, route to right phase
  if (lobby.phase !== 'lobby' && state.currentPhase === 'lobby') {
    routeToPhase(lobby);
  }

  // Update lobby screen
  document.getElementById('lobby-count').textContent = lobby.players.length;
  renderPlayerList('lobby-player-list', lobby, master);

  const canStart = lobby.players.filter(p => p.connected).length >= 2;
  const startBtn = document.getElementById('btn-start');
  startBtn.disabled = !state.isHost || !canStart;
  document.getElementById('lobby-start-hint').textContent =
    !state.isHost ? 'Seul le host peut démarrer' :
    !canStart ? 'Il faut au moins 2 joueurs' : 'Prêt !';

  // Update music screen player list
  renderPlayerList('music-player-list', lobby, master);
}

function routeToPhase(lobby) {
  const phase = lobby.phase;
  if (phase === 'music') {
    const master = lobby.players[lobby.masterIndex % lobby.players.length];
    startMusicPhase(master);
  } else if (phase === 'drawing' && lobby.currentMusic) {
    const remaining = Math.max(0, Math.floor((lobby.timerEnd - Date.now()) / 1000));
    startDrawingPhase(lobby.currentMusic, remaining);
  }
}

function renderPlayerList(containerId, lobby, master) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  lobby.players.forEach(p => {
    const isMaster = master && p.id === master.id;
    const isMe = p.id === state.playerId;
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `
      <div class="player-avatar" style="background:${avatarColor(p.pseudo)}">${initial(p.pseudo)}</div>
      <div class="player-name">${esc(p.pseudo)}${!p.connected ? ' <span style="color:var(--text-light);font-size:11px">(hors ligne)</span>' : ''}</div>
      <div class="player-score">${p.score} pt${p.score !== 1 ? 's' : ''}</div>
      ${p.isHost ? '<span class="player-badge badge-host">host</span>' : ''}
      ${isMaster ? '<span class="player-badge badge-master">♛</span>' : ''}
      ${isMe ? '<span class="player-badge badge-you">moi</span>' : ''}
      ${!p.connected ? '<span class="player-badge badge-off">off</span>' : ''}
    `;
    el.appendChild(div);
  });
}

// ── PHASE: Music ──────────────────────────────────────────────
function startMusicPhase(master) {
  const lobby = state.lobby;
  const isMaster = master && master.id === state.playerId;

  document.getElementById('music-round').textContent = lobby ? lobby.round + 1 : '?';
  document.getElementById('music-maxrounds').textContent = lobby ? lobby.maxRounds : '?';
  document.getElementById('music-master-name').textContent = master ? master.pseudo : '?';
  document.getElementById('music-wait-master').textContent = master ? master.pseudo : '?';

  document.getElementById('music-master-section').classList.toggle('hidden', !isMaster);
  document.getElementById('music-waiting-section').classList.toggle('hidden', isMaster);
  document.getElementById('music-error-msg').textContent = '';
  document.getElementById('music-url-input').value = '';
  document.getElementById('btn-submit-music').disabled = false;
  document.getElementById('music-url-input').disabled = false;

  if (lobby) renderPlayerList('music-player-list', lobby, master);
  showScreen('music');
}

document.getElementById('btn-submit-music').addEventListener('click', () => {
  const url = document.getElementById('music-url-input').value.trim();
  if (!url) return toast('Entre un lien YouTube', 'error');
  document.getElementById('music-error-msg').textContent = '';
  state.socket.emit('music:submit', { url });
});
document.getElementById('music-url-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-submit-music').click();
});

// ── YouTube IFrame API ────────────────────────────────────────
window.onYouTubeIframeAPIReady = function() { state.ytReady = true; };

function loadYTScript() {
  if (document.getElementById('yt-api-script')) return;
  const tag = document.createElement('script');
  tag.id = 'yt-api-script';
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

function playYouTube(videoId) {
  loadYTScript();
  const tryPlay = () => {
    if (!state.ytReady) { setTimeout(tryPlay, 200); return; }
    if (state.ytPlayer) {
      state.ytPlayer.loadVideoById(videoId);
      state.ytPlayer.playVideo();
    } else {
      state.ytPlayer = new YT.Player('yt-player', {
        videoId,
        playerVars: { autoplay: 1, controls: 0 },
        events: { onReady: e => e.target.playVideo() }
      });
    }
  };
  tryPlay();
}

function stopYouTube() {
  if (state.ytPlayer) { try { state.ytPlayer.stopVideo(); } catch(e) {} }
}

// ── PHASE: Drawing ────────────────────────────────────────────
function startDrawingPhase(music, duration) {
  stopTimers();
  state.drawingSubmitted = false;
  state.myDrawingDataUrl = null;

  document.getElementById('draw-music-title').textContent = music.title || 'Musique';
  document.getElementById('draw-round').textContent = state.lobby ? state.lobby.round + 1 : '?';
  document.getElementById('btn-submit-drawing').textContent = 'Envoyer ✓';
  document.getElementById('btn-submit-drawing').disabled = false;

  showScreen('draw');
  initCanvas();
  playYouTube(music.videoId);

  // Restore from localStorage if any
  const saved = localStorage.getItem('synesthesia_drawing_' + state.lobbyId);
  if (saved) {
    try { loadImageToCanvas(saved); } catch(e) {}
  }

  startTimer('draw-timer-bar', 'draw-timer-text', duration, () => {
    sfxTimerEnd();
    if (!state.drawingSubmitted) submitDrawing();
  });
}

// ── Canvas ────────────────────────────────────────────────────
let canvas, ctx, drawing = false, lastX = 0, lastY = 0, currentTool = 'brush', currentColor = '#1A1A1A', brushSize = 6;

function initCanvas() {
  canvas = document.getElementById('draw-canvas');
  ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  const size = Math.min(wrap.clientWidth || 600, 600);
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.removeEventListener('mousedown', onMouseDown);
  canvas.removeEventListener('mousemove', onMouseMove);
  canvas.removeEventListener('mouseup', onMouseUp);
  canvas.removeEventListener('mouseleave', onMouseUp);
  canvas.removeEventListener('touchstart', onTouchStart);
  canvas.removeEventListener('touchmove', onTouchMove);
  canvas.removeEventListener('touchend', onMouseUp);

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onMouseUp);
}

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
}

function onMouseDown(e) {
  drawing = true;
  const p = getPos(e);
  lastX = p.x; lastY = p.y;
  ctx.beginPath();
  ctx.arc(p.x, p.y, (currentTool === 'eraser' ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2);
  ctx.fillStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
  ctx.fill();
  saveCanvasLocal();
}
function onMouseMove(e) {
  if (!drawing) return;
  const p = getPos(e);
  draw(lastX, lastY, p.x, p.y);
  lastX = p.x; lastY = p.y;
}
function onMouseUp() { drawing = false; saveCanvasLocal(); }
function onTouchStart(e) { e.preventDefault(); onMouseDown(e.touches[0]); }
function onTouchMove(e) { e.preventDefault(); onMouseMove(e.touches[0]); }

function draw(x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
  ctx.lineWidth = currentTool === 'eraser' ? brushSize * 2 : brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function saveCanvasLocal() {
  try {
    const data = canvas.toDataURL('image/jpeg', 0.7);
    state.myDrawingDataUrl = data;
    localStorage.setItem('synesthesia_drawing_' + state.lobbyId, data);
  } catch(e) {}
}

function loadImageToCanvas(dataUrl) {
  const img = new Image();
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.src = dataUrl;
}

function submitDrawing() {
  if (state.drawingSubmitted) return;
  saveCanvasLocal();
  const data = state.myDrawingDataUrl || canvas.toDataURL('image/jpeg', 0.8);
  state.socket.emit('drawing:submit', { dataUrl: data });
  localStorage.removeItem('synesthesia_drawing_' + state.lobbyId);
}

// Init color palette
const colorGrid = document.getElementById('color-grid');
COLORS.forEach(c => {
  const sw = document.createElement('div');
  sw.className = 'color-swatch' + (c === '#1A1A1A' ? ' active' : '');
  sw.style.background = c;
  if (c === '#FFFFFF') sw.style.border = '2px solid var(--border)';
  sw.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    currentColor = c;
    currentTool = 'brush';
    document.getElementById('tool-brush').classList.add('active');
    document.getElementById('tool-eraser').classList.remove('active');
  });
  colorGrid.appendChild(sw);
});

document.getElementById('tool-brush').addEventListener('click', () => {
  currentTool = 'brush';
  document.getElementById('tool-brush').classList.add('active');
  document.getElementById('tool-eraser').classList.remove('active');
});
document.getElementById('tool-eraser').addEventListener('click', () => {
  currentTool = 'eraser';
  document.getElementById('tool-eraser').classList.add('active');
  document.getElementById('tool-brush').classList.remove('active');
});
document.getElementById('brush-size').addEventListener('input', e => {
  brushSize = parseInt(e.target.value);
  document.getElementById('brush-size-label').textContent = brushSize + 'px';
});
document.getElementById('btn-clear-canvas').addEventListener('click', () => {
  if (!ctx) return;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveCanvasLocal();
});
document.getElementById('btn-submit-drawing').addEventListener('click', submitDrawing);

// ── PHASE: Vote ───────────────────────────────────────────────
function startVotePhase(drawings, thumbnail, duration) {
  stopTimers();
  stopYouTube();
  state.votedFor = null;

  const lobby = state.lobby;
  document.getElementById('vote-thumbnail').src = thumbnail || '';
  document.getElementById('vote-music-title').textContent = lobby?.currentMusic?.title || '?';
  document.getElementById('vote-hint').textContent = 'Clique sur un dessin pour voter';

  const grid = document.getElementById('vote-grid');
  grid.innerHTML = '';

  drawings.forEach(d => {
    const card = document.createElement('div');
    const isMe = d.id === state.playerId;
    card.className = 'vote-card' + (isMe ? ' self' : '');
    card.innerHTML = `
      <img src="${d.dataUrl}" alt="dessin">
      <div class="vote-card-label">${isMe ? 'Ton dessin' : 'Anonyme'}</div>
    `;
    if (!isMe) {
      card.addEventListener('click', () => {
        if (state.votedFor) return;
        state.votedFor = d.id;
        document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.socket.emit('vote:cast', { targetId: d.id });
      });
    }
    grid.appendChild(card);
  });

  showScreen('vote');
  startTimer('vote-timer-bar', 'vote-timer-text', duration, () => {
    sfxTimerEnd();
    document.getElementById('vote-hint').textContent = 'Temps écoulé !';
  });
}

// ── PHASE: Results ────────────────────────────────────────────
function showResults(data) {
  stopTimers();
  const { drawings, roundScores, players } = data;

  document.getElementById('results-round').textContent = state.lobby ? state.lobby.round : '?';

  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  drawings.sort((a, b) => b.votes - a.votes).forEach((d, i) => {
    const div = document.createElement('div');
    div.className = 'result-card';
    div.style.animationDelay = (i * 0.08) + 's';
    div.innerHTML = `
      <img src="${d.dataUrl}" alt="dessin">
      <div class="result-card-info">
        <div class="result-card-pseudo">${esc(d.pseudo)}</div>
        <div class="result-card-votes">+${d.votes} vote${d.votes !== 1 ? 's' : ''}</div>
      </div>
    `;
    grid.appendChild(div);
  });

  const scoreList = document.getElementById('results-score-list');
  scoreList.innerHTML = '';
  [...players].sort((a, b) => b.score - a.score).forEach((p, i) => {
    const delta = roundScores[p.id] || 0;
    const div = document.createElement('div');
    div.className = 'score-row' + (i === 0 ? ' podium-1' : i === 1 ? ' podium-2' : i === 2 ? ' podium-3' : '');
    div.innerHTML = `
      <span class="score-rank">#${i + 1}</span>
      <span class="score-name">${esc(p.pseudo)}${p.id === state.playerId ? ' <span style="color:var(--text-muted);font-size:12px">(toi)</span>' : ''}</span>
      ${delta > 0 ? `<span class="score-delta">+${delta}</span>` : ''}
      <span class="score-pts">${p.score} pts</span>
    `;
    scoreList.appendChild(div);
  });

  showScreen('results');

  // countdown
  let t = 8;
  document.getElementById('results-countdown').textContent = t;
  state.countdownInterval = setInterval(() => {
    t--;
    document.getElementById('results-countdown').textContent = t;
    if (t <= 0) { clearInterval(state.countdownInterval); }
  }, 1000);
}

// ── PHASE: Final ──────────────────────────────────────────────
function showFinal(data) {
  stopTimers();
  sfxWin();
  const list = document.getElementById('final-score-list');
  list.innerHTML = '';
  data.players.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'score-row' + (i === 0 ? ' podium-1' : i === 1 ? ' podium-2' : i === 2 ? ' podium-3' : '');
    div.style.animationDelay = (i * 0.1) + 's';
    div.innerHTML = `
      <span class="score-rank">${['🥇','🥈','🥉'][i] || '#' + (i+1)}</span>
      <span class="score-name">${esc(p.pseudo)}${p.id === state.playerId ? ' <span style="color:var(--text-muted);font-size:12px">(toi)</span>' : ''}</span>
      <span class="score-pts">${p.score} pts</span>
    `;
    list.appendChild(div);
  });

  // Show replay only if host
  document.getElementById('btn-replay').classList.toggle('hidden', !state.isHost);
  showScreen('final');
}

// ── Timer utility ─────────────────────────────────────────────
function stopTimers() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  if (state.countdownInterval) { clearInterval(state.countdownInterval); state.countdownInterval = null; }
}

function startTimer(barId, labelId, totalSeconds, onEnd) {
  const bar = document.getElementById(barId);
  const label = document.getElementById(labelId);
  let remaining = totalSeconds;

  function tick() {
    const pct = Math.max(0, remaining / totalSeconds * 100);
    bar.style.width = pct + '%';
    bar.classList.toggle('urgent', remaining <= 10);
    label.textContent = remaining + 's';
    if (remaining <= 0) {
      clearInterval(state.timerInterval);
      if (onEnd) onEnd();
    }
    remaining--;
  }
  tick();
  state.timerInterval = setInterval(tick, 1000);
}

// ── Home screen buttons ───────────────────────────────────────
document.getElementById('btn-create').addEventListener('click', () => {
  const pseudo = document.getElementById('home-pseudo').value.trim();
  if (!pseudo) { toast('Entre un pseudo', 'error'); return; }
  state.pseudo = pseudo;
  state.socket.emit('lobby:create', { pseudo });
});

document.getElementById('btn-join').addEventListener('click', () => {
  const pseudo = document.getElementById('home-pseudo').value.trim();
  const code = document.getElementById('home-code').value.trim().toUpperCase();
  if (!pseudo) { toast('Entre un pseudo', 'error'); return; }
  if (!code) { toast('Entre un code de lobby', 'error'); return; }
  state.pseudo = pseudo;
  state.lobbyId = code;
  state.socket.emit('lobby:join', { lobbyId: code, pseudo });
});

document.getElementById('home-code').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-join').click();
});

// ── Lobby buttons ─────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
  state.socket.emit('game:start');
});

document.getElementById('lobby-code-copy').addEventListener('click', () => {
  const code = document.getElementById('lobby-code-display').textContent;
  navigator.clipboard.writeText(code).then(() => toast('Code copié !', 'success')).catch(() => {});
});

// ── Final buttons ─────────────────────────────────────────────
document.getElementById('btn-replay').addEventListener('click', () => {
  state.socket.emit('game:replay');
});

document.getElementById('btn-home').addEventListener('click', () => {
  location.reload();
});

// ── Helpers ───────────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────
initSocket();
</script>
</body>
</html>
