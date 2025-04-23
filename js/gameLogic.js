let winFrameCount = 0;
let winner = null;
let p1Wins = 0;
let p2Wins = 0;

function drawHandLandmarks(ctx, landmarks, canvas) {
  const fingerTips = [8, 12, 16, 20];
  const fingerPIPs = [6, 10, 14, 18];
  const buffer = 10;
  let fingersUp = 0;

  const wrist = landmarks[0];

  fingerTips.forEach((tipIndex, i) => {
    const pipIndex = fingerPIPs[i];
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];

    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distPIP = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);

    if (distTip > distPIP + buffer / 100) {
      fingersUp++;
    }
  });

  // Determine side and assign label
  const x = wrist.x * canvas.width;
  const y = wrist.y * canvas.height;
  const isLeftSide = x < canvas.width / 2;
  const label = isLeftSide ? "P1" : "P2";

  ctx.fillStyle = fingersUp === 0 ? "gray" : (isLeftSide ? "cyan" : "lime");
  ctx.font = "24px Arial";
  ctx.fillText(`${label}: ${fingersUp}`, canvas.width - x, y - 30);

  // Draw landmarks
  landmarks.forEach((point) => {
    const px = canvas.width - point.x * canvas.width;
    const py = point.y * canvas.height;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Store counts
  if (isLeftSide) {
    if (typeof window.p1HandCounts === "undefined") window.p1HandCounts = [];
    window.p1HandCounts.push(fingersUp);
  } else {
    if (typeof window.p2HandCounts === "undefined") window.p2HandCounts = [];
    window.p2HandCounts.push(fingersUp);
  }
}

function updateWinCount() {
  const p1 = (window.p1HandCounts || []).filter(n => n > 0).length;
  const p2 = (window.p2HandCounts || []).filter(n => n > 0).length;

  const p1Out = p1 === 0;
  const p2Out = p2 === 0;

  if (p1Out && !p2Out) {
    if (winner !== "P2") {
      winFrameCount++;
      if (winFrameCount > 15) {
        p2Wins++;
        document.getElementById("p2-wins").innerText = "Player 2 Wins: " + p2Wins;
        winner = "P2";
      }
    }
  } else if (p2Out && !p1Out) {
    if (winner !== "P1") {
      winFrameCount++;
      if (winFrameCount > 15) {
        p1Wins++;
        document.getElementById("p1-wins").innerText = "Player 1 Wins: " + p1Wins;
        winner = "P1";
      }
    }
  } else {
    winFrameCount = 0;
    winner = null;
  }

  // Reset hand counts each frame
  window.p1HandCounts = [];
  window.p2HandCounts = [];
}
