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
    const landmarks = hand.keypoints;

    for (let i = 0; i < landmarks.length; i++) {
      const {x, y} = landmarks[i];

      ctx.beginPath();
      ctx.arc(canvas.width - x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  });
}
