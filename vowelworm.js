// TODO: change x.getFormants() to x.formants ?

window.VowelWorm = window.VowelWorm || {};

(function(VowelWorm, numeric){
"use strict";

/**
 * From both Wikipedia (http://en.wikipedia.org/wiki/Formant; retrieved 23 Jun.
 * 2014, 2:52 PM UTC) and Cory Robinson's chart (personal email)
 *
 * These indicate the minimum values in Hz in which we should find our formants
 *
 * TODO ensure accuracy; find official source
 */
var F1_MIN = 100,
    F2_MIN = 730,
    F3_MIN = 1700;

/**
 * Represent the minimum differences between formants, to ensure they are
 * properly spaced
 *
 * TODO ensure accuracy; find official source
 */
var MIN_DIFF_F1_F2 = 150,
    MIN_DIFF_F2_F3 = 400;

/**
 * Specifies that a peak must be this many decibels higher than the closest
 * valleys to be considered a formant
 *
 * TODO ensure accuracy; find official source
 */
var MIN_PEAK_HEIGHT = 0.1;

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
 * @license Savitsky-Golay filter (VowelWorm.smoothCurve)
 * adapted from http://wiki.scipy.org/Cookbook/SavitzkyGolay
 */
/**
 * Applies the Savitsky-Golay filter to the given array
 * uses numeric javascript
 * Adapted from http://wiki.scipy.org/Cookbook/SavitzkyGolay
 * @param {Array.<number>} y The values to smooth
 * @param {number} window_size The window size.
 * @param {number} order The...? TODO
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
	var temp = pinv(b);
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
 * Most of these are attached to VowelWorm so they can be easily tested
 *******************/

/**
 * Gets the frequency at the given index
 * @param {number} index the position of the data to get the frequency of
 * @param {number} sampleRate the sample rate of the data
 * @param {number} fftSize the FFT size
 * @return {number} the frequency at the given index
 * @nosideeffects
 */
/**
 * @license Help from kr1 at http://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to 
 */
VowelWorm._toFrequency = function toFrequency(position, sampleRate, fftSize) {
  return position*(sampleRate/fftSize);
};

/**
 * Returns the smallest side of a given peak, based on its valleys
 * to the left and to the right. If a peak occurs in index 0 or
 * values.length -1 (i.e., the leftmost or rightmost values of the array),
 * then this just returns the height of the peak from the only available side.
 * @param {number} index The index of the array, where the peak can be found
 * @param {Array.<number>} values The values of the array
 * @return {number} The height of the peak, or 0 if it is not a peak
 * @nosideeffects
 */
VowelWorm._peakHeight = function peakHeight(index, values) {
  var peak = values[index],
      lheight = null,
      rheight = null;

  var prev = null;
  // check the left
  for(var i = index-1; i >= 0; i--) {
    if(prev !== null && values[i] > prev) {
      break;
    }
    prev = values[i];
    lheight = peak - prev;
  }

  prev = null;
  // check the right
  for(var i = index+1; i < values.length; i++) {
    if(prev !== null && values[i] > prev) {
      break;
    }
    prev = values[i];
    rheight = peak - prev;
  }

  var result;
  if(lheight === null) {
    result = +rheight;
  }
  else if(rheight === null) {
    result = +lheight;
  }
  else
  {
    result = lheight < rheight ? lheight : rheight;
  }

  if(result < 0) {
    return 0;
  }
  return result;
};

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

/**
 * @license Psuedo-inverse function from http://www.numericjs.com/workshop.php?link=aacea378e9958c51af91f9eadd5bc7446e0c4616fc7161b384e5ca6d4ec036c7
 */
/**
 * Finds the pseudo-inverse of the given array
 * @param {Array.<number>} A The array to apply the psuedo-inverse to
 * @return {Array.<number>} The psuedo-inverse applied to the array
 */
function pinv(A) {
  var z = numeric.svd(A), foo = z.S[0];
  var U = z.U, S = z.S, V = z.V;
  var m = A.length, n = A[0].length, tol = Math.max(m,n)*numeric.epsilon*foo,M = S.length;
  var i,Sinv = new Array(M);
  for(i=M-1;i!==-1;i--) { if(S[i]>tol) Sinv[i] = 1/S[i]; else Sinv[i] = 0; }
  return numeric.dot(numeric.dot(V,numeric.diag(Sinv)),numeric.transpose(U))
};

/**
 * Contains methods used in the analysis of vowel audio data
 * @param {MediaStream=|string=} stream The audio stream to analyze OR a string representing the URL for an audio file
 * @constructor
 * @struct
 * @final
 */
VowelWorm.instance = function VowelWorm(stream) {
  /**
   * @license Borrows heavily from Chris Wilson's pitch detector, under the MIT
   * license. See https://github.com/cwilso/pitchdetect
   */
  this._context    = new AudioContext();
  this._analyzer   = this._context.createAnalyser();
  this._sourceNode = null; // for analysis with files rather than mic input
  this._analyzer.fftSize = 2048;
  this._buffer = new Uint8Array(this._analyzer.fftSize);
  this._audioBuffer = null; // comes from downloading an audio file

  this.windowSize = 55; // used in the Savitsky-Golay filter
  this.order = 0; // also used in the Savitsky-Golay filter

  var that  = this;

  if(stream) {
    that.setStream(stream);
  }

};

VowelWorm.instance.prototype = Object.create(VowelWorm);
VowelWorm.instance.constructor = VowelWorm.instance;

var proto = VowelWorm.instance.prototype;

/**
 * @param {MediaStream|string} stream The audio stream to analyze OR a string representing the URL for an audio file
 * @throws An error if stream is neither a Mediastream or a string
 * @return {Promise} resolved when the stream has been loaded
 */
proto.setStream = function setStream(stream) {
  var that = this;
  return new Promise(function(resolve, reject) {

    if(typeof stream === 'string') {
      that._loadFromURL(stream).then(resolve);
    }
    else if(typeof stream === 'object' && stream['constructor']['name'] === 'MediaStream')
    {
      that._loadFromStream(stream);
      resolve();
    }
    else
    {
      throw new Error("VowelWorm.instance.setStream only accepts URL strings "+
                       "and instances of MediaStream (as from getUserMedia)");
    }
  });
};

/**
 * Finds the first three peaks of the curve, representative of the first three formants
 * Use this file only after you have passed your array through the smoothCurve function twice
 * @param {Array.<number>} smoothedArray data, expected to have been smoothed, to extract peaks from
 * @param {number} sampleRate the sample rate of the data
 * @param {number} fftSize the FFT size
 * @return {Array.<number>} the positions of all the peaks found, in Hz
 * @nosideeffects
 */
proto._getPeaks = function getPeaks(smoothedArray, sampleRate, fftSize) {
	var peaks = new Array();
	var previousNum;
	var currentNum;
	var nextNum;

	for(var i = 0; i < smoothedArray.length; i++) {
    var hz = this._toFrequency(i, sampleRate, fftSize);
    var formant = peaks.length+1;

    switch(formant) {
      case 1:
        if(hz < F1_MIN) { continue; }
        break;
      case 2:
        if(hz < F2_MIN || hz - peaks[0] < MIN_DIFF_F1_F2) { continue; }
        break;
      case 3:
        if(hz < F3_MIN || hz - peaks[1] < MIN_DIFF_F2_F3) { continue; }
        break;
      default:
        return;
    }

    previousNum = smoothedArray[i-1] || 0;
    currentNum = smoothedArray[i] || 0;
    nextNum = smoothedArray[i+1] || 0;
		
    if(currentNum > previousNum && currentNum > nextNum) {
      if(this._peakHeight(i, smoothedArray) >= MIN_PEAK_HEIGHT) {
        peaks.push(hz);
        if(formant === 3) {
          return peaks;
        }
      }
    }
	}
	return peaks;
};

/**
 * Retrieves formants. Uses the current time of the audio file or stream,
 * unless data is passed in.
 * @param {Array.<number>=} data FFT transformation data. If null, pulls from the analyzer
 * @param {number=} sampleRate the sample rate of the data. Required if data is not null
 * @return {Array.<number>} The formants found for the audio stream/file
 * @nosideeffects
 */
proto.getFormants = function getFormants(data, sampleRate) {
  this._analyzer.getByteFrequencyData(this._buffer);

  if(arguments.length !== 2 && arguments.length !== 0) {
    throw new Error("Invalid arguments. Function must be called either as "+
                    " getFormants(data, sampleRate) or getFormants()");
  }

  var fftSize = data ? data.length*2 : this._analyzer.fftSize;
  var data = data || this._buffer;

  if(!sampleRate) {
    if(this._sourceNode) {
      sampleRate = this._sourceNode.buffer.sampleRate;
    }
    else
    {
      // TODO
      throw new Error("Not implemented yet.");
    }
  }

  // smooth it twice
  var first = this.smoothCurve(data, this.windowSize, this.order);
  var second = this.smoothCurve(first, this.windowSize, this.order);
  
  return this._getPeaks(second, sampleRate, fftSize);
};

Object.defineProperties(proto, {
  duration: {
    /**
     * Retrieves the duration of the audio file, if present
     * @return {number|null} The duration. If no audio file present, then null
     */
    get: function() {
      if(!this._sourceNode) {
        return null;
      }
      return this._sourceNode.buffer.duration;
    }
  }
});

/**
 * @param {string} url Where to fetch the audio data from
 * @throws An error when the server returns an error status code
 * @throws An error when the audio file cannot be decoded
 * @return {Promise} resolved when everything has loaded
 */
proto._loadFromURL = function loadFromURL(url) {
  var that = this,
      request = new XMLHttpRequest();

  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onerror = function error() {
    throw new Error("Tried to load audio file at '" + url + "', but a " +
                     "netowrk error occurred: " + request.statusText);
  };
  
  function decodeSuccess(buffer) {
    that._audioBuffer = buffer;
    that._resetSourceNode();
    // TODO - enable playback through speakers, looping, etc.
  };

  function decodeError() {
    throw new Error("Could not parse audio data. Make sure the file " +
                     "(" + url + ") you are passing to " +
                     "setStream or VowelWorm.instance is a valid audio " +
                     "file.");
  };

  request.onload = function() {
    if(request.status !== 200) {
      throw new Error("Tried to load audio file at '" + url + "', but the " +
                       "server returned " + request.status + " " +
                       request.statusText + ". Make sure the URL you are " +
                       "passing to setStream or VowelWorm.instance is " +
                       "correct");
    }
    that._context.decodeAudioData(this.response, decodeSuccess, decodeError);
  };

  request.send();
};

/**
 * Creates (or resets) a source node, as long as an available audioBuffer
 * exists
 */
proto._resetSourceNode = function resetSourceNode() {
    this._sourceNode = this._context.createBufferSource();
    this._sourceNode.buffer = this._audioBuffer;
    this._sourceNode.connect(this._analyzer);
};

}(window.VowelWorm, window.numeric));
