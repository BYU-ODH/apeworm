window.VowelWorm = window.VowelWorm || {};

(function(VowelWorm, numeric){
"use strict";

/**
 * @const
 */
var CONTEXT = new window.AudioContext();

/**
 * A collection of all vowel worm instances. Used for attaching modules.
 * @see {@link VowelWorm.module}
 * @type {Array.<VowelWorm.instance>}
 */
var instances = [];

/**
 * A collection of modules to add to instances, whenever they are created
 * @type {Object.<string, function>}
 */
var modules = {};

/**
 * The sample rate used when one cannot be found.
 */
var DEFAULT_SAMPLE_RATE = 44100;

/**
 * From both Wikipedia (http://en.wikipedia.org/wiki/Formant; retrieved 23 Jun.
 * 2014, 2:52 PM UTC) and Cory Robinson's chart (personal email)
 *
 * These indicate the minimum values in Hz in which we should find our formants
 *
 * @const
 *
 * TODO ensure accuracy; find official source
 */
var F1_MIN = 100,
    F1_MAX = 1000,
    F2_MIN = 600,
    F2_MAX = 3000,
    F3_MIN = 1500,
    F3_MAX = 5000;

/**
 * Represent the minimum differences between formants, to ensure they are
 * properly spaced
 *
 * @const
 *
 * TODO ensure accuracy; find official source
 */
var MIN_DIFF_F1_F2 = 150,
    MIN_DIFF_F2_F3 = 500;

/**
 * Specifies that a peak must be this many decibels higher than the closest
 * valleys to be considered a formant
 *
 * TODO ensure accuracy; find official source
 * @constant
 */
var MIN_PEAK_HEIGHT = 0.1;

/**
 * All window sizes to try when pulling data, in the order they should
 * be tried
 * @see {@link VowelWorm._HANNING_WINDOW}
 * @constant
 */
var WINDOW_SIZES = [
  75,
  61
];


/***
 * Contains precomputed values for the Hanning function at specific window
 * lengths.
 *
 * From Python's numpy.hanning(x) method.
 *
 * @see {@link WINDOW_SIZES}
 *
 * @constant
 */
VowelWorm._HANNING_WINDOW = {
  61: new Float32Array([ 0.        ,  0.00273905,  0.0109262 ,  0.02447174,  0.04322727,
        0.0669873 ,  0.0954915 ,  0.12842759,  0.1654347 ,  0.20610737,
        0.25      ,  0.29663168,  0.3454915 ,  0.39604415,  0.44773577,
        0.5       ,  0.55226423,  0.60395585,  0.6545085 ,  0.70336832,
        0.75      ,  0.79389263,  0.8345653 ,  0.87157241,  0.9045085 ,
        0.9330127 ,  0.95677273,  0.97552826,  0.9890738 ,  0.99726095,
        1.        ,  0.99726095,  0.9890738 ,  0.97552826,  0.95677273,
        0.9330127 ,  0.9045085 ,  0.87157241,  0.8345653 ,  0.79389263,
        0.75      ,  0.70336832,  0.6545085 ,  0.60395585,  0.55226423,
        0.5       ,  0.44773577,  0.39604415,  0.3454915 ,  0.29663168,
        0.25      ,  0.20610737,  0.1654347 ,  0.12842759,  0.0954915 ,
        0.0669873 ,  0.04322727,  0.02447174,  0.0109262 ,  0.00273905,  0.        ]),

  75: new Float32Array([ 0.        ,  0.00180126,  0.00719204,  0.01613353,  0.02856128,
          0.04438575,  0.06349294,  0.08574518,  0.11098212,  0.13902195,
          0.16966264,  0.20268341,  0.23784636,  0.27489813,  0.31357176,
          0.35358861,  0.39466037,  0.43649109,  0.4787794 ,  0.5212206 ,
          0.56350891,  0.60533963,  0.64641139,  0.68642824,  0.72510187,
          0.76215364,  0.79731659,  0.83033736,  0.86097805,  0.88901788,
          0.91425482,  0.93650706,  0.95561425,  0.97143872,  0.98386647,
          0.99280796,  0.99819874,  1.        ,  0.99819874,  0.99280796,
          0.98386647,  0.97143872,  0.95561425,  0.93650706,  0.91425482,
          0.88901788,  0.86097805,  0.83033736,  0.79731659,  0.76215364,
          0.72510187,  0.68642824,  0.64641139,  0.60533963,  0.56350891,
          0.5212206 ,  0.4787794 ,  0.43649109,  0.39466037,  0.35358861,
          0.31357176,  0.27489813,  0.23784636,  0.20268341,  0.16966264,
          0.13902195,  0.11098212,  0.08574518,  0.06349294,  0.04438575,
          0.02856128,  0.01613353,  0.00719204,  0.00180126,  0.        ])
};

/**
 * Contains methods for normalizing Hz values
 * @const
 */
VowelWorm.Normalization = {
  /**
   * Uses the Traunmüller conversion to conver the formant to the Bark Scale
   * @param {number} formant The formant (in Hz) to convert to the Bark Scale
   * @return {number} The formant converted to the Bark Scale
   */
  barkScale: function barkScale(formant) {
    if(formant == 0) {
      formant = 1;
    }
    return 26.81/(1+(1960/formant)) - 0.53;
  }
};

/**
 * Returns the linear magnitude of the given decibels value.
 * @param {number} dB the value in dB to convert
 * @return {number} the linear magnitude
 * 
 * TODO — If we can find a generic representation somewhere of this algorithm,
 * we can remove this license
 */
/**
 * @license
 *
 * decibelsToLinear
 * 
 * Copyright (C) 2010, Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
VowelWorm.decibelsToLinear = function decibelsToLinear(dB) {
  return Math.pow(10, 0.05 * dB);
};

/**
 * Given an array of formants, returns normalized X and Y coordinates
 * representing advancement and height, respectively.
 * @param {Array.<number>} formants The formants to normalize
 * @param {function} [method=VowelWorm.Normalization.barkScale]
 *  the method to use for Normalization. Must be a property of
 *  {@see VowelWorm.Normalization}. Defaults to barkScale
 * 
 * @return {Array.<number>} an array formatted thusly: [x,y]. May be empty
 *
 * TODO: check to see if passing a method in as a param seems sane with everyone else
 */
VowelWorm.normalize = function normalize(formants, method) {
  if(!formants.length) {
    return [];
  }
  if(method === undefined || method === null) {
    method = VowelWorm.Normalization.barkScale;
  }
  if(typeof method !== 'function') {
    throw new Error("Expecting a function as a method for VowelWorm.normalize");
  }
  if(!(method.name in VowelWorm.Normalization)) {
    throw new Error("Method '" + method.name + "' is not part of " +
        "VowelWorm.Normalization and cannot be used for normalization.");
  }

  var x = null;
  var y = null;

  switch(method) {
    case this.Normalization.barkScale:
      x = method(formants[2]) - method(formants[1]);
      y = method(formants[2]) - method(formants[0]);
  };

  if(x === null || y === null) {
    return [];
  }
  return [x,y];
};

/**
 * Applies a hanning window to the given dataset, returning a new array.
 * You  may want to shift the values to get them to line up with the FFT.
 * @example
 *  VowelWorm.hann([...], 75).shift(VowelWorm.HANNING_SHIFT);
 * @see {@link VowelWorm.HANNING_SHIFT}
 * @param {Array.<number>} vals The values to change
 * @param {number} window_size the size of the window
 * @return {Array.<number>} the new values 
 */
/**
 * @license
 * Hanning window taken from http://wiki.scipy.org/Cookbook/SignalSmooth
 * both constant values and code preparing data for convolution
 */
VowelWorm.hann = function hann(vals, window_size) {
  if(typeof VowelWorm._HANNING_WINDOW[window_size] === 'undefined') {
    throw new Error('No precomputed Hanning Window values found for ' +
        window_size);
  }

  var s = [];

  for(var i = window_size-1; i > 0; i--) {
    s.push(vals[i]);
  }
  for(var i = 0; i<vals.length; i++) {
    s.push(vals[i]);
  }
  for(var i = vals.length-1; i>vals.length-window_size; i--) {
    s.push(vals[i]);
  }

  var w = VowelWorm._HANNING_WINDOW[window_size];

  var sum = 0;
  var wMorph = [];
  for(var i = 0; i<w.length; i++) {
    sum += w[i];
  }
  for(var i = 0; i<w.length; i++) {
    wMorph[i] = w[i]/sum;
  }
  return VowelWorm.convolve(wMorph, s);
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
 */
VowelWorm.savitzkyGolay = function savitzkyGolay(y, window_size, order) {
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
 * @param {Array.<number>} m
 * @param {Array.<number>} y
 * @return {Array.<number>}
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

/**
 * Representative of the current mode VowelWorm is in.
 * In this case, an audio element
 * @const
 */
VowelWorm.AUDIO = 1;

/**
 * Representative of the current mode VowelWorm is in.
 * In this case, a video element
 * @const
 */
VowelWorm.VIDEO = 2;

/**
 * Representative of the current mode VowelWorm is in.
 * In this case, a media stream
 * @const
 */
VowelWorm.STREAM = 3;

/**
 * Representative of the current mode VowelWorm is in.
 * In this case, a remote URL turned into a source node
 * @const
 */
VowelWorm.REMOTE_URL = 4;

/*******************
 * HELPER FUNCTIONS
 * Most of these are attached to VowelWorm so they can be easily tested
 *******************/

/**
 * Gets the frequency at the given index
 * @param {number} index the position of the data to get the frequency of
 * @param {number} sampleRate the sample rate of the data, in Hz
 * @param {number} fftSize the FFT size
 * @return {number} the frequency at the given index
 */
/**
 * @license Help from kr1 at http://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to 
 */
VowelWorm._toFrequency = function toFrequency(position, sampleRate, fftSize) {
  /**
   * I am dividing by two because both Praat and WaveSurfer correlate the
   * final FFT bin with the Hz value of only half of the sample rate.
   *
   * This halving creates what is called the Nyquist Frequency (see
   * http://www.fon.hum.uva.nl/praat/manual/Nyquist_frequency.html and
   * http://en.wikipedia.org/wiki/Nyquist_frequency).
   *
   * For example, an FFT of size 2048 will have 1024 bins. With a sample rate
   * of 16000 (16kHz), the final position, 1023 (the 1024th bin) should return
   * 8000 (8kHz). Position 511 (512th bin) should return 4000 (4kHz), and so
   * on.
   *
   * Kudos to Derrick Craven for discovering that we needed to divide this.
   */
  var nyquist = sampleRate/2;

  var totalBins = fftSize/2;

  return position*(nyquist/totalBins);
};

/**
 * Returns the smallest side of a given peak, based on its valleys
 * to the left and to the right. If a peak occurs in index 0 or
 * values.length -1 (i.e., the leftmost or rightmost values of the array),
 * then this just returns the height of the peak from the only available side.
 * @param {number} index The index of the array, where the peak can be found
 * @param {Array.<number>} values The values of the array
 * @return {number} The height of the peak, or 0 if it is not a peak
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
 * Requires NumericJS to be loaded
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
  var that = this;

  this._context    = CONTEXT;
  this._analyzer   = this._context.createAnalyser();
  this._sourceNode = null; // for analysis with files rather than mic input
  this._analyzer.fftSize = 2048;
  this._buffer = new Float32Array(this._analyzer.fftSize/2);
  this._audioBuffer = null; // comes from downloading an audio file

  if(stream) {
    this.setStream(stream);
  }
  
  Object.keys(modules).forEach(function(name) {
    attachModuleToInstance(name, that);
  });
  instances.push(this);
};

/**
 * The amount the Hanning window needs to be shifted to line up correctly.
 * TODO This should be proportional to the window size.
 *
 * @see {@link VowelWorm.hann}
 * @type number
 * @const number
 */
VowelWorm.HANNING_SHIFT = 32;


/**
 * The maximum formant expected to be found for a male speaker
 * @see {@link http://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html}
 * @see {@link http://www.sfu.ca/sonic-studio/handbook/Formant.html}
 * @const
 * @type number
 */
VowelWorm.DEFAULT_MAX_FORMANT_MALE = 5000;
/**
 * The maximum formant expected to be found for a female speaker
 * @see {@link http://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html}
 * @see {@link http://www.sfu.ca/sonic-studio/handbook/Formant.html}
 * @const
 * @type number
 */
VowelWorm.DEFAULT_MAX_FORMANT_FEMALE = 5500;
/**
 * The maximum formant expected to be found for a female speaker
 * @see {@link http://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html}
 * @see {@link http://www.sfu.ca/sonic-studio/handbook/Formant.html}
 * @const
 * @type number
 */
VowelWorm.DEFAULT_MAX_FORMANT_CHILD = 8000;

VowelWorm.instance.prototype = Object.create(VowelWorm);
VowelWorm.instance.constructor = VowelWorm.instance;

var proto = VowelWorm.instance.prototype;

/**
 * Attaches a module to the given instance, with the given name
 * @param {string} name The name of the module to attach. Should be present in
 * {@link modules} to work
 * @param {VowelWorm.instance} instance The instance to affix a module to
 */
function attachModuleToInstance(name, instance) {
  instance[name] = {};
  modules[name].call(instance[name], instance);
};

/**
 * Adds a module to instances of {@link VowelWorm.instance}, as called by
 * `new VowelWorm.instance(...);`
 * @param {string} name the name of module to add
 * @param {VowelWorm~createModule} callback - Called if successful.
 * `this` references the module, so you can add properties to it. The
 * instance itself is passed as the only argument, for easy access to core
 * functions.
 * @throws An Error when trying to create a module with a pre-existing
 * property name
 *
 * @see {@link attachModuleToInstance}
 * @see {@link modules}
 * @see {@link instances}
 */
VowelWorm.module = function(name, callback) {
  if(proto[name] !== undefined || modules[name] !== undefined) {
    throw new Error("Cannot define a VowelWorm module with the name \"" +name+
        "\": a property with that name already exists. May I suggest \"" +name+
        "_kewl_sk8brdr_98\" instead?");
  }
  if(typeof callback !== 'function') {
    throw new Error("No callback function submitted.");
  }
  modules[name] = callback;
  instances.forEach(function(instance) {
    attachModuleToInstance(name, instance);
  });
};

/**
 * Removes a module from all current and future VowelWorm instances. Used
 * primarily for testing purposes.
 * @param {string} name - The name of the module to remove
 */
VowelWorm.removeModule = function(name) {
  if(modules[name] === undefined) {
    return;
  }
  delete modules[name];
  instances.forEach(function(instance) {
    delete instance[name];
  });
};
/**
 * Callback used by {@link VowelWorm.module}
 * @callback VowelWorm~createModule
 * @param {VowelWorm.instance.prototype} prototype
 */

/**
 * The current mode the vowel worm is in (e.g., stream, audio element, etc.)
 * @type {?number}
 *
 * @see VowelWorm.AUDIO
 * @see VowelWorm.VIDEO
 * @see VowelWorm.STREAM
 * @see VowelWorm.REMOTE_URL
 */
proto.mode = null;

/**
 * @license setStream helper functions borrow heavily from Chris Wilson's pitch
 * detector, under the MIT license. See https://github.com/cwilso/pitchdetect
 */
/**
 * @param {MediaStream|string|Audio} stream The audio stream to analyze OR a string representing the URL for an audio file OR an Audio file
 * @throws An error if stream is neither a Mediastream or a string
 */
proto.setStream = function setStream(stream) {
  if(typeof stream === 'string') {
    this._loadFromURL(stream);
  }
  else if(typeof stream === 'object' && stream['constructor']['name'] === 'MediaStream')
  {
    this._loadFromStream(stream);
  }
  else if(stream && (stream instanceof window.Audio || stream.tagName === 'AUDIO'))
  {
    this._loadFromAudio(stream);
  }
  else if(stream && stream.tagName === 'VIDEO')
  {
    this._loadFromVideo(stream);
  }
  else
  {
    throw new Error("VowelWorm.instance.setStream only accepts URL strings, "+
                     "instances of MediaStream (as from getUserMedia), or " +
                     "<audio> elements");
  }
};

proto._loadFromStream = function loadFromStream(stream) {
  this.mode = this.STREAM;
  var streamSource = this._context.createMediaStreamSource(stream);
  streamSource.connect(this._analyzer);
};

/**
 * Finds the first three peaks of the curve, representative of the first three formants
 * Use this file only after you have passed your array through a smoothing filter
 * @param {Array.<number>} smoothedArray data, expected to have been smoothed, to extract peaks from
 * @param {number} sampleRate the sample rate of the data
 * @param {number} fftSize the FFT size
 * @return {Array.<number>} the positions of all the peaks found, in Hz
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
 * The sample rate of the attached audio source
 *
 * @type number
 * @instance
 * @memberof VowelWorm.instance
 */
proto.getSampleRate = function getSampleRate() {
  switch(this.mode) {
    case this.REMOTE_URL:
      return this._sourceNode.buffer.sampleRate;
      break;
    case this.AUDIO:
    case this.VIDEO:
      return DEFAULT_SAMPLE_RATE; // this cannot be retrieved from the element
      break;
    case this.STREAM:
      return this._context.sampleRate;
      break;
    default:
      throw new Error("Current mode has no method for sample rate");
  };
};

/**
 * The size of the FFT, in bins
 * @instance
 * @memberof VowelWorm.instance
 */
proto.getFFTSize = function getFFTSize() {
  return this._analyzer.fftSize;
};

/**
 * @license MFCC code Derived from https://github.com/Maxwell79/mfccExtractor
 * under Version 2 (1991) of the GNU General Public License
 */

/**
 * Retrieves Mel Frequency Cepstrum Coefficients (MFCCs). For best results,
 * if using preexisting webaudio FFT data (from getFloatFrequencyData), pass
 * your values through {@link VowelWorm.decibelsToLinear} first. If you do not
 * pass in specific FFT data, the default data will be converted to a linear 
 * magnitude scale anyway.
 *
 * Pass in an object with options as such:
 *
 * {
 *   minFreq: {number} The minimum frequency to expect (TODO: create default val)
 *   maxFreq: {number} The maximum frequency to expect (TODO: create default val)
 *   filterBanks: {number} The number of filter banks to retrieve (TODO: create default val)
 *   fft: {Array.<number>=} - FFT transformation data. If null, pulls from the analyzer
 *   sampleRate: {number=} sampleRate the sample rate of the data. Required if data is not null
 * }
 *
 * @param {Object} options
 * 
 * @return {Array.<number>} The MFFCs. Probably relevant are the second and
 * third values (i.e., a[1] and a[2])
 */
proto.getMFCCs = function(options) {
  var fft = null;

  if(!options.fft) {
    fft = this._buffer;
    this._analyzer.getFloatFrequencyData(fft);
    for(var j = 0; j<fft.length; j++) {
      fft[j] = VowelWorm.decibelsToLinear(fft[j]);
    }
  }
  else
  {
    // we need to ensure that these are all positive values
    var tmpFFT = [];
    for(var i = 0; i<options.fft.length; i++) {
      tmpFFT[i] = Math.abs(options.fft[i]);
    }
    fft = tmpFFT;
  }

  var filterBanks = [],
      noFilterBanks = options.filterBanks,
      NFFT = fft.length*2,
      minFreq = options.minFreq,
      maxFreq = options.maxFreq,
      sampleRate = options.sampleRate || this.getSampleRate();

  // initialize filter banks
  var maxMel = 1125 * Math.log(1.0 + maxFreq/700);
  var minMel = 1125 * Math.log(1.0 + minFreq/700);
  var dMel = (maxMel - minMel) / (noFilterBanks+1);

  var bins = [];
  for (var n = 0; n < noFilterBanks + 2; n++) {
    var mel = minMel + n * dMel;
    var Hz = 700  * (Math.exp(mel / 1125) - 1);
    var bin = Math.floor( (NFFT)*Hz / sampleRate);
    bins.push(bin);
  }

  for(var i = 1; i<bins.length-1; i++) {
    var fBank = [];

    var fBelow = VowelWorm._toFrequency(bins[i-1], sampleRate, NFFT);
    var fCentre = VowelWorm._toFrequency(bins[i], sampleRate, NFFT);
    var fAbove = VowelWorm._toFrequency(bins[i+1], sampleRate, NFFT);

    for(var n = 0; n < 1 + NFFT / 2; n++) {
      var freq = VowelWorm._toFrequency(n, sampleRate, NFFT);
      var val = null;

      if ((freq <= fCentre) && (freq >= fBelow)) {
        val = ((freq - fBelow) / (fCentre - fBelow));
      } else if ((freq > fCentre) && (freq <= fAbove)) {
        val = ((fAbove - freq) / (fAbove - fCentre));
      } else {
        val = 0.0;
      }
      fBank.push(val);
    }

    filterBanks.push(fBank);
  }
  // end initialize filterBanks

  // get log coefficients
  var preDCT = []; // Initialise pre-discrete cosine transformation vetor array
  var postDCT = [];// Initialise post-discrete cosine transformation vetor array / MFCC Coefficents

  for(var i = 0; i<filterBanks.length; i++) {
    var cel = 0;
    var n = 0;
    for(var j = 0; j < filterBanks[i].length-1; j++) {
      cel += (filterBanks[i][j]) * fft[n++];
    }
    preDCT.push(Math.log(cel)); // Compute the log of the spectrum
  }

  // Perform the Discrete Cosine Transformation
  for (var i = 0; i < filterBanks.length; i++) {
    var val = 0;
    var n = 0;
    for (var j = 0; j<preDCT.length; j++) {
      val += (preDCT[j]) * Math.cos(i * (n++ - 0.5) *  Math.PI / filterBanks.length);
    }
    val /= filterBanks.length;
    postDCT.push(val);
  }
  return postDCT;
};

/**
 * Retrieves formants. Uses the current time of the audio file or stream,
 * unless data is passed in.
 * @param {Array.<number>=} data FFT transformation data. If null, pulls from the analyzer
 * @param {number=} sampleRate the sample rate of the data. Required if data is not null
 * @return {Array.<number>} The formants found for the audio stream/file. If
 * nothing worthwhile has been found, returns an empty array.
 */
proto.getFormants = function getFormants(data, sampleRate) {
  var that = this;

  if(arguments.length !== 2 && arguments.length !== 0) {
    throw new Error("Invalid arguments. Function must be called either as "+
                    " getFormants(data, sampleRate) or getFormants()");
  }
  var fftSize = null;

  if(data) {
    fftSize = data.length*2;
  }
  else
  {
    data = this._buffer;
    fftSize = this.getFFTSize();
    this._analyzer.getFloatFrequencyData(data);
    sampleRate = this.getSampleRate();
  }

  for(var i = 0; i<WINDOW_SIZES.length; i++) {
    var smooth = this.hann(data, WINDOW_SIZES[i]).slice(this.HANNING_SHIFT);
    var formants = this._getPeaks(smooth, sampleRate, fftSize);

    if( formants[0]<F1_MIN || formants[0]>F1_MAX || formants[0]>=formants[1] ||
        formants[1]<F2_MIN || formants[1]>F2_MAX || formants[1]>=formants[2] ||
        formants[2]<F3_MIN || formants[2]>F3_MAX )
    {
      continue;
    }
    else
    {
      return formants;
    }
  }
  return [];  // no good formants found
};

/**
 * Removes reference to this particular worm instance as well as
 * all properties of it.
 */
proto.destroy = function() {
  var index = instances.indexOf(this);
  if(index !== -1) {
    instances.splice(index, 1);
  }
  for(var i in this) {
    if(this.hasOwnProperty(i)) {
      delete this[i];
    }
  }
};

/**
 * @param {string} url Where to fetch the audio data from
 * @throws An error when the server returns an error status code
 * @throws An error when the audio file cannot be decoded
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
    that.mode = this.REMOTE_URL;
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
 * Loads an audio element as the data to be processed
 * @param {Audio} audio
 */
proto._loadFromAudio = function loadFromAudio(audio) {
  console.warn( "Cannot determine sample rate. Setting as " + DEFAULT_SAMPLE_RATE );

  this.mode = this.AUDIO;
  this._sourceNode = this._context.createMediaElementSource(audio);
  this._sourceNode.connect(this._analyzer);
  this._analyzer.connect(this._context.destination);
};

/**
 * Loads a video element as the data to be processed
 * @param {Video} audio
 */
proto._loadFromVideo = function loadFromVideo(video) {
  console.warn( "Cannot determine sample rate. Setting as " + DEFAULT_SAMPLE_RATE );

  this.mode = this.VIDEO;
  this._sourceNode = this._context.createMediaElementSource(video);
  this._sourceNode.connect(this._analyzer);
  this._analyzer.connect(this._context.destination);
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
