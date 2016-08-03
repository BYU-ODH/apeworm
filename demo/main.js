if ((window.location.host == "byu-odh.github.io") && (window.location.protocol != "https:"))
  window.location.protocol = "https";

var selected_mic = false;
var graphs_element = document.getElementById("wrapper");
var media_button = document.getElementById("media_button");
var mic_button = document.getElementById("mic_button");
//var a-sound = document.getElementById("yayVowel");
//var language_select = document.getElementById("language");

//language_select.addEventListener("change",changelang,false);
media_button.addEventListener("click",usemedia,false);
mic_button.addEventListener("click",usemic,false);
//yayVowel.innerHTML = "<p id='oval'></p>";

var game = new window.VowelWorm.Game({element: graphs_element});

var media_on = false;
var started = false;

/*function changelang() {
  game.language = language_select.value;
  
  if(language_select.value=="en"){
	alert("Oops! Looks like English isn't ready yet!");
  }
  
  language_select.value = "de"
};*/

function usemedia() {
  //audio_els holds the sample audio (class=media in index.html)
  var audio_els = document.getElementsByClassName('media');
  
  //shows pause button
  if(media_on) {
    media_on = false;
    media_button.classList.add('fa-play');
    media_button.classList.remove('fa-pause');
	//pauses audio
    for (var i = 0; i < audio_els.length; i++) {
      audio_els[i].pause();
    }

    return;
  }

  //shows play button
  media_on = true;
  media_button.classList.remove('fa-play');
  media_button.classList.add('fa-pause');
  
  //container for the worms
  var worms = [];

  //plays sample audio
  function playAll() {
    for(var i = 0; i<audio_els.length; i++) {
      audio_els[i].play();
    }
  }
  
  //Supposed to make sure the audio all starts at the same time?
  //TODO: If so, it's not working.
  var audios_loaded = 0;
  function audioReady() {
    audios_loaded++;
    if(audios_loaded >= audio_els.length) {
      playAll();
    }
  }
	
  //Calls playAll function?
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
  
  //draws worms
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
  
  /*
  //attempt at making a "stop mic" button
  if(selected_mic == true) {
    mic_button.classList.add('fa-microphone-slash');
    mic_button.classList.remove('fa-microphone');
	
    //getUserMedia({audio: false}, micSuccess, micFailure);
    //selected_mic = false;
	//worm.remove;

	//tests whether program has made it this far
	document.getElementById("yayVowel").innerHTML = "Sucess!";

  //}
  */
  
};

//Asks user for permission to use mic
function getUserMedia() {
   //Note: This is the old getUserMedia and should eventually be updated to this:
   //https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  (navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia
          || function(){alert('getUserMedia missing')}).apply(navigator, arguments);
}

//If the user says "yes", this will be called
function micSuccess(stream) { 
  //gets audio info from mic (in FFTs)
  var worm = new window.VowelWorm.instance(stream);//(stream) is live audio as opposed to inputed (video) or (audio)
  
  game.addWorm(worm);
};

function micFailure() {
  alert("Could not capture microphone input");
};

function makeOval() {

		//document.getElementById("yayVowel").innerHTML = "<p id='oval'></p>";
		//Toggle button: http://www.w3schools.com/jquery/tryit.asp?filename=tryjquery_eff_toggle	
	}