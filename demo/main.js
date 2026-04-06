import { VowelWorm, Game } from "../dist/vowelworm.js";

var game = null;
var worms = [];
var mediaElements;
var currentMediaIndex = 0;
var isPlaying = false;

function init() {
  mediaElements = document.querySelectorAll("audio.media");

  document.getElementById("media_button").addEventListener("click", toggleMedia);
  document.getElementById("mic_button").addEventListener("click", toggleMic);

  game = new Game({
    element: document.getElementById("wrapper"),
    width: 700,
    height: 500
  });
  game.play();
}

function toggleMedia() {
  var button = document.getElementById("media_button");
  var audio = mediaElements[currentMediaIndex];

  if (isPlaying) {
    audio.pause();
    button.classList.remove("fa-pause");
    button.classList.add("fa-play");
    isPlaying = false;
  } else {
    var worm = new VowelWorm(audio);
    game.addWorm(worm);
    worms.push(worm);

    audio.play();
    button.classList.remove("fa-play");
    button.classList.add("fa-pause");
    isPlaying = true;

    audio.addEventListener("ended", function onEnded() {
      audio.removeEventListener("ended", onEnded);
      currentMediaIndex = (currentMediaIndex + 1) % mediaElements.length;
      button.classList.remove("fa-pause");
      button.classList.add("fa-play");
      isPlaying = false;
    });
  }
}

function toggleMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("getUserMedia is not supported in this browser.");
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      var worm = new VowelWorm(stream);
      game.addWorm(worm);
      worms.push(worm);
    })
    .catch(function(err) {
      console.error("Microphone access denied:", err);
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
