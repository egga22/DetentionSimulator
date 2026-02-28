const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dialogueText = document.getElementById('dialogueText');
const dialogueOptions = document.getElementById('dialogueOptions');
const timeRemainingLabel = document.getElementById('timeRemaining');
const statusText = document.getElementById('statusText');

const detentionDurationMs = 60 * 60 * 1000;
let detentionStartedAt = null;

const room = {
  width: canvas.width,
  height: canvas.height,
  wallThickness: 30,
};

const deskLayout = {
  columns: 4,
  rows: 3,
  startX: 120,
  startY: 80,
  spacingX: 170,
  spacingY: 120,
  width: 70,
  height: 36,
  legHeight: 7,
};

const desks = [];
for (let row = 0; row < deskLayout.rows; row += 1) {
  for (let col = 0; col < deskLayout.columns; col += 1) {
    desks.push({
      id: `desk-${row}-${col}`,
      row,
      col,
      x: deskLayout.startX + col * deskLayout.spacingX,
      y: deskLayout.startY + row * deskLayout.spacingY,
      width: deskLayout.width,
      height: deskLayout.height,
    });
  }
}

const teacherDesk = {
  x: room.width / 2 - 95,
  y: 38,
  width: 190,
  height: 42,
};

const playerDesk = desks.find((desk) => desk.row === 2 && desk.col === 1);

const door = {
  x: room.width - 100,
  y: room.height / 2 - 45,
  width: 24,
  height: 90,
  interactionRadius: 70,
};

const player = {
  x: playerDesk.x + playerDesk.width / 2 - 18,
  y: playerDesk.y + playerDesk.height + 14,
  width: 36,
  height: 48,
  speed: 220,
  facing: 'up',
  seated: true,
};

const teacher = {
  width: 30,
  height: 44,
  x: teacherDesk.x + teacherDesk.width / 2 - 15,
  y: teacherDesk.y + teacherDesk.height + 2,
};

const npcNames = [
  'Mia',
  'Noah',
  'Zoe',
  'Jamal',
  'Lena',
  'Ivan',
  'Ruby',
  'Eli',
  'Kai',
  'Nora',
  'Owen',
  'Avery',
  'Riley',
  'Sasha',
  'Dante',
  'Priya',
  'Theo',
  'Camila',
  'Mateo',
  'Skye',
  'Jun',
  'Harper',
];

const npcOffenses = [
  'Passing notes all class',
  'Setting 14 alarms to ring in math',
  'Launching a paper airplane at the principal',
  'Sneaking chips into chemistry',
  'Rewriting the class anthem as a rap battle',
  'Hacking the bell to dismiss early',
  'Putting glitter in the class fan',
  'Trading fake hall passes',
  'Bringing a pet frog to history',
  'Drawing moustaches on textbook photos',
  'Starting a pencil drumming battle',
  'Hosting an underground eraser racing league',
  'Renaming all the classroom calculators',
  'Projecting cat memes during homeroom announcements',
  'Building a domino chain through the science lab',
  'Replacing the quiz answer key with song lyrics',
  'Convincing half the class it was pajama day',
  'Smuggling a mini disco ball into study hall',
  'Launching a rubber band into the trophy case',
  'Running a black-market sticker shop',
  'Turning the class slideshow into a cooking show',
  'Teaching everyone to yodel before attendance',
];

const npcColors = [
  '#d97fa8',
  '#83a4ff',
  '#8fd8b8',
  '#ffb880',
  '#f3d37f',
  '#91d6ff',
  '#e0a1ff',
  '#95e388',
  '#ff9f9f',
  '#9cd8d0',
  '#c8b6ff',
  '#7dcfb6',
  '#f4a261',
  '#a8dadc',
  '#b8c0ff',
  '#ffafcc',
  '#ffd166',
  '#90be6d',
  '#6ec5ff',
  '#f4978e',
  '#bde0fe',
  '#caffbf',
];

function shuffled(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

const npcDesks = desks.filter((desk) => desk !== playerDesk);
const shuffledNames = shuffled(npcNames);
const shuffledOffenses = shuffled(npcOffenses);
const shuffledColors = shuffled(npcColors);

const npcs = npcDesks.map((desk, index) => {
  return {
    id: `npc-${desk.row}-${desk.col}`,
    desk,
    name: shuffledNames[index % shuffledNames.length],
    offense: shuffledOffenses[index % shuffledOffenses.length],
    color: shuffledColors[index % shuffledColors.length],
    width: 30,
    height: 42,
    x: desk.x + desk.width / 2 - 15,
    y: desk.y + desk.height + 4,
    headRadius: 8,
  };
});

const dialoguePrompts = [
  { key: 'hi', label: 'Hi' },
  { key: 'name', label: "What's your name?" },
  { key: 'offense', label: 'What did you do?' },
  { key: 'hobby', label: 'What do you do for fun?' },
  { key: 'rumor', label: 'Heard any rumors?' },
  { key: 'snack', label: 'Favorite snack?' },
  { key: 'time', label: 'How long have you been here?' },
  { key: 'bye', label: 'See you later.' },
];

const teacherDialoguePrompts = [
  { key: 'status', label: 'Can I stand up?' },
  { key: 'time', label: 'How much time is left?' },
  { key: 'advice', label: 'Any advice?' },
  { key: 'leave', label: 'Can I leave now?' },
];

const keys = new Set();
let lastFrameTime = performance.now();
let detentionReleased = false;
let lastSpacePress = 0;
let pauseStartedAt = null;
let pausedAccumulatedMs = 0;
let teacherWarningStartedAt = null;
let teacherAskedToSit = false;
let timerPausedByTeacher = false;
let activeNpcId = null;
let talkingToTeacher = false;
let announcedDismissal = false;
let extraDetentionMs = 0;
let socializingIncidents = 0;
let introCutsceneActive = true;
let introCutsceneIndex = 0;

const introCutsceneLines = [
  'Principal: You turned last period into a snack-smuggling operation and disrupted class.',
  'You: It was just one tiny chip exchange ring...',
  'Principal: One hour of Friday detention. No excuses, no socializing.',
  'Teacher: Take your seat. The timer starts now. Keep to yourself.',
];

const npcReplyLines = {
  hi: [
    'Hey. Try not to make eye contact with the teacher.',
    'Yo. Detention buddies, apparently.',
    'Hi. I swear I am innocent-ish.',
  ],
  name: ['I\'m {name}.', '{name}. Seat C troublemaker.', '{name}. Nice to meet you in the worst place.'],
  offense: ['{offense}. Worth it though.', '{offense}. I regret nothing.', '{offense}. It was art, not chaos.'],
  hobby: [
    'I build tiny robots out of old calculators.',
    'Mostly speedrunning homework right before class.',
    'Skateboarding. Poorly, but enthusiastically.',
  ],
  rumor: [
    'Rumor is someone replaced the bell with a kazoo recording.',
    'I heard Coach fell asleep during the fire drill lecture.',
    'Someone said the principal has a secret snack drawer.',
  ],
  snack: ['Spicy chips. No contest.', 'Chocolate-covered pretzels.', 'Frozen grapes from the cafeteria.'],
  time: [
    'Feels like forever... but probably like 20 minutes.',
    'Long enough to memorize every crack in this desk.',
    'Not sure. Time moves weird in detention.',
  ],
  bye: [
    'Later. Pretend we\'re studying if the teacher looks over.',
    'See you. If we survive this hour.',
    'Bye. Good luck not getting caught talking.',
  ],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function setDialogue(message) {
  dialogueText.textContent = message;
}

function getMsRemaining() {
  if (detentionStartedAt === null) {
    return detentionDurationMs + extraDetentionMs;
  }
  const elapsed = Date.now() - detentionStartedAt - pausedAccumulatedMs;
  return Math.max(0, detentionDurationMs + extraDetentionMs - elapsed);
}

function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function distanceBetween(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function distanceToPlayerDesk() {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const deskCenterX = playerDesk.x + playerDesk.width / 2;
  const deskCenterY = playerDesk.y + playerDesk.height / 2;
  return distanceBetween(playerCenterX, playerCenterY, deskCenterX, deskCenterY);
}

function distanceToDoor() {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const doorCenterX = door.x + door.width / 2;
  const doorCenterY = door.y + door.height / 2;
  return distanceBetween(playerCenterX, playerCenterY, doorCenterX, doorCenterY);
}

function getNpcHeadPosition(npc) {
  return {
    x: npc.x + npc.width / 2,
    y: npc.y + 9,
  };
}

function isDeskNeighborWhenSeated(npcDesk) {
  return npcDesk.row === playerDesk.row && Math.abs(npcDesk.col - playerDesk.col) === 1;
}

function canTalkToNpc(npc) {
  const head = getNpcHeadPosition(npc);
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  if (player.seated) {
    return isDeskNeighborWhenSeated(npc.desk);
  }

  const standingRange = 120;
  return distanceBetween(playerCenterX, playerCenterY, head.x, head.y) <= standingRange;
}

function getNpcReply(npc, promptKey) {
  const options = npcReplyLines[promptKey];
  if (!options || options.length === 0) {
    return `${npc.name} shrugs.`;
  }

  const index = Math.floor(Math.random() * options.length);
  const line = options[index]
    .replaceAll('{name}', npc.name)
    .replaceAll('{offense}', npc.offense);
  return `${npc.name}: ${line}`;
}

function clearDialogueOptions() {
  dialogueOptions.replaceChildren();
}

function showIntroCutsceneStep() {
  clearDialogueOptions();
  setDialogue(introCutsceneLines[introCutsceneIndex]);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'dialogue-option-btn';
  button.textContent = introCutsceneIndex === introCutsceneLines.length - 1 ? 'Start detention' : 'Continue';
  button.addEventListener('click', advanceIntroCutscene);
  dialogueOptions.appendChild(button);
}

function advanceIntroCutscene() {
  if (!introCutsceneActive) {
    return;
  }

  if (introCutsceneIndex < introCutsceneLines.length - 1) {
    introCutsceneIndex += 1;
    showIntroCutsceneStep();
    return;
  }

  introCutsceneActive = false;
  detentionStartedAt = Date.now();
  statusText.textContent = 'Status: You are in detention. Keep your head down and serve your time.';
  closeNpcDialogue();
  setDialogue('Detention has started. Stay seated or stand with Space. Talking will get you in trouble.');
}

function punishForSocializing() {
  socializingIncidents += 1;

  if (socializingIncidents === 1) {
    setDialogue('Teacher: Detention is not social hour. Eyes forward, no chatting.');
    closeNpcDialogue();
    return false;
  }

  if (socializingIncidents === 2) {
    setDialogue('Teacher: Final warning. Talk again and I add time.');
    closeNpcDialogue();
    return false;
  }

  const addedMs = 5 * 60 * 1000;
  extraDetentionMs += addedMs;

  player.seated = true;
  player.facing = 'up';
  player.x = playerDesk.x + playerDesk.width / 2 - player.width / 2;
  player.y = playerDesk.y + playerDesk.height + 14;
  teacherWarningStartedAt = null;
  teacherAskedToSit = false;
  keys.clear();

  statusText.textContent = `Status: Punished for socializing (+${Math.round(addedMs / 60000)} min).`;
  setDialogue('Teacher: I warned you. Five extra minutes. Sit silently, now.');
  closeNpcDialogue();
  return false;
}

function showDialogueOptionsForNpc(npc) {
  clearDialogueOptions();
  activeNpcId = npc.id;
  talkingToTeacher = false;

  for (const prompt of dialoguePrompts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialogue-option-btn';
    button.textContent = prompt.label;
    button.addEventListener('click', () => {
      if (activeNpcId !== npc.id) {
        return;
      }
      setDialogue(getNpcReply(npc, prompt.key));
    });
    dialogueOptions.appendChild(button);
  }
}

function getTeacherReply(promptKey) {
  const remaining = getMsRemaining();
  const isDone = remaining <= 0;

  const replies = {
    status: isDone
      ? 'Teacher: Detention is over. You may stand and head out when ready.'
      : 'Teacher: You may stand and stretch, just stay in the room and keep it calm.',
    time: `Teacher: ${isDone ? 'Time is up.' : `${formatRemaining(remaining)} left.`}`,
    advice: 'Teacher: Own your mistakes, learn from them, and Monday will be easier.',
    leave: isDone
      ? 'Teacher: Yes. You are dismissed. Door is open.'
      : 'Teacher: Not yet. Wait for the timer, then you are free to go.',
  };

  return replies[promptKey] || 'Teacher: Back to your seat, please.';
}

function showDialogueOptionsForTeacher() {
  clearDialogueOptions();
  activeNpcId = null;
  talkingToTeacher = true;

  for (const prompt of teacherDialoguePrompts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialogue-option-btn';
    button.textContent = prompt.label;
    button.addEventListener('click', () => {
      if (!talkingToTeacher) {
        return;
      }
      setDialogue(getTeacherReply(prompt.key));
    });
    dialogueOptions.appendChild(button);
  }
}

function closeNpcDialogue() {
  activeNpcId = null;
  talkingToTeacher = false;
  clearDialogueOptions();
}

function intersectsDesk(x, y) {
  return desks.some((desk) => {
    const buffer = 6;
    const deskX = desk.x - buffer;
    const deskY = desk.y - buffer;
    const deskWidth = desk.width + buffer * 2;
    const deskHeight = desk.height + deskLayout.legHeight + buffer * 2;

    return (
      x < deskX + deskWidth &&
      x + player.width > deskX &&
      y < deskY + deskHeight &&
      y + player.height > deskY
    );
  });
}

function sitAtDesk() {
  player.seated = true;
  player.facing = 'up';
  player.x = playerDesk.x + playerDesk.width / 2 - player.width / 2;
  player.y = playerDesk.y + playerDesk.height + 14;
  teacherWarningStartedAt = null;
  teacherAskedToSit = false;

  if (timerPausedByTeacher) {
    timerPausedByTeacher = false;
    if (pauseStartedAt !== null) {
      pausedAccumulatedMs += Date.now() - pauseStartedAt;
      pauseStartedAt = null;
    }
    statusText.textContent = 'Status: Timer resumed. Stay seated in detention.';
    setDialogue('Teacher: Good. Stay in your seat.');
    closeNpcDialogue();
    return;
  }

  setDialogue('You sit back down at your desk. Click nearby heads to talk.');
}

function standUpFromDesk() {
  player.seated = false;
  const standY = playerDesk.y + playerDesk.height + 18;
  player.x = playerDesk.x + playerDesk.width / 2 - player.width / 2;
  player.y = standY;
  teacherWarningStartedAt = Date.now();
  teacherAskedToSit = false;
  closeNpcDialogue();
  setDialogue('You stand up. You can move around and chat while detention runs.');
}

function handleTeacherBehavior(nowMs) {
  if (player.seated) {
    return;
  }

  if (!teacherWarningStartedAt) {
    teacherWarningStartedAt = nowMs;
  }

  const awayDuration = nowMs - teacherWarningStartedAt;

  if (!teacherAskedToSit && awayDuration >= 400) {
    teacherAskedToSit = true;
    setDialogue('Teacher: Stay respectful, but you may stand if you need to.');
  }
}

function handleDoorInteraction() {
  if (player.seated) {
    if (timerPausedByTeacher) {
      setDialogue('Teacher: Sit down first.');
    } else {
      standUpFromDesk();
    }
    return;
  }

  if (distanceToDoor() > door.interactionRadius) {
    if (distanceToPlayerDesk() <= 70) {
      sitAtDesk();
    } else {
      setDialogue('Teacher: Return to your desk if you want to sit down.');
    }
    return;
  }

  const remaining = getMsRemaining();
  if (remaining > 0) {
    setDialogue('You are not allowed to leave detention yet.');
    return;
  }

  detentionReleased = true;
  statusText.textContent = 'Status: Detention complete. You are free to leave!';
  setDialogue('You leave detention. You can finally hang out with your friends.');
}

function tryTalkToNpcAt(canvasX, canvasY) {
  if (introCutsceneActive) {
    advanceIntroCutscene();
    return;
  }

  const teacherHeadX = teacher.x + teacher.width / 2;
  const teacherHeadY = teacher.y + 10;
  const clickedTeacher = distanceBetween(canvasX, canvasY, teacherHeadX, teacherHeadY) <= 16;
  if (clickedTeacher) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const withinTeacherRange = distanceBetween(playerCenterX, playerCenterY, teacherHeadX, teacherHeadY) <= 150;
    if (!withinTeacherRange) {
      setDialogue('Move closer to the teacher to talk.');
      closeNpcDialogue();
      return;
    }

    setDialogue('Teacher: Yes? Keep it brief.');
    showDialogueOptionsForTeacher();
    return;
  }

  for (const npc of npcs) {
    if (npc.leftRoom) {
      continue;
    }
    const head = getNpcHeadPosition(npc);
    const clickedHead = distanceBetween(canvasX, canvasY, head.x, head.y) <= npc.headRadius + 4;

    if (!clickedHead) {
      continue;
    }

    if (!canTalkToNpc(npc)) {
      if (player.seated) {
        setDialogue('You can only talk to the classmate directly next to your desk while seated.');
      } else {
        setDialogue('Move closer before trying to talk to that student.');
      }
      closeNpcDialogue();
      return;
    }

    if (!punishForSocializing()) {
      return;
    }

    setDialogue(`${npc.name} looks over. What do you want to say?`);
    showDialogueOptionsForNpc(npc);
    return;
  }

  closeNpcDialogue();
}

function updateNpcDismissal(deltaTime) {
  if (!announcedDismissal && getMsRemaining() <= 0) {
    announcedDismissal = true;
    setDialogue('Teacher: Detention is over. Everyone is dismissed.');
  }

  const exitX = door.x + door.width / 2 - 10;
  const exitY = door.y + door.height / 2 - 14;

  for (const npc of npcs) {
    if (npc.leftRoom || getMsRemaining() > 0) {
      continue;
    }

    const speed = 150;
    const toExitX = exitX - npc.x;
    const toExitY = exitY - npc.y;
    const distance = Math.hypot(toExitX, toExitY);

    if (distance <= 10) {
      npc.leftRoom = true;
      if (activeNpcId === npc.id) {
        closeNpcDialogue();
      }
      continue;
    }

    const step = speed * deltaTime;
    npc.x += (toExitX / distance) * Math.min(step, distance);
    npc.y += (toExitY / distance) * Math.min(step, distance);
  }
}

function moveWithCollision(deltaX, deltaY) {
  if (deltaX !== 0) {
    const nextX = player.x + deltaX;
    if (!intersectsDesk(nextX, player.y)) {
      player.x = nextX;
    }
  }

  if (deltaY !== 0) {
    const nextY = player.y + deltaY;
    if (!intersectsDesk(player.x, nextY)) {
      player.y = nextY;
    }
  }
}

function updatePlayer(deltaTime) {
  if (player.seated) {
    return;
  }

  let dx = 0;
  let dy = 0;

  if (keys.has('ArrowLeft')) {
    dx -= 1;
    player.facing = 'left';
  }
  if (keys.has('ArrowRight')) {
    dx += 1;
    player.facing = 'right';
  }
  if (keys.has('ArrowUp')) {
    dy -= 1;
    player.facing = 'up';
  }
  if (keys.has('ArrowDown')) {
    dy += 1;
    player.facing = 'down';
  }

  if (dx !== 0 || dy !== 0) {
    const magnitude = Math.hypot(dx, dy);
    dx /= magnitude;
    dy /= magnitude;

    moveWithCollision(dx * player.speed * deltaTime, dy * player.speed * deltaTime);

    const minX = room.wallThickness;
    const minY = room.wallThickness;
    const maxX = room.width - room.wallThickness - player.width;
    const maxY = room.height - room.wallThickness - player.height;

    player.x = clamp(player.x, minX, maxX);
    player.y = clamp(player.y, minY, maxY);
  }
}

function drawRoom() {
  ctx.fillStyle = '#6f5d50';
  ctx.fillRect(0, 0, room.width, room.height);

  ctx.fillStyle = '#3d2f2c';
  ctx.fillRect(0, 0, room.width, room.wallThickness);
  ctx.fillRect(0, room.height - room.wallThickness, room.width, room.wallThickness);
  ctx.fillRect(0, 0, room.wallThickness, room.height);
  ctx.fillRect(room.width - room.wallThickness, 0, room.wallThickness, room.height);

  ctx.fillStyle = '#4a3a2f';
  ctx.fillRect(teacherDesk.x, teacherDesk.y, teacherDesk.width, teacherDesk.height);
  ctx.fillStyle = '#2b201d';
  ctx.fillRect(teacherDesk.x + 10, teacherDesk.y + teacherDesk.height, teacherDesk.width - 20, 8);

  for (const desk of desks) {
    const isPlayerDesk = desk === playerDesk;
    ctx.fillStyle = isPlayerDesk ? '#5b493b' : '#4b3b30';
    ctx.fillRect(desk.x, desk.y, desk.width, desk.height);
    ctx.fillStyle = '#2b201d';
    ctx.fillRect(desk.x + 8, desk.y + desk.height, desk.width - 16, deskLayout.legHeight);
  }

  ctx.fillStyle = detentionReleased ? '#90e088' : '#9d6f5e';
  ctx.fillRect(door.x, door.y, door.width, door.height);
  ctx.strokeStyle = '#241b19';
  ctx.lineWidth = 3;
  ctx.strokeRect(door.x, door.y, door.width, door.height);
}

function drawTeacher() {
  ctx.fillStyle = '#4f7f7a';
  ctx.fillRect(teacher.x, teacher.y, teacher.width, teacher.height);

  ctx.fillStyle = '#f2c7a0';
  ctx.fillRect(teacher.x + 6, teacher.y + 4, teacher.width - 12, 13);

  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(teacher.x + teacher.width / 2 - 2, teacher.y + 8, 4, 4);
}

function drawNpc(npc) {
  if (npc.leftRoom) {
    return;
  }

  const isActive = npc.id === activeNpcId;

  ctx.fillStyle = npc.color;
  ctx.fillRect(npc.x, npc.y, npc.width, npc.height);

  const head = getNpcHeadPosition(npc);
  ctx.fillStyle = '#f2c7a0';
  ctx.beginPath();
  ctx.arc(head.x, head.y, npc.headRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(head.x - 2, head.y - 1, 4, 3);

  if (isActive) {
    ctx.strokeStyle = '#f6df88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(head.x, head.y, npc.headRadius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer() {
  const bob = player.seated ? 0 : Math.sin(performance.now() / 100) * 1.5;

  ctx.fillStyle = '#6fb3ff';
  ctx.fillRect(player.x, player.y + bob, player.width, player.height);

  ctx.fillStyle = '#f5d7b0';
  ctx.fillRect(player.x + 8, player.y + 5 + bob, player.width - 16, 14);

  ctx.fillStyle = '#121212';
  switch (player.facing) {
    case 'up':
      ctx.fillRect(player.x + player.width / 2 - 2, player.y + 4 + bob, 4, 4);
      break;
    case 'down':
      ctx.fillRect(player.x + player.width / 2 - 2, player.y + 14 + bob, 4, 4);
      break;
    case 'left':
      ctx.fillRect(player.x + 6, player.y + 10 + bob, 4, 4);
      break;
    case 'right':
      ctx.fillRect(player.x + player.width - 10, player.y + 10 + bob, 4, 4);
      break;
    default:
      break;
  }
}

function render() {
  drawRoom();
  drawTeacher();
  for (const npc of npcs) {
    drawNpc(npc);
  }
  drawPlayer();
}

function tick(now) {
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  updatePlayer(deltaTime);
  handleTeacherBehavior(Date.now());
  updateNpcDismissal(deltaTime);

  const remaining = getMsRemaining();
  const pausedText = timerPausedByTeacher ? ' (Paused)' : '';
  timeRemainingLabel.textContent = `Time remaining: ${formatRemaining(remaining)}${pausedText}`;

  if (remaining <= 0 && !detentionReleased && !introCutsceneActive) {
    statusText.textContent = 'Status: Time served. Head to the door and press Space.';
  }

  render();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  if (
    event.code === 'ArrowLeft' ||
    event.code === 'ArrowRight' ||
    event.code === 'ArrowUp' ||
    event.code === 'ArrowDown'
  ) {
    keys.add(event.code);
    event.preventDefault();
  }

  if (event.code === 'Space') {
    if (introCutsceneActive) {
      advanceIntroCutscene();
      event.preventDefault();
      return;
    }

    const now = performance.now();
    if (now - lastSpacePress > 200) {
      handleDoorInteraction();
      lastSpacePress = now;
    }
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

canvas.addEventListener('click', (event) => {
  if (introCutsceneActive) {
    advanceIntroCutscene();
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;

  tryTalkToNpcAt(canvasX, canvasY);
});

setDialogue('Friday detention. Click heads to talk. While seated you can only chat with neighbors.');
statusText.textContent = 'Status: Waiting for detention assignment...';
showIntroCutsceneStep();
requestAnimationFrame(tick);
