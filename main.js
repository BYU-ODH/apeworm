var worm = new VowelWorm.instance();

var audio = document.getElementById('media');
audio.loop = true;

var video = document.getElementById('vid');
video.loop = true;

var graphs_element = document.getElementById("graphs");

document.getElementById("media_button").addEventListener("click",usemedia);
document.getElementById("video_button").addEventListener("click",usevideo);
document.getElementById("mic_button").addEventListener("click",usemic);

function usemedia() {
  audio.style.display = 'block';
  worm.setStream(audio);
  worm.game.play(graphs_element);
};

function usevideo() {
  video.style.display = 'block';
  worm.setStream(video);
  worm.game.play(graphs_element);
};

function usemic() {
  audio.pause();
  audio.style.display = 'none';
  getUserMedia({audio: true}, micSuccess, micFailure);
};

function getUserMedia() {
  (navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia
          || function(){alert('getUserMedia missing')}).apply(navigator, arguments);
}

function micSuccess(stream) {
  worm.setStream(stream);
  worm.game.play(graphs_element);
};

function micFailure() {
  alert("Could not capture microphone input");
};