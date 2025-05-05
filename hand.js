const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

let hands;
let camera;

function startCamera() {
  camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.image) {
    canvasCtx.save();
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();
  }

  // Reset current hand data
  window.currP1 = [];
  window.currP2 = [];

  if (!gameActive || !results.multiHandLandmarks) return;

  results.multiHandLandmarks.forEach((landmarks) => {
    drawHandLandmarks(canvasCtx, landmarks, canvasElement);
  });

  // Save snapshot of hand state AFTER drawing
  window.lastHands = {
    P1: [...(window.currP1 || [])],
    P2: [...(window.currP2 || [])]
  };

  updateRoundState();
}

function setup() {
  videoElement.width = 640;
  videoElement.height = 480;
  canvasElement.width = 640;
  canvasElement.height = 480;

  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 4,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  hands.onResults(onResults);
  startCamera();
}

setup();
