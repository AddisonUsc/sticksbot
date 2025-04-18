console.log("gameLogic.js loaded!");

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('output');
  ctx = canvas.getContext('2d');

  console.log('Canvas and context are ready!');
});

// This function will be called by hand.js
function drawHandLandmarks(hands) {
  if (!ctx) return;

  hands.forEach(hand => {
    const landmarks = hand.landmarks || (hand.keypoints && hand.keypoints.map(p => [p.x, p.y])) || [];
    if (landmarks.length === 0) return;

    let fingersUp = 0;
    const fingerTips = [8, 12, 16, 20]; // Only Index, Middle, Ring, Pinky
    const fingerPIPs = [6, 10, 14, 18]; // Skip thumb

    const wrist = landmarks[0];

    const buffer = 10; // buffer distance for stronger extension

    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const pip = landmarks[fingerPIPs[i]];

      const distTip = Math.hypot(tip[0] - wrist[0], tip[1] - wrist[1]);
      const distPIP = Math.hypot(pip[0] - wrist[0], pip[1] - wrist[1]);

      if (distTip > distPIP + buffer) {
        fingersUp++;
      }
    }

    // Draw points
    landmarks.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(canvas.width - x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    // Show count
    const palmBase = landmarks[0];
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(fingersUp.toString(), canvas.width - palmBase[0], palmBase[1] - 30);
  });
}
