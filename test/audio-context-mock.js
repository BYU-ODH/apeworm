/**
 * A limited AudioContext polyfill for testing purposes only.
 */
if(window.AudioContext === undefined) {
  window.AudioContext = function AudioContext() {
    this.createAnalyser = function() {
      return new function AnalyserNode() {

      };
    };
  };
};
