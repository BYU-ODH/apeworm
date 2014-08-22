/**
 * @struct
 * @namespace
 * @name VowelWorm
 */
window.VowelWorm = window.VowelWorm || {};

var VowelWorm = window.VowelWorm;

/**
 * Contains methods used in the analysis of vowel audio data
 * @param {*} stream The audio stream to analyze OR a string representing the URL for an audio file
 * @constructor
 * @struct
 * @final
 * @name VowelWorm.instance
 */
VowelWorm.instance = function (stream) {};

/**
 * Retrieves the current FFT data of the audio source. NOTE: this returns a
 * reference to the internal buffer used to store this information. It WILL
 * change. If you need to store it, iterate through it and make a copy.
 *
 * The reason this doesn't return a new Float32Array is because Google Chrome
 * (as of v. 36) does not adequately garbage collect new Float32Arrays. Best
 * to keep them to a minimum.
 *
 * @return Float32Array
 * @example
 *  var w = new VowelWorm.instance(audioelement),
 *      fft = w.getFFT();
 *
 *  // store a copy for later
 *  var saved_data = [];
 *  for(var i = 0; i<fft.length; i++) {
 *    saved_data[i] = fft[i];
 *  } 
 */
VowelWorm.instance.prototype.getFFT = function(){};

/**
 * @license
 *
 * VowelWorm.instance.prototype.getMFCCs derived from David Ireland's code at
 * https://github.com/Maxwell79/mfccExtractor under Version 2 (1991) of the GNU
 * General Public License.
 *
 */

/**
 * Retrieves Mel Frequency Cepstrum Coefficients (MFCCs). For best results,
 * if using preexisting webaudio FFT data (from getFloatFrequencyData), pass
 * your values through {@link VowelWorm.decibelsToLinear} first. If you do not
 * pass in specific FFT data, the default data will be converted to a linear 
 * magnitude scale anyway.
 *
 * @param {Object} options
 * @param {number} options.minFreq The minimum frequency to expect (TODO: create default val)
 * @param {number} options.maxFreq The maximum frequency to expect (TODO: create default val)
 * @param {number} options.filterBanks The number of filter banks to retrieve (TODO: create default val)
 * @param {Array.<number>=} options.fft FFT transformation data. If null, pulls from the analyzer
 * @param {number=} options.sampleRate sampleRate the sample rate of the data. Required if data is not null
 * @param {boolean=} [options.toLinearMagnitude=true] Whether or not to convert
 *   the data to a linear magnitude scale (e.g., if the data being passed in is
 *   in decibels—as is the default data that comes back from {@link VowelWorm.instance#getFFT}).
 *   If this is set to false, the data will be mapped to Math.abs. Since this
 *   calls Math.log on the data, negative values will mess everything up.
 *   Granted, converting these to absolute values might _also_ mess everything
 *   up, but at least it will avoid NaN values. :-)
 * 
 * @return {Array.<number>} The MFFCs. Probably relevant are the second and
 * third values (i.e., a[1] and a[2])
 */
VowelWorm.instance.prototype.getMFCCs = function(options) {};

/**
 * Adds a module to instances of {@link VowelWorm.instance}, as called by
 * `new VowelWorm.instance(...);`
 * @param {string} name the name of module to add
 * @param {Function} callback - Called if successful.
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
VowelWorm.module = function(name, callback) {};

/**
 * The size of the FFT, in bins
 * @return {number}
 */
VowelWorm.instance.prototype.getFFTSize = function() {};

/**
 * @license
 * 
 * VowelWorm._toFrequency method developed with help from kr1 at
 * {@link http://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to}
 */
/**
 * Gets the frequency at the given index
 * @param {number} position the position of the data to get the frequency of
 * @param {number} sampleRate the sample rate of the data, in Hz
 * @param {number} fftSize the FFT size
 * @return {number} the frequency at the given index
 * @private
 */
VowelWorm._toFrequency = function toFrequency(position, sampleRate, fftSize) {};

/**
 * The sample rate of the attached audio source
 * @return {number}
 */
VowelWorm.instance.prototype.getSampleRate = function() {};