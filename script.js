const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dialogueText = document.getElementById('dialogueText');
const timeRemainingLabel = document.getElementById('timeRemaining');
const statusText = document.getElementById('statusText');

const detentionDurationMs = 60 * 60 * 1000;
const detentionStartedAt = Date.now();

const room = {
  width: canvas.width,
  height: canvas.height,
  wallThickness: 30,
  deskRows: 3,
};

const door = {
  x: room.width - 100,
  y: room.height / 2 - 45,
  width: 24,
  height: 90,
  interactionRadius: 70,
};

const player = {
  x: 120,
  y: room.height / 2,
  width: 36,
  height: 48,
  speed: 220,
  facing: 'down',
};

const keys = new Set();
let lastFrameTime = performance.now();
let detentionReleased = false;
let lastSpacePress = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function setDialogue(message) {
  dialogueText.textContent = message;
}

function getMsRemaining() {
  const elapsed = Date.now() - detentionStartedAt;
  return Math.max(0, detentionDurationMs - elapsed);
}

function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function distanceToDoor() {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const doorCenterX = door.x + door.width / 2;
  const doorCenterY = door.y + door.height / 2;
  return Math.hypot(playerCenterX - doorCenterX, playerCenterY - doorCenterY);
}

function handleDoorInteraction() {
  if (distanceToDoor() > door.interactionRadius) {
    setDialogue("");
    return;
  }

  const remaining = getMsRemaining();
  if (remaining > 0) {
    setDialogue("You are not allowed to leave detention yet.");
    return;
  }

  detentionReleased = true;
  statusText.textContent = 'Status: Detention complete. You are free to leave!';
  setDialogue('You leave detention. You can finally hang out with your friends.');
}

function updatePlayer(deltaTime) {
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

    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;

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

  const deskColor = '#4b3b30';
  const deskSpacingX = 170;
  const deskSpacingY = 120;
  for (let row = 0; row < room.deskRows; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = 120 + col * deskSpacingX;
      const y = 80 + row * deskSpacingY;
      ctx.fillStyle = deskColor;
      ctx.fillRect(x, y, 70, 36);
      ctx.fillStyle = '#2b201d';
      ctx.fillRect(x + 8, y + 36, 54, 7);
    }
  }

  ctx.fillStyle = detentionReleased ? '#90e088' : '#9d6f5e';
  ctx.fillRect(door.x, door.y, door.width, door.height);
  ctx.strokeStyle = '#241b19';
  ctx.lineWidth = 3;
  ctx.strokeRect(door.x, door.y, door.width, door.height);
}

function drawPlayer() {
  const bob = Math.sin(performance.now() / 100) * 1.5;

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
  drawPlayer();
}

function tick(now) {
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  updatePlayer(deltaTime);

  const remaining = getMsRemaining();
  timeRemainingLabel.textContent = `Time remaining: ${formatRemaining(remaining)}`;

  if (remaining <= 0 && !detentionReleased) {
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

setDialogue('A long hour waits ahead. Walk with arrows and check the door with Space.');
requestAnimationFrame(tick);
