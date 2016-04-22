var selected_mic = false;
var graphs_element = document.getElementById("wrapper");
var media_button = document.getElementById("media_button");
var mic_button = document.getElementById("mic_button");

media_button.addEventListener("click",usemedia,false);
mic_button.addEventListener("click",usemic,false);

var game = new window.VowelWorm.Game({element: graphs_element});
game.saveData = true;

var media_on = false;
var started = false;

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

    // Event listener for when audio is loaded
    audio.addEventListener('canplaythrough', audioReady);

    // Event listener for when audio finishes playing
    // audio.addEventListener('ended', audioFinished);
    audio.addEventListener('ended', function() {

      game.stopped = true;

      media_on = false;
      media_button.classList.add('fa-play');
      media_button.classList.remove('fa-pause');

      // Save the time stamps, time domain data, and fft data for experimentation
      var dataString = '';
      for (var i = 0; i < worms[0].timestamps.length; i++) {
        dataString += worms[0].timestamps[i] + '\n';
      }
      for (var i = 0; i < worms[0].timeDomainData.length; i++) {
        dataString += worms[0].timeDomainData[i].join() + '\n';
      }
      for (var i = 0; i < worms[0].ffts.length; i++) {
        dataString += worms[0].ffts[i].join() + '\n';
      }
      console.log(dataString);
    });

    // Create a vowel worm for this audio element
    var worm = new window.VowelWorm.instance(audio);
    worms.push(worm);
    game.addWorm(worm);
  }
  // started = true;
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
  // TODO: According to Mozilla, navigator.getUserMedia is being deprecated, so will need to change it.
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
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
