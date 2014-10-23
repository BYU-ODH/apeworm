var selected_mic = false;
var graphs_element = document.getElementById("wrapper");
var media_button = document.getElementById("media_button");
var mic_button = document.getElementById("mic_button");
var language_select = document.getElementById("language");

language_select.addEventListener("change",changelang,false);
media_button.addEventListener("click",usemedia,false);
mic_button.addEventListener("click",usemic,false);
mic_button.addEventListener("click",usemic,false);

var game = new window.VowelWorm.Game({element: graphs_element});

var media_on = false;
var started = false;

function changelang() {
  game.language = language_select.value;
};

function usemedia() {
  var audio_els = document.getElementsByClassName('media');
  if(media_on) {
    media_on = false;
    media_button.classList.add('fa-play');
    media_button.classList.remove('fa-pause');
    for (var i = 0; i < audio_els.length; i++) {
      audio_els[i].pause();
    }

    return;
  }

  media_on = true;
  media_button.classList.remove('fa-play');
  media_button.classList.add('fa-pause');
  
  var worms = [];

  function playAll() {
    for(var i = 0; i<audio_els.length; i++) {
      audio_els[i].play();
    }
  }
  
  var audios_loaded = 0;
  function audioReady() {
    audios_loaded++;
    if(audios_loaded >= audio_els.length) {
      playAll();
    }
  }

  if(started) {
    playAll();
    return; // don't add more event listeners
  }

  // hacky loop to make sure audio stays somewhat in sync
  var audios_finished = 0;
  function audioFinished() {
    if(audios_finished >= audio_els.length) {
      audios_finished = 0;
    }
    audios_finished++;
    if(audios_finished === audio_els.length) {
      playAll();
    }
  };

  for(var i = 0; i<audio_els.length; i++) {
    var audio = audio_els[i];
    audio.load();
    audio.addEventListener('canplaythrough', audioReady);
    audio.addEventListener('ended', audioFinished);
    var worm = new window.VowelWorm.instance(audio);
    worms.push(worm);
    game.addWorm(worm);
  }
  started = true;
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
