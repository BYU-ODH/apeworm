var worm = new VowelWorm.instance();
var audio = document.getElementById('media');
audio.loop = true;
var video = document.getElementById('vid');
video.loop = true;

function getUserMedia() {
  (navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || function(){alert('getUserMedia missing')})
                        .apply(navigator, arguments);
}

function usemedia() {
  audio.style.display = 'block';
  worm.setStream(audio);
  worm.game.play();
};

function usevideo() {
  video.style.display = 'block';
  worm.setStream(video);
  worm.game.play();
};

function micSuccess(stream) {
  worm.setStream(stream);
  worm.game.play();
};

function micFailure() {
  alert("Could not capture microphone input");
};

function usemic() {
  audio.pause();
  audio.style.display = 'none';
  getUserMedia({audio: true}, micSuccess, micFailure);
};
