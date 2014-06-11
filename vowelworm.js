/**
 * Contains methods used in the analysis of vowel audio data
 * @param {?AudioContext} context The audio context to analyze
 * @constructor
 * @final
 */
function VowelWorm(context) {};

/**
 * Contains methods for normalizing Hz values
 * @const
 */
VowelWorm.Normalization = {
  /**
   * @param {number} formant The formant (in Hz) to convert to the Bark Scale
   * @return {number} The formant converted to the Bark Scale
   * @nosideeffects
   */
  toBarkScale: function toBarkScale(formant) {
    // uses the Traunmüller conversion
    if(formant == 0) {
      formant = 1;
    }
    return 26.81/(1+(1960/formant)) - 0.53;
  }
};

/**
 * Finds the peaks of the curve
 * Use this file only after you have passed your array through the smoothCurve function twice
 * @param {Array.<number>} smoothedArray data, expected to have been smoothed, to extract peaks from
 * @return {Array.<number>} the positions of all the peaks found
 * @nosideeffects
 */
VowelWorm.getPeaks = function getPeaks(smoothedArray) {
	var peakPositions = new Array();
	var previousNum;
	var currentNum;
	var nextNum;

	for(var i = 0; i < smoothedArray.length; i++) {
		if(i == 0) {
			previousNum = 0;
			currentNum = smoothedArray[i];
			nextNum = smoothedArray[i+1];
		}
		else if(i == smoothedArray.length - 1) {
			previousNum = smoothedArray[i-1];
			currentNum = smoothedArray[i];
			nextNum = 0;
		}
		else {
			previousNum = smoothedArray[i-1];
			currentNum = smoothedArray[i];
			nextNum = smoothedArray[i+1];
		}
		
		 if(currentNum > previousNum && currentNum > nextNum)
			peakPositions.push(i);
	}
	return peakPositions;
};
