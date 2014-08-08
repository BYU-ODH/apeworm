var selected_mic = false;
var video = document.getElementById('vid');
video.loop = true;

var graphs_element = document.getElementById("graphs");

document.getElementById("media_button").addEventListener("click",usemedia);
document.getElementById("video_button").addEventListener("click",usevideo);
document.getElementById("mic_button").addEventListener("click",usemic);

var game = new VowelWorm.Game({element: graphs_element});

function usemedia() {
  var worms = [];
  var audio_els = document.getElementsByClassName('media');

  for(var i = 0; i<audio_els.length; i++) {
    var audio = audio_els[i];
    audio.style.display = 'block';
    audio.loop = true;
    audio.play();
    var worm = new VowelWorm.instance(audio);
    worms.push(worm);
    game.addWorm(worm);
  }
}

function usevideo() {
  video.style.display = 'block';
  var worm = new VowelWorm.instance(video);
  game.addWorm(worm);
};

function usemic() {
  if(!selected_mic){
    getUserMedia({audio: true}, micSuccess, micFailure);
    selected_mic = true;
  }
};

function getUserMedia() {
  (navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia
          || function(){alert('getUserMedia missing')}).apply(navigator, arguments);
}

function micSuccess(stream) {
  var worm = new VowelWorm.instance(stream);
  game.addWorm(worm);
};

function micFailure() {
  alert("Could not capture microphone input");
};
