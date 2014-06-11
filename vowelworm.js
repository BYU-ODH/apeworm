window.VowelWorm = window.VowelWorm || {};

(function(VowelWorm){
"use strict";

/**
 * Contains methods used in the analysis of vowel audio data
 * @param {?AudioContext} context The audio context to analyze
 * @constructor
 * @final
 */
VowelWorm.instance = function VowelWorm(context) {};

/**
 * Contains methods for normalizing Hz values
 * @const
 */
VowelWorm.Normalization = {
  /**
   * Uses the Traunmüller conversion to conver the formant to the Bark Scale
   * @param {number} formant The formant (in Hz) to convert to the Bark Scale
   * @return {number} The formant converted to the Bark Scale
   * @nosideeffects
   */
  toBarkScale: function toBarkScale(formant) {
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

/**
 * @license Savitsky-Golay filter (VowelWorm.smoothCurve)
 * adapted from http://wiki.scipy.org/Cookbook/SavitzkyGolay
 */
/**
 * Applies the Savitsky-Golay filter to the given array
 * uses numeric javascript
 * Adapted from http://wiki.scipy.org/Cookbook/SavitzkyGolay
 * @param {Array.<number>} y The values to smooth
 * @param {number} window_size The window size
 * @param {number} order the 
 * @return {Array.<number>} if plotted gives you a smooth curve version of an parameter array
 * @nosideeffects
 */
VowelWorm.smoothCurve = function smoothCurve(y, window_size, order) {
	//probably we don't need to parseInt anything or take the absolute value if we always make sure that our windown size and order are positive.  "golay.py" gave a window size of 55 and said that anything higuer will make a flatter graph
  //window size must be positive and an odd number for this to work better
	var windowSize = Math.abs(parseInt(window_size));
	var order = Math.abs(parseInt(order));
	var order_range = order + 1;

	var half_window = (windowSize - 1)/2;
	var b = new Array();
	
	for(var k = -half_window; k < half_window+1; k++) {
		var row = new Array();
		for(var i = 0; i < order_range; i++) {
			row.push(Math.pow(k,i));	
		}
		b.push(row);	
	}
	//This line needs to be changed if you use something other than 0 for derivative
	var temp = numeric.pinv(b);
	var m = temp[0];
	//if you take a look at firstvals in the python code, and then at this code you'll see that I've only broken firstvals down into different parts such as first taking a sub array, flipping it, and so on
	var yTemp = new Array();
	yTemp = y.subarray ? y.subarray(1, half_window+1) :  y.slice(1, half_window+1);
	yTemp = flipArray(yTemp);
	yTemp = addToArray(yTemp, -y[0]);
	yTemp = arrayAbs(yTemp);
	yTemp = negArrayAddValue(yTemp, y[0]);
	var firstvals = yTemp;
	
	//Same thing was done for lastvals
	var yTemp2 = new Array();
	yTemp2 = y.subarray ? y.subarray(-half_window -1, -1) : y.slice(-half_window -1, -1);
	yTemp2 = flipArray(yTemp2);
	yTemp2 = addToArray(yTemp2, -y[y.length-1]);
	yTemp2 = arrayAbs(yTemp2);
	yTemp2 = addToArray(yTemp2, y[y.length-1]);
	var lastvals = yTemp2;
	
	y = concatenate(firstvals, y, lastvals);
	m = flipArray(m);
	var result = new Array();
	result = VowelWorm.convolve(m,y);
	return result;
};

/**
 * TODO: documentation; we pulled this algorithm from StackOverflow—but where?
 * @param {Array.number} m
 * @param {Array.number} y
 * @return {Array.number}
 * @nosideeffects
 */
VowelWorm.convolve = function convolve(m, y) {
	var result = new Array(),
      first  = null,
      second = null;

  if(m.length > y.length) {
    first  = y;
    second = m;
  }
  else
  {
    first  = m;
    second = y;
  }
  var size = second.length - first.length + 1;	
  for(var i = 0; i < size; i++) {
    var newNum = 0,
        len = first.length;

    for(var j = 0; j < first.length; j++) {
      newNum = newNum + first[len-1-j]*second[j+i];
    }
    result.push(newNum);
  }
  return result;	 		
};

/*******************
 * HELPER FUNCTIONS
 *******************/

/**
 * Iterates through an array, applying the absolute value to each item
 * TODO: do we EVER get any negative values here? maybe we can ditch this.
 * @param {Array.<number>} y The array to map
 * @return {Array.<number>} the original array, transformed
 */
function arrayAbs(y) {
	for(var i = 0; i < y.length; i++) {
		y[i] = Math.abs(y[i]);
	}
	return y;
};

/**
 * Iterates through an array, inverting each item and adding a given number
 * @param {Array.<number>} y The array to map
 * @param {number} value the amount to add to each inverted item of the array
 * @return {Array.<number>} the original array, transformed
 */
function negArrayAddValue(y, value) {
	for(var i =0; i < y.length; i++) {
		y[i] = -y[i] + value;
	}
	return y;
};

/**
 * Iterates through an array, adding the given value to each item
 * @param {Array.<number>} y The array to map
 * @param {number} value the amount to add to each each item in the array
 * @return {Array.<number>} the original array, transformed
 */
function addToArray(y, value) {
	for(var i = 0; i < y.length; i++) {
		y[i] = y[i] + value;
	}
	return y;
};

/**
 * Combines numeric arrays together
 * @param {...Array.<number>} any number of arrays to join together
 * @return {Array.<number>} a new array combining all submitted values
 * @nosideeffects
 */
function concatenate(firstvals, y, lastvals) {
 var p = new Array();
 for(var i = 0; i < firstvals.length; i++) {
   p.push(firstvals[i]);
 }
 for(var i = 0; i < y.length; i++) {
   p.push(y[i]); 
 }
 for(var i = 0; i < lastvals.length; i++) {
   p.push(lastvals[i]);
 }
 return p;
};

/**
 * Reverses an array
 * @param {Array.<number>} The array to reverse
 * @return {Array.<number>} a copy of the passed-in array, reversed
 * @nosideeffects
 */
function flipArray(y) {
 var p = new Array();
 for(var i = y.length-1; i > -1; i--) {
   p.push(y[i]); 
 }
 return p;
};

}(window.VowelWorm));
