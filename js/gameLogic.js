let p1Wins = 0;
let p2Wins = 0;

let gameActive = false;
let gameStarted = false;
let setupComplete = false;
let setupFrameCount = 0;
const REQUIRED_SETUP_FRAMES = 15;

const graceTimers = { P1: null, P2: null };

function drawHandLandmarks(ctx, landmarks, canvas) {
  const fingerTips = [8, 12, 16, 20];
  const fingerPIPs = [6, 10, 14, 18];
  const buffer = 0.015;

  const wrist = landmarks[0];
  const isP1 = wrist.x * canvas.width > canvas.width / 2;
  const label = isP1 ? "P1" : "P2";

  let fingersUp = 0;
  fingerTips.forEach((tipIndex, i) => {
    const pipIndex = fingerPIPs[i];
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];

    if ((isP1 && tip.x < pip.x - buffer) || (!isP1 && tip.x > pip.x + buffer)) {
      fingersUp++;
    }
  });

  const x = wrist.x * canvas.width;
  const y = wrist.y * canvas.height;

  ctx.fillStyle = isP1 ? "cyan" : "lime";
  ctx.font = "24px Arial";
  ctx.fillText(`${label}: ${fingersUp}`, canvas.width - x, y - 30);

  landmarks.forEach((point) => {
    const px = canvas.width - point.x * canvas.width;
    const py = point.y * canvas.height;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fill();
  });

  if (isP1) {
    if (!window.p1Hands) window.p1Hands = [];
    window.p1Hands.push(fingersUp);

    if (!window.currP1) window.currP1 = [];
    window.currP1.push(fingersUp);
  } else {
    if (!window.p2Hands) window.p2Hands = [];
    window.p2Hands.push(fingersUp);

    if (!window.currP2) window.currP2 = [];
    window.currP2.push(fingersUp);
  }
}

function updateRoundState() {
  const p1Ones = (window.currP1 || []).filter(n => n === 1).length;
  const p2Ones = (window.currP2 || []).filter(n => n === 1).length;

  const p1Ready = p1Ones >= 2;
  const p2Ready = p2Ones >= 2;

  if (!setupComplete && p1Ready && p2Ready) {
    setupFrameCount++;
    if (setupFrameCount >= REQUIRED_SETUP_FRAMES) {
      setupComplete = true;
      gameStarted = true;
      document.getElementById("go-indicator").style.display = "block";
      setTimeout(() => {
        document.getElementById("go-indicator").style.display = "none";
      }, 2000);
    }
  }

  if (gameStarted) {
    const p1Alive = (window.currP1 || []).some(n => n > 0);
    const p2Alive = (window.currP2 || []).some(n => n > 0);

    if (!p1Alive && p2Alive) {
      if (!graceTimers.P1) graceTimers.P1 = Date.now();
      else if (Date.now() - graceTimers.P1 > 1500) {
        p2Wins++;
        document.getElementById("p2-wins").innerText = "Player 2 Wins: " + p2Wins;
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

    // 👉 Check if SPLIT is possible
    let showSplit = false;
    if (my.length === 2 && my[0] !== 0 && my[1] !== 0) {
      const total = my[0] + my[1];
      const half = Math.floor(total / 2);
      const other = total - half;
      if (
        half > 0 && other > 0 &&
        (half !== my[0] || other !== my[1])
      ) {
        showSplit = true;
      }
    }

    // 👉 Check for lethal hit
    let lethal = null;
    for (let a of myLive) {
      for (let b of oppLive) {
        if (a + b === 5) {
          lethal = `HIT ${a} -> ${b}`;
          break;
        }
      }
      if (lethal) break;
    }

    // 👉 Check for highest impact hit
    let bestHit = lethal;
    if (!lethal) {
      let maxHit = 0;
      for (let a of myLive) {
        for (let b of oppLive) {
          const result = a + b;
          if (result < 5 && result > maxHit) {
            bestHit = `HIT ${a} -> ${b}`;
            maxHit = result;
          }
        }
      }
      if (!bestHit) bestHit = `HIT ${myLive[0]} -> ${oppLive[0]}`;
    }

    if (showSplit) {
      const total = my[0] + my[1];
      const half = Math.floor(total / 2);
      const other = total - half;
      return displayBestMove(player, `SPLIT to ${half} and ${other} OR ${bestHit}`);
    } else {
      return displayBestMove(player, bestHit);
    }

  }, 1500);
}