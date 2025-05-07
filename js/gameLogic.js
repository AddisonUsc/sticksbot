let p1Wins = 0;
let p2Wins = 0;
let gameActive = false;
let gameStarted = false;
let setupComplete = false;
let setupFrameCount = 0;
const REQUIRED_SETUP_FRAMES = 15;

const graceTimers = { P1: null, P2: null };
let soloMode = false;
let computerHand = [1, 1];
let playerHand = [1, 1];
let justHit = false;
let playerZeroSince = null;

function toggleSolo() {
  soloMode = !soloMode;
  document.getElementById("solo-toggle").textContent = soloMode ? "Solo Mode: ON" : "Solo Mode";
  computerHand = [1, 1];
  playerHand = [1, 1];
  justHit = false;
  playerZeroSince = null;

  const video = document.getElementById("webcam");
  video.style.transform = soloMode ? "scaleX(-1)" : "scaleX(1)";
  const canvas = document.getElementById("output");
  canvas.style.transform = soloMode ? "scaleX(-1)" : "scaleX(1)";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (soloMode) {
    startRound();
  } else {
    resetGameState();
  }
}

function resetGameState() {
  gameActive = false;
  gameStarted = false;
  setupComplete = false;
  setupFrameCount = 0;
  window.currP1 = [];
  window.currP2 = [];
  document.getElementById("start-btn").textContent = "Start Game";
  document.getElementById("p1-move").innerText = "";
  document.getElementById("p2-move").innerText = "";
  document.getElementById("go-indicator").style.display = "none";
  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  justHit = false;
  playerZeroSince = null;
}

function showIndicator(text) {
  const el = document.getElementById("go-indicator");
  el.innerText = text;
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 2000);
}

function drawHandLandmarks(ctx, landmarks, canvas) {
  if (!gameActive) return;

  const fingerTips = [8, 12, 16, 20];
  const fingerPIPs = [6, 10, 14, 18];
  const buffer = 0.015;
  const wrist = landmarks[0];

  let fingersUp = 0;
  fingerTips.forEach((tipIndex, i) => {
    const pipIndex = fingerPIPs[i];
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];

    if (soloMode) {
      if (tip.y < pip.y - buffer) fingersUp++;
    } else {
      const isP1 = wrist.x * canvas.width > canvas.width / 2;
      if ((isP1 && tip.x < pip.x - buffer) || (!isP1 && tip.x > pip.x + buffer)) {
        fingersUp++;
      }
    }
  });

  const x = wrist.x * canvas.width;
  const y = wrist.y * canvas.height;

  if (!soloMode) {
    const isP1 = wrist.x * canvas.width > canvas.width / 2;
    const label = isP1 ? "P1" : "P2";
    ctx.fillStyle = isP1 ? "cyan" : "lime";
    ctx.font = "24px Arial";
    ctx.fillText(`${label}: ${fingersUp}`, canvas.width - x, y - 30);
  } else {
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(`${fingersUp}`, canvas.width - x, y - 30);
  }

  landmarks.forEach((point) => {
    const px = canvas.width - point.x * canvas.width;
    const py = point.y * canvas.height;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fill();
  });

  if (soloMode) {
    const leftBox = { x: 10, y: 10, w: 100, h: 100 };
    const rightBox = { x: canvas.width - 110, y: 10, w: 100, h: 100 };

    let hitBox = null;
    for (let point of landmarks) {
      const px = canvas.width - point.x * canvas.width;
      const py = point.y * canvas.height;
      const flipX = canvas.width - px;

      if (flipX >= leftBox.x && flipX <= leftBox.x + leftBox.w && py >= leftBox.y && py <= leftBox.y + leftBox.h) {
        hitBox = 1;
        break;
      } else if (flipX >= rightBox.x && flipX <= rightBox.x + rightBox.w && py >= rightBox.y && py <= rightBox.y + rightBox.h) {
        hitBox = 0;
        break;
      }
    }

    if (setupComplete && hitBox !== null && !justHit && fingersUp > 0 && computerHand[hitBox] > 0) {
      computerHand[hitBox] += fingersUp;
      if (computerHand[hitBox] >= 5) {
        computerHand[hitBox] = 0;
      }
      justHit = true;
      setTimeout(() => {
        simulateComputerMove();
        justHit = false;
      }, 3000);
    }

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(leftBox.x, leftBox.y, leftBox.w, leftBox.h);
    ctx.strokeRect(rightBox.x, rightBox.y, rightBox.w, rightBox.h);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`${computerHand[0]}`, 50, 65);
    ctx.fillText(`${computerHand[1]}`, canvas.width - 60, 65);

    if (!window.currP1) window.currP1 = [];
    window.currP1.push(fingersUp);
    playerHand = window.currP1.slice(0, 2);

    const totalFingers = playerHand[0] + playerHand[1];
if (setupComplete && totalFingers === 0) {
  if (!playerZeroSince) {
    playerZeroSince = Date.now();
  } else if (Date.now() - playerZeroSince > 3000) {
    const goEl = document.getElementById("go-indicator");
    goEl.innerText = "COMPUTER WINS!";
    goEl.style.display = "block";

    setTimeout(() => {
      goEl.style.display = "none";
      soloMode = false;
      resetGameState();
    }, 2000);
  }
} else {
  playerZeroSince = null;
}

    if (setupComplete && computerHand[0] === 0 && computerHand[1] === 0 && !justHit) {
      justHit = true;
      showIndicator("PLAYER WINS!");
      setTimeout(() => {
        p1Wins++;
        document.getElementById("p1-wins").innerText = "Player 1 Wins: " + p1Wins;
        soloMode = false;
        resetGameState();
      }, 2000);
    }
  } else {
    const isP1 = wrist.x * canvas.width > canvas.width / 2;
    if (isP1) {
      if (!window.currP1) window.currP1 = [];
      window.currP1.push(fingersUp);
    } else {
      if (!window.currP2) window.currP2 = [];
      window.currP2.push(fingersUp);
    }
  }
}

function simulateComputerMove() {
  const playerLive = playerHand.filter(h => h > 0);
  const computerLive = computerHand.filter(h => h > 0);

  if (playerLive.length === 0 || computerLive.length === 0) return;

  const compOptions = computerHand.map((val, i) => (val > 0 ? i : null)).filter(v => v !== null);
  const playerOptions = playerHand.map((val, i) => (val > 0 ? i : null)).filter(v => v !== null);

  const fromIdx = compOptions[Math.floor(Math.random() * compOptions.length)];
  const toIdx = playerOptions[Math.floor(Math.random() * playerOptions.length)];

  const fromVal = computerHand[fromIdx];
  const toVal = playerHand[toIdx];

  const result = (fromVal + toVal) % 5;
  playerHand[toIdx] = result;

  const display = `COMPUTER MOVE: ${fromVal} -> ${toVal}`;
  document.getElementById("p2-move").innerText = display;
}

function updateRoundState() {
  const p1Ready = (window.currP1 || []).filter(n => n === 1).length >= 2;
  const p2Ready = soloMode ? true : (window.currP2 || []).filter(n => n === 1).length >= 2;

  if (!setupComplete && p1Ready && p2Ready) {
    setupFrameCount++;
    if (setupFrameCount >= REQUIRED_SETUP_FRAMES) {
      setupComplete = true;
      gameStarted = true;
      showIndicator("GO");
    }
  }

  if (gameStarted) {
    const p1Alive = (window.currP1 || []).some(n => n > 0);
    const p2Alive = soloMode ? true : (window.currP2 || []).some(n => n > 0);

    if (!p1Alive && p2Alive) {
      if (!graceTimers.P1) graceTimers.P1 = Date.now();
      else if (Date.now() - graceTimers.P1 > 1500) {
        if (!soloMode) {
          p2Wins++;
          document.getElementById("p2-wins").innerText = "Player 2 Wins: " + p2Wins;
        }
        endGame();
      }
    } else graceTimers.P1 = null;

    if (!p2Alive && p1Alive) {
      if (!graceTimers.P2) graceTimers.P2 = Date.now();
      else if (Date.now() - graceTimers.P2 > 1500) {
        p1Wins++;
        document.getElementById("p1-wins").innerText = "Player 1 Wins: " + p1Wins;
        endGame();
      }
    } else graceTimers.P2 = null;
  }

  window.currP1 = [];
  window.currP2 = [];
}

function startRound() {
  gameActive = true;
  setupComplete = false;
  setupFrameCount = 0;
  gameStarted = false;
  graceTimers.P1 = null;
  graceTimers.P2 = null;
  document.getElementById("go-indicator").style.display = "none";
}

function endGame() {
  gameStarted = false;
  gameActive = false;
  document.getElementById("start-btn").textContent = "Start Game";
}

function toggleRound() {
  if (gameActive) {
    endGame();
  } else {
    startRound();
    document.getElementById("start-btn").textContent = "Stop Game";
  }
}

function displayBestMove(player, message) {
  const id = player === "P1" ? "p1-move" : "p2-move";
  document.getElementById(id).innerText = message;
}

function getBestMove(player) {
  if (!gameActive || !gameStarted || !setupComplete) {
    return displayBestMove(player, "Game not active");
  }

  displayBestMove(player, "Thinking...");

  setTimeout(() => {
    const my = player === "P1" ? window.lastHands?.P1 : window.lastHands?.P2;
    const opp = player === "P1" ? window.lastHands?.P2 : window.lastHands?.P1;

    if (!my || !opp || my.length === 0 || opp.length === 0) {
      return displayBestMove(player, "Hands not detected");
    }

    const myLive = my.filter(h => h > 0);
    const oppLive = opp.filter(h => h > 0);

    if (myLive.length === 0 || oppLive.length === 0) {
      return displayBestMove(player, "No hands alive");
    }

    let bestHit = null;
    let maxHit = 0;

    for (let a of myLive) {
      for (let b of oppLive) {
        const result = a + b;
        if (result === 5) {
          return displayBestMove(player, `HIT ${a} -> ${b}`);
        } else if (result < 5 && result > maxHit) {
          bestHit = `HIT ${a} -> ${b}`;
          maxHit = result;
        }
      }
    }

    displayBestMove(player, bestHit || `HIT ${myLive[0]} -> ${oppLive[0]}`);
  }, 1500);
}
