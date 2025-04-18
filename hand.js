let video, canvas, ctx, model;

async function main() {
  video = document.getElementById('video');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(resolve => video.onloadedmetadata = resolve);
  video.play();

  canvas = document.getElementById('output');
  ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  model = await handpose.load(); // ← using basic handpose

  detectHands();
}

async function detectHands() {
  async function frame() {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width * -1, canvas.height);
    ctx.restore();

    const predictions = await model.estimateHands(video);
    if (predictions.length > 0) {
      if (typeof drawHandLandmarks === 'function') {
        drawHandLandmarks(predictions);
      }
    }

    requestAnimationFrame(frame);
  }

  frame();
}

navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;

main();
