const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Minecraft items database (valides pour /give)
const VALID_ITEMS = new Set([
  // Blocs de base
  'dirt','grass_block','stone','cobblestone','sand','gravel','clay','bedrock',
  'oak_log','birch_log','spruce_log','jungle_log','acacia_log','dark_oak_log','cherry_log','mangrove_log',
  'oak_planks','birch_planks','spruce_planks','jungle_planks','acacia_planks','dark_oak_planks','cherry_planks',
  'oak_leaves','birch_leaves','spruce_leaves','jungle_leaves','acacia_leaves','dark_oak_leaves',
  'glass','tinted_glass','glass_pane',
  'gravel','flint','sand','red_sand',
  'snow','ice','packed_ice','blue_ice','snow_block','powder_snow_bucket',
  // Minerais
  'coal_ore','iron_ore','copper_ore','gold_ore','redstone_ore','lapis_ore','diamond_ore','emerald_ore',
  'deepslate_coal_ore','deepslate_iron_ore','deepslate_copper_ore','deepslate_gold_ore',
  'deepslate_redstone_ore','deepslate_lapis_ore','deepslate_diamond_ore','deepslate_emerald_ore',
  'nether_quartz_ore','nether_gold_ore','ancient_debris',
  // Blocs de minerais
  'coal_block','iron_block','copper_block','gold_block','redstone_block','lapis_block',
  'diamond_block','emerald_block','netherite_block','quartz_block','amethyst_block',
  // Outils
  'wooden_pickaxe','stone_pickaxe','iron_pickaxe','golden_pickaxe','diamond_pickaxe','netherite_pickaxe',
  'wooden_shovel','stone_shovel','iron_shovel','golden_shovel','diamond_shovel','netherite_shovel',
  'wooden_axe','stone_axe','iron_axe','golden_axe','diamond_axe','netherite_axe',
  'wooden_hoe','stone_hoe','iron_hoe','golden_hoe','diamond_hoe','netherite_hoe',
  'wooden_sword','stone_sword','iron_sword','golden_sword','diamond_sword','netherite_sword',
  // Armure
  'leather_helmet','leather_chestplate','leather_leggings','leather_boots',
  'iron_helmet','iron_chestplate','iron_leggings','iron_boots',
  'golden_helmet','golden_chestplate','golden_leggings','golden_boots',
  'diamond_helmet','diamond_chestplate','diamond_leggings','diamond_boots',
  'netherite_helmet','netherite_chestplate','netherite_leggings','netherite_boots',
  'chainmail_helmet','chainmail_chestplate','chainmail_leggings','chainmail_boots',
  'turtle_helmet','elytra','shield',
  // Nourriture
  'apple','golden_apple','enchanted_golden_apple','bread','cooked_beef','beef',
  'cooked_chicken','chicken','cooked_porkchop','porkchop','cooked_mutton','mutton',
  'cooked_rabbit','rabbit','cooked_salmon','salmon','cooked_cod','cod',
  'carrot','golden_carrot','potato','baked_potato','poisonous_potato',
  'beetroot','beetroot_soup','mushroom_stew','rabbit_stew','suspicious_stew',
  'pumpkin_pie','cake','cookie','melon_slice','dried_kelp','honey_bottle',
  'milk_bucket','water_bucket','lava_bucket','bucket','powder_snow_bucket',
  // Mobs drops / items spéciaux
  'bone','bone_meal','feather','leather','wool','string','gunpowder',
  'spider_eye','fermented_spider_eye','slimeball','blaze_rod','blaze_powder',
  'magma_cream','ghast_tear','nether_star','dragon_egg','dragon_breath',
  'ender_pearl','ender_eye','shulker_shell','nautilus_shell','heart_of_the_sea',
  'prismarine_shard','prismarine_crystals','scute','phantom_membrane',
  'rabbit_foot','rabbit_hide','ink_sac','glow_ink_sac','rotten_flesh',
  'chorus_fruit','popped_chorus_fruit','nether_wart','quartz',
  'raw_iron','raw_gold','raw_copper','amethyst_shard','echo_shard',
  // Spawn eggs
  'creeper_spawn_egg','zombie_spawn_egg','skeleton_spawn_egg','spider_spawn_egg',
  'enderman_spawn_egg','blaze_spawn_egg','ghast_spawn_egg','slime_spawn_egg',
  'witch_spawn_egg','wither_skeleton_spawn_egg','stray_spawn_egg','husk_spawn_egg',
  'drowned_spawn_egg','phantom_spawn_egg','pillager_spawn_egg','ravager_spawn_egg',
  'evoker_spawn_egg','vindicator_spawn_egg','vex_spawn_egg','illusioner_spawn_egg',
  'guardian_spawn_egg','elder_guardian_spawn_egg','shulker_spawn_egg',
  'endermite_spawn_egg','silverfish_spawn_egg','cave_spider_spawn_egg',
  'pig_spawn_egg','cow_spawn_egg','sheep_spawn_egg','chicken_spawn_egg',
  'horse_spawn_egg','donkey_spawn_egg','mule_spawn_egg','llama_spawn_egg',
  'wolf_spawn_egg','cat_spawn_egg','ocelot_spawn_egg','fox_spawn_egg',
  'rabbit_spawn_egg','bee_spawn_egg','turtle_spawn_egg','panda_spawn_egg',
  'polar_bear_spawn_egg','bat_spawn_egg','parrot_spawn_egg','dolphin_spawn_egg',
  'cod_spawn_egg','salmon_spawn_egg','pufferfish_spawn_egg','tropical_fish_spawn_egg',
  'squid_spawn_egg','glow_squid_spawn_egg','axolotl_spawn_egg','goat_spawn_egg',
  'frog_spawn_egg','tadpole_spawn_egg','allay_spawn_egg','warden_spawn_egg',
  'camel_spawn_egg','sniffer_spawn_egg','armadillo_spawn_egg','breeze_spawn_egg',
  'piglin_spawn_egg','piglin_brute_spawn_egg','hoglin_spawn_egg','zoglin_spawn_egg',
  'zombified_piglin_spawn_egg','strider_spawn_egg','magma_cube_spawn_egg',
  'zombie_villager_spawn_egg','wandering_trader_spawn_egg','villager_spawn_egg',
  'iron_golem_spawn_egg','snow_golem_spawn_egg','mooshroom_spawn_egg',
  // Redstone
  'redstone','redstone_torch','repeater','comparator','observer','piston','sticky_piston',
  'dropper','dispenser','hopper','hopper_minecart','chest_minecart','tnt_minecart',
  'lever','button','pressure_plate','tripwire_hook','daylight_detector',
  'target','lightning_rod','rail','powered_rail','detector_rail','activator_rail',
  // Blocs de construction
  'bricks','stone_bricks','mossy_stone_bricks','cracked_stone_bricks','chiseled_stone_bricks',
  'nether_bricks','red_nether_bricks','nether_brick_fence',
  'sandstone','chiseled_sandstone','smooth_sandstone','red_sandstone',
  'prismarine','prismarine_bricks','dark_prismarine','sea_lantern',
  'purpur_block','purpur_pillar','end_stone','end_stone_bricks','end_rod',
  'obsidian','crying_obsidian','blackstone','gilded_blackstone','basalt','smooth_basalt',
  'magma_block','netherrack','soul_sand','soul_soil','glowstone','shroomlight',
  'warped_nylium','crimson_nylium','warped_stem','crimson_stem',
  'moss_block','moss_carpet','rooted_dirt','mud','packed_mud','mud_bricks',
  'calcite','tuff','dripstone_block','pointed_dripstone',
  'deepslate','cobbled_deepslate','polished_deepslate','deepslate_bricks','deepslate_tiles',
  // Plantes / Nature
  'oak_sapling','birch_sapling','spruce_sapling','jungle_sapling','acacia_sapling',
  'dark_oak_sapling','cherry_sapling','mangrove_propagule',
  'dandelion','poppy','blue_orchid','allium','azure_bluet','red_tulip','orange_tulip',
  'white_tulip','pink_tulip','oxeye_daisy','cornflower','lily_of_the_valley','wither_rose',
  'sunflower','lilac','rose_bush','peony','tall_grass','large_fern',
  'sugar_cane','bamboo','cactus','kelp','seagrass','sea_pickle',
  'brown_mushroom','red_mushroom','crimson_fungus','warped_fungus',
  'wheat_seeds','melon_seeds','pumpkin_seeds','beetroot_seeds',
  'wheat','melon','pumpkin','carved_pumpkin','jack_o_lantern',
  'lily_pad','vine','glow_lichen','hanging_roots',
  // Conteneurs / Meubles
  'chest','trapped_chest','barrel','ender_chest','shulker_box',
  'white_shulker_box','orange_shulker_box','magenta_shulker_box','light_blue_shulker_box',
  'yellow_shulker_box','lime_shulker_box','pink_shulker_box','gray_shulker_box',
  'light_gray_shulker_box','cyan_shulker_box','purple_shulker_box','blue_shulker_box',
  'brown_shulker_box','green_shulker_box','red_shulker_box','black_shulker_box',
  'crafting_table','furnace','blast_furnace','smoker','campfire','soul_campfire',
  'anvil','chipped_anvil','damaged_anvil','grindstone','smithing_table',
  'enchanting_table','bookshelf','brewing_stand','cauldron',
  'loom','cartography_table','fletching_table','stonecutter',
  'lectern','beehive','bee_nest','composter','bell',
  // Divers
  'torch','soul_torch','lantern','soul_lantern','candle',
  'bow','crossbow','arrow','spectral_arrow','tipped_arrow',
  'fishing_rod','flint_and_steel','shears','lead','name_tag',
  'compass','clock','map','empty_map','filled_map',
  'book','book_and_quill','written_book','enchanted_book',
  'paper','sign','oak_sign','painting','item_frame','glow_item_frame',
  'flower_pot','armor_stand','saddle','carrot_on_a_stick','warped_fungus_on_a_stick',
  'minecart','boat','oak_boat','chest_boat',
  'potion','splash_potion','lingering_potion','glass_bottle','experience_bottle',
  'fire_charge','ender_chest','totem_of_undying','trident',
  'music_disc_13','music_disc_cat','music_disc_blocks','music_disc_chirp',
  'music_disc_far','music_disc_mall','music_disc_mellohi','music_disc_stal',
  'music_disc_strad','music_disc_ward','music_disc_11','music_disc_wait',
  'music_disc_otherside','music_disc_5','music_disc_pigstep','music_disc_relic',
  'disc_fragment_5','goat_horn','spyglass','bundle','recovery_compass',
  'copper_ingot','iron_ingot','gold_ingot','netherite_ingot','netherite_scrap',
  'diamond','emerald','lapis_lazuli','coal','charcoal',
  'stick','bowl','clay_ball','flint','brick','nether_brick',
  'snowball','egg','dye','white_dye','black_dye','red_dye','green_dye',
  'blue_dye','yellow_dye','orange_dye','purple_dye','magenta_dye',
  'pink_dye','cyan_dye','brown_dye','light_blue_dye','light_gray_dye','lime_dye',
  'gray_dye','firework_rocket','firework_star',
  'structure_block','command_block','repeating_command_block','chain_command_block',
  'jigsaw','debug_stick','knowledge_book','barrier','light'
]);

// Rooms en cours
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('create_room', ({ username }) => {
    const code = generateRoomCode();
    rooms[code] = {
      code,
      players: [{ id: socket.id, username, score: 0 }],
      usedItems: new Set(),
      currentTurn: 0,
      gameStarted: false,
      turnTimeout: null
    };
    socket.join(code);
    socket.roomCode = code;
    socket.username = username;
    socket.emit('room_created', { code, username });
    console.log(`Room ${code} created by ${username}`);
  });

  socket.on('join_room', ({ code, username }) => {
    const room = rooms[code];
    if (!room) return socket.emit('error', 'Room introuvable !');
    if (room.gameStarted) return socket.emit('error', 'Partie déjà commencée !');
    if (room.players.length >= 2) return socket.emit('error', 'Room pleine !');
    if (room.players.find(p => p.username === username)) {
      return socket.emit('error', 'Ce pseudo est déjà pris dans cette room !');
    }

    room.players.push({ id: socket.id, username, score: 0 });
    socket.join(code);
    socket.roomCode = code;
    socket.username = username;

    socket.emit('room_joined', { code, username, players: room.players.map(p => p.username) });
    io.to(code).emit('player_joined', { players: room.players.map(p => p.username) });

    // Auto-start quand 2 joueurs
    if (room.players.length === 2) {
      startGame(code);
    }
  });

  socket.on('submit_item', ({ item }) => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room || !room.gameStarted) return;

    const currentPlayer = room.players[room.currentTurn % 2];
    if (currentPlayer.id !== socket.id) {
      return socket.emit('not_your_turn');
    }

    const normalizedItem = item.toLowerCase().trim().replace(/ /g, '_');

    // Vérif item valide
    if (!VALID_ITEMS.has(normalizedItem)) {
      return socket.emit('invalid_item', { item: normalizedItem });
    }

    // Vérif pas déjà utilisé
    if (room.usedItems.has(normalizedItem)) {
      return socket.emit('already_used', { item: normalizedItem });
    }

    // Item accepté !
    room.usedItems.add(normalizedItem);
    clearTimeout(room.turnTimeout);

    io.to(code).emit('item_accepted', {
      player: socket.username,
      item: normalizedItem,
      usedCount: room.usedItems.size
    });

    room.currentTurn++;
    startTurn(code);
  });

  socket.on('give_up', () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room || !room.gameStarted) return;
    const winner = room.players.find(p => p.id !== socket.id);
    endGame(code, winner?.username, socket.username, 'give_up');
  });

  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    if (room.turnTimeout) clearTimeout(room.turnTimeout);
    const winner = room.players.find(p => p.id !== socket.id);
    if (room.gameStarted && winner) {
      endGame(code, winner.username, socket.username, 'disconnect');
    } else {
      io.to(code).emit('player_left', { username: socket.username });
      delete rooms[code];
    }
  });

  socket.on('rematch', () => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room) return;
    room.usedItems = new Set();
    room.currentTurn = 0;
    room.gameStarted = false;
    room.rematchVotes = (room.rematchVotes || 0) + 1;
    if (room.rematchVotes >= 2) {
      room.rematchVotes = 0;
      startGame(code);
    } else {
      io.to(code).emit('rematch_vote', { votes: room.rematchVotes });
    }
  });
});

function startGame(code) {
  const room = rooms[code];
  room.gameStarted = true;
  room.usedItems = new Set();
  room.currentTurn = 0;

  // Shuffle qui commence
  if (Math.random() < 0.5) {
    room.players.reverse();
  }

  io.to(code).emit('game_start', {
    players: room.players.map(p => p.username),
    firstPlayer: room.players[0].username
  });

  setTimeout(() => startTurn(code), 1500);
}

function startTurn(code) {
  const room = rooms[code];
  if (!room) return;
  const current = room.players[room.currentTurn % 2];

  io.to(code).emit('your_turn', {
    player: current.username,
    timeLimit: 15
  });

  // Timeout 15 secondes
  room.turnTimeout = setTimeout(() => {
    const loser = current.username;
    const winner = room.players.find(p => p.username !== loser)?.username;
    endGame(code, winner, loser, 'timeout');
  }, 15000);
}

function endGame(code, winner, loser, reason) {
  const room = rooms[code];
  if (!room) return;
  room.gameStarted = false;
  if (room.turnTimeout) clearTimeout(room.turnTimeout);

  io.to(code).emit('game_over', {
    winner,
    loser,
    reason,
    usedItems: [...room.usedItems],
    totalItems: room.usedItems.size
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
