var selected_mic = false;
var video = document.getElementById('vid');
video.loop = true;

var graphs_element = document.getElementById("graphs");

document.getElementById("media_button").addEventListener("click",usemedia);
document.getElementById("video_button").addEventListener("click",usevideo);
document.getElementById("mic_button").addEventListener("click",usemic);

var game = new window.VowelWorm.Game({element: graphs_element});

function usemedia() {
  var worms = [];
  var audio_els = document.getElementsByClassName('media');
  
  var audios_loaded = 0;
  function audioReady() {
    audios_loaded++;
    if(audios_loaded == audio_els.length) {
      for(var i = 0; i<audio_els.length; i++) {
        audio_els[i].play();
      }
    }
  }

  // hacky loop to make sure audio stays somewhat in sync
  var audios_finished = 0;
  function audioFinished() {
    if(audios_finished >= audio_els.length) {
      audios_finished = 0;
    }
    audios_finished++;
    if(audios_finished === audio_els.length) {
      for(var i = 0; i<audio_els.length; i++) {
        audio_els[i].play();
      }
    }
  };

  for(var i = 0; i<audio_els.length; i++) {
    var audio = audio_els[i];
    audio.style.display = 'block';
    audio.load();
    audio.addEventListener('canplaythrough', audioReady);
    audio.addEventListener('ended', audioFinished);
    var worm = new window.VowelWorm.instance(audio);
    worms.push(worm);
    game.addWorm(worm);
  }
}

function usevideo() {
  video.style.display = 'block';
  var worm = new window.VowelWorm.instance(video);
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
  var worm = new window.VowelWorm.instance(stream);
  game.addWorm(worm);
};

function micFailure() {
  alert("Could not capture microphone input");
};
