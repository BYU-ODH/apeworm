/**
 * @struct
 * @namespace
 * @name VowelWorm
 */
window.VowelWorm = window.VowelWorm || {};

var VowelWorm = window.VowelWorm;

/**
 * @param {*} stream The audio stream to analyze OR a string representing the URL for an audio file
 * @constructor
 * //@struct (attaching modules breaks this as a struct; is there a better way?)
 * @final
 * @name VowelWorm.instance
 * @memberof VowelWorm
 */
window.VowelWorm.instance = function (stream) {};
VowelWorm.instance = window.VowelWorm.instance;

/**
 * @return Float32Array
 */
VowelWorm.instance.prototype.getFFT = function(){};

/**
 * @param {Object} options
 * @param {number} options.minFreq The minimum frequency to expect (TODO: create default val)
 * @param {number} options.maxFreq The maximum frequency to expect (TODO: create default val)
 * @param {number} options.filterBanks The number of filter banks to retrieve (TODO: create default val)
 * @param {Array.<number>=} options.fft FFT transformation data. If null, pulls from the analyzer
 * @param {number=} options.sampleRate sampleRate the sample rate of the data.
 * @param {boolean=} [options.toLinearMagnitude=true] Whether or not to convert
 * @return {Array.<number>} The MFFCs. Probably relevant are the second and
 * third values (i.e., a[1] and a[2])
 */
VowelWorm.instance.prototype.getMFCCs = function(options) {};

/**
 * @param {string} name the name of module to add
 * @param {Function} callback - Called if successful.
 * @throws An Error when trying to create a module with a pre-existing
 * property name
 */
VowelWorm.module = function(name, callback) {};

/**
 * @return {number}
 */
VowelWorm.instance.prototype.getFFTSize = function() {};

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

/**
 * @param {Array.<number>} vals The values to change
 * @param {number} window_size the size of the window
 * @return {Array.<number>} the new values 
 */
VowelWorm.hann = function hann(vals, window_size) {};

/**
 * @type number
 * @const
 */
VowelWorm.HANNING_SHIFT = 32;

/**
 * @param {Array.<number>=} data
 * @param {number=} sampleRate
 * @return {Array.<number>}
 */
VowelWorm.instance.prototype.getFormants = function(data, sampleRate) {};
