let model, video, canvas, ctx;
let videoWidth, videoHeight;

async function main() {
  await tf.setBackend('webgl');
  await tf.ready();

  const detectorConfig = {
    runtime: 'mediapipe',
    modelType: 'full',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
  };

  model = await handPoseDetection.createDetector(
    handPoseDetection.SupportedModels.MediaPipeHands,
    detectorConfig
  );

  video = document.getElementById('video');

  const stream = await navigator.mediaDevices.getUserMedia({video: true});
  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });

  video.play();

  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;

  canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  ctx = canvas.getContext('2d');

  landmarksRealTime(video);
}

const landmarksRealTime = async (video) => {
  async function frameLandmarks() {
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);

    const hands = await model.estimateHands(video, {flipHorizontal: true});

    if (hands.length > 0) {
      for (let i = 0; i < hands.length; i++) {
        const keypoints = hands[i].keypoints;
    
        for (let j = 0; j < keypoints.length; j++) {
          const {x, y} = keypoints[j];
    
          ctx.beginPath();
          ctx.arc(canvas.width - x, y, 5, 0, 2 * Math.PI); // <<< FLIP X here
          ctx.fillStyle = "red";
          ctx.fill();
        }
      }
    
      if (typeof drawHandLandmarks === 'function') {
        drawHandLandmarks(hands);
      }
    }
    

    requestAnimationFrame(frameLandmarks);
  }

  frameLandmarks();
};

main();
