(function(numeric){
    "use strict";

    /**
     * The default value for min frequency when computing MFCCs.
     * @const
     * @type number
     */
    var DEFAULT_MIN_HZ = 0;

    /**
     * The default value for max frequency when computing MFCCs.
     * @const
     * @type number
     */
    var DEFAULT_MAX_HZ = 8000;

    /**
     * The default number of filter banks to use when computing MFCCs.
     * @const
     * @type numer
     */
    var DEFAULT_FILTER_BANKS = 40;

    /**
     * All window sizes to try when pulling data, in the order they should
     * be tried
     * @see {@link VowelWorm._HANNING_WINDOW}
     * @constant
     * @type Array.<number>
     */
    var WINDOW_SIZES = [
        75,
        61
    ];

    /**
     * @const
     * @type number
     */
    var MIN_DIFF_F1_F2 = 150;
    /**
     * @const
     * @type number
     */
    var MIN_DIFF_F2_F3 = 500;

    /**
     * Specifies that a peak must be this many decibels higher than the closest
     * valleys to be considered a formant
     *
     * TODO ensure accuracy; find official source
     * @constant
     * @type number
     */
    var MIN_PEAK_HEIGHT = 0.1;

    /**
     * @namespace
     * @const
     * @ignore
     */
    var AudioProcessor = {};

    /**
     * @const
     * @type number
     */
    AudioProcessor.F1_MIN = 200;

    /**
     * @const
     * @type number
     */
    AudioProcessor.F1_MAX = 1000;

    /**
     * @const
     * @type number
     */
    AudioProcessor.F2_MIN = 700;

    /**
     * @const
     * @type number
     */
    AudioProcessor.F2_MAX = 3000;

    /**
     * @const
     * @type number
     */
    AudioProcessor.F3_MIN = 1500;

    /**
     * @const
     * @type number
     */
    AudioProcessor.F3_MAX = 5000;

    /**
     * Represent the minimum differences between formants, to ensure they are
     * properly spaced
     *
     * @const
     *
     * TODO ensure accuracy; find official source
     */

    /**
     * The maximum formant expected to be found for a male speaker
     * @see {@link http://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html}
     * @see {@link http://www.sfu.ca/sonic-studio/handbook/Formant.html}
     * @const
     * @type number
     * @memberof AudioProcessor
     */
    AudioProcessor.DEFAULT_MAX_FORMANT_MALE = 5000;
    /**
     * The maximum formant expected to be found for a female speaker
     * @see {@link http://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html}
     * @see {@link http://www.sfu.ca/sonic-studio/handbook/Formant.html}
     * @const
     * @type number
     * @memberof AudioProcessor
     */
    AudioProcessor.DEFAULT_MAX_FORMANT_FEMALE = 5500;
    /**
     * The maximum formant expected to be found for a female speaker
     * @see {@link http://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html}
     * @see {@link http://www.sfu.ca/sonic-studio/handbook/Formant.html}
     * @const
     * @type number
     * @memberof AudioProcessor
     */
    AudioProcessor.DEFAULT_MAX_FORMANT_CHILD = 8000;

    /**
     * The amount the Hanning window needs to be shifted to line up correctly.
     *
     * @TODO This should be proportional to the window size.
     *
     * @see {@link AudioProcessor.hann}
     * @type number
     * @const
     * @memberof AudioProcessor
     */
    AudioProcessor.HANNING_SHIFT = 32;

    /**
     * @namespace
     * @name AudioProcessor
     */
    window.AudioProcessor = AudioProcessor;

    /**
     * Computes the discrete cosine transform of the signal.
     * Scaling is such that inverseDct(dct(values)) = values.
     */
    AudioProcessor.dct = function(values) {
        var result = [];
        for (var i = 0; i < values.length; i++) {
            var val = 0;
            for (var j = 0; j < values.length; j++) {
                val += values[j] * Math.cos(i * (j + 0.5) * Math.PI / values.length);
            }

            // Perform scaling used by matlab implementation of dct
            if (i == 0) {
                val /= Math.sqrt(2.0);
            }
            val *= Math.sqrt(2.0 / values.length);

            result.push(val);
        }

        return result;
    }

    /**
     * Computes the inverse discrete cosine transform of the signal.
     * Scaling is such that inverseDct(dct(values)) = values.
     */
    AudioProcessor.inverseDct = function(values) {
        var result = [];
        for (var i = 0; i < values.length; i++) {
            // Add the dc term
            var val = values[0] / Math.sqrt(2);

            // Add ac terms
            for (var j = 1; j < values.length; j++) {
                val += values[j] * Math.cos(j * (i + 0.5) * Math.PI / values.length);
            }

            // Perform scaling used by matlab implementation of dct
            val *= Math.sqrt(2.0 / values.length);

            result.push(val);
        }

        return result;
    }


    /* 
     * Discrete Fourier transform
     * by Project Nayuki, 2014. Public domain.
     * http://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
     */

    /* 
     * Computes the discrete Fourier transform (DFT) of the given input vector.
     * 'inreal' and 'inimag' are each an array of n floating-point numbers.
     * Returns an array of two arrays - outreal and outimag, each of length n.
     */
    AudioProcessor.computeDft = function (inreal, inimag) {
        var n = inreal.length;
        var outreal = new Array(n);
        var outimag = new Array(n);
        for (var k = 0; k < n; k++) {  // For each output element
            var sumreal = 0;
            var sumimag = 0;
            for (var t = 0; t < n; t++) {  // For each input element
                var angle = 2 * Math.PI * t * k / n;
                sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
                sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
            }
            outreal[k] = sumreal;
            outimag[k] = sumimag;
        }
        return [outreal, outimag];
    };

    /* 
     * Computes the inverse discrete Fourier transform (DFT) of the given input vector.
     * 'inreal' and 'inimag' are each an array of n floating-point numbers.
     * Returns an array of two arrays - outreal and outimag, each of length n.
     */
    AudioProcessor.inverseDft = function (inreal, inimag) {
        var n = inreal.length;
        var outreal = new Array(n);
        var outimag = new Array(n);
        for (var k = 0; k < n; k++) {  // For each output element
            var sumreal = 0;
            var sumimag = 0;
            for (var t = 0; t < n; t++) {  // For each input element
                var angle = 2 * Math.PI * t * k / n;
                sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
                sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
            }
            outreal[k] = sumreal;
            outimag[k] = sumimag;
        }
        return [outreal, outimag];
    };

    /**
     * @license
     *
     * AudioProcessor.getMFCCs derived from Harald Frostel's MATLAB code.
     * See http://www.cp.jku.at/projects/realtime/vowelworm.html.
     */

    /**
     * @typedef mfccsOptions
     * @property {number} minFreq The minimum frequency to expect
     * @property {number} maxFreq The maximum frequency to expect
     * @property {number} filterBanks The number of filter banks to use
     * @property {Array.<number>=} fft The magnitude of the FFT transformation
     * @property {number=} sampleRate sampleRate the sample rate of the data
     * @property {boolean=} [toLinearMagnitude=true] Whether or not to convert
     *   the data to a linear magnitude scale (e.g., if the data being passed in is
     *   in decibels—as is the default data that comes back from {@link VowelWorm.instance#getFFT}).
     *   If this is set to false, the data will be mapped to Math.abs. Since this
     *   calls Math.log on the data, negative values will mess everything up.
     *   Granted, converting these to absolute values might _also_ mess everything
     *   up, but at least it will avoid NaN values. :-)
     */

    /**
     * Retrieves Mel Frequency Cepstrum Coefficients (MFCCs). For best results,
     * pass your values through {@link AudioProcessor.decibelsToLinear} first.
     *
     * @param {{minFreq: number, maxFreq: number, filterBanks: number, fft: Array.<number>, sampleRate: number, toLinearMagnitude: boolean}} options {@link mfccsOptions}
     * @return {Array.<number>} The MFFCs.
     * @memberof AudioProcessor
     */
    AudioProcessor.getMFCCs = function (options) {
        var toLM = options.toLinearMagnitude === undefined ? true : !!options.toLinearMagnitude;

        var fft = options.fft;

        if (toLM) {
            for (var j = 0; j < fft.length; j++) {
                fft[j] = AudioProcessor.decibelsToLinear(fft[j]);
            }
        }
        else {
            // We need to ensure that these are all positive values
            var tmpFFT = [];
            for (var i = 0; i < fft.length; i++) {
                tmpFFT[i] = Math.abs(fft[i]);
            }
            fft = tmpFFT;
        }

        var filterBanks = [],
            numFilterBanks = options.filterBanks || DEFAULT_FILTER_BANKS,
            NFFT = options.fftSize,
            minFreq = options.minFreq || DEFAULT_MIN_HZ,
            maxFreq =  options.maxFreq || DEFAULT_MAX_HZ,
            sampleRate = options.sampleRate;

        // Build the mel scale filter banks
        filterBanks = initFilterBanks(NFFT / 2, numFilterBanks, minFreq, maxFreq, sampleRate);

        // 1. Map the spectrum to the mel scale (apply triangular filters)
        // 2. Take the log of it
        // Performance is better when both of these are done together
        var logMelSpectrum = logMel(fft, filterBanks);

        // Perform the Discrete Cosine Transformation
        var postDCT = AudioProcessor.dct(logMelSpectrum);

        return postDCT;
    };

	/**
     * Initializes the filter banks used in the MFCC computation.
     * @param {number} Nspec Size of the fft array
     * @param {number} noFilterBanks Number of mfccs
     * @param {number} minFreq Minimum frequency
     * @param {number} maxFreq Maximum frequency
     * @param {number} sampleRate Sample rate of the original signal
     */
    var initFilterBanks = function (Nspec, noFilterBanks, minFreq, maxFreq, sampleRate) {
        var filterBanks = [];

        var NFFT = Nspec * 2;
        var totalFilters = noFilterBanks;
        var minMel = freqToMel(minFreq);
        var maxMel = freqToMel(maxFreq);
        var dMel = (maxMel - minMel) / (noFilterBanks + 1);
        var melSpacing = [];
        var fftFreqs2Mel = [];

        var lower = [];
        var center = [];

        // Init melSpacing
        for (var i = 0; i < noFilterBanks + 2; i++) {
            var mel = minMel + i * dMel;
            melSpacing.push(mel);
        }

        // Init fftFreqs2Mel
        for (var i = 0; i < Nspec; i++) {
            var fftFreq = i * sampleRate / NFFT;
            var fftFreq2Mel = freqToMel(fftFreq);
            fftFreqs2Mel.push(fftFreq2Mel);
        }

        // Init lower
        for (var i = 0; i < noFilterBanks; i++) {
            lower.push(melSpacing[i]);
        }

        // Init center
        for (var i = 1; i < noFilterBanks + 1; i++) {
            center.push(melSpacing[i]);
        }

        // Prepare the mel scale filterbank
        for (var i = 0; i < totalFilters; i++) {
            var fBank = [];
            for (var j = 0; j < Nspec; j++) {
                var val = Math.max(0.0, (1 - Math.abs(fftFreqs2Mel[j] - center[i]) / (center[i] - lower[i])));
                fBank.push(val);
            }
            filterBanks.push(fBank);
        }

        return filterBanks;
    };

    /**
     * Converts the frequency to Hz to a mel frequency.
     */
    var freqToMel = function(frequency) {
        return 1127.01048 * Math.log(1.0 + frequency / 700);
    }

    /**
     * Converts the mel frequency to a frequency in Hz.
     */
    var melToFreq = function(mel) {
        return 700 * (Math.exp(mel/1127.01048) - 1);
    }

    /**
     * Maps the spectrum to the mel scale and then takes the log of it.
     */
    var logMel = function(spectrum, filterBanks) {
        var result = [];
        for (var i = 0; i < filterBanks.length; i++) {
            var val = 0.0;
            for (var j = 0; j < filterBanks[i].length; j++) {
                val += (filterBanks[i][j]) * spectrum[j];
            }
            result.push(Math.log10(val));
        }
        return result;
    }

    /**
     * Retrieves formants from the given FFT data.
     * @param {Array.<number>=} data FFT transformation data.
     * @param {number=} sampleRate the sample rate of the data. Required if data is not null
     * @return {Array.<number>} The formants found for the audio stream/file. If
     * nothing worthwhile has been found, returns an empty array.
     * @memberof AudioProcessor
     */
    AudioProcessor.getFormants = function (data, sampleRate) {
        var that = this;

        if (arguments.length !== 2) {
            throw new Error("Invalid arguments. Function must be called as " +
                " getFormants(data, sampleRate)");
        }

        var fftSize = data.length * 2;

        for (var i = 0; i < WINDOW_SIZES.length; i++) {
            var smooth = AudioProcessor.hann(data, WINDOW_SIZES[i])
                .slice(AudioProcessor.HANNING_SHIFT);
            var formants = getPeaks(smooth, sampleRate, fftSize);

            if (formants[0] < AudioProcessor.F1_MIN || formants[0] > AudioProcessor.F1_MAX || formants[0] >= formants[1] ||
                formants[1] < AudioProcessor.F2_MIN || formants[1] > AudioProcessor.F2_MAX || formants[1] >= formants[2] ||
                formants[2] < AudioProcessor.F3_MIN || formants[2] > AudioProcessor.F3_MAX) {
                continue;
            }
            else {
                return formants;
            }
        }
        return [];  // no good formants found
    };

    /**
     * Finds the first three peaks of the curve, representative of the first three formants
     * Use this file only after you have passed your array through a smoothing filter
     * @param {Array.<number>} smoothedArray data, expected to have been smoothed, to extract peaks from
     * @param {number} sampleRate the sample rate of the data
     * @param {number} fftSize the FFT size
     * @return {Array.<number>} the positions of all the peaks found, in Hz
     * @memberof VowelWorm.instance
     * @private
     */
    var getPeaks = function (smoothedArray, sampleRate, fftSize) {
        var peaks = [];
        var previousNum;
        var currentNum;
        var nextNum;

        for (var i = 0; i < smoothedArray.length; i++) {
            var hz = this._toFrequency(i, sampleRate, fftSize);
            var formant = peaks.length + 1;

            switch (formant) {
                case 1:
                    if (hz < AudioProcessor.F1_MIN) {
                        continue;
                    }
                    break;
                case 2:
                    if (hz < AudioProcessor.F2_MIN || hz - peaks[0] < MIN_DIFF_F1_F2) {
                        continue;
                    }
                    break;
                case 3:
                    if (hz < AudioProcessor.F3_MIN || hz - peaks[1] < MIN_DIFF_F2_F3) {
                        continue;
                    }
                    break;
                default:
                    return null;
            }

            previousNum = smoothedArray[i - 1] || 0;
            currentNum = smoothedArray[i] || 0;
            nextNum = smoothedArray[i + 1] || 0;

            if (currentNum > previousNum && currentNum > nextNum) {
                if (peakHeight(i, smoothedArray) >= MIN_PEAK_HEIGHT) {
                    peaks.push(hz);
                    if (formant === 3) {
                        return peaks;
                    }
                }
            }
        }
        return peaks;
    };

    /**
     * Returns the smallest side of a given peak, based on its valleys
     * to the left and to the right. If a peak occurs in index 0 or
     * values.length -1 (i.e., the leftmost or rightmost values of the array),
     * then this just returns the height of the peak from the only available side.
     * @param {number} index The index of the array, where the peak can be found
     * @param {Array.<number>} values The values of the array
     * @return {number} The height of the peak, or 0 if it is not a peak
     * @private
     */
    var peakHeight = function (index, values) {
        var peak = values[index],
            lheight = null,
            rheight = null;

        var prev = null;
        // check the left
        for (var i = index - 1; i >= 0; i--) {
            if (prev !== null && values[i] > prev) {
                break;
            }
            prev = values[i];
            lheight = peak - prev;
        }

        prev = null;
        // check the right
        for (var i = index + 1; i < values.length; i++) {
            if (prev !== null && values[i] > prev) {
                break;
            }
            prev = values[i];
            rheight = peak - prev;
        }

        var result;
        if (lheight === null) {
            result = +rheight;
        }
        else if (rheight === null) {
            result = +lheight;
        }
        else {
            result = lheight < rheight ? lheight : rheight;
        }

        if (result < 0) {
            return 0;
        }
        return result;
    };

    /**
     * Computes the first 5 formants from the mfccs
     */
    AudioProcessor.getFormantsFromMfccs = function(mfccs, cutoff) {
        var formants = [];

        // Low-pass filter the mfccs


        // Inverse the mfcc computation to get the envelope



        return formants;
    }

    /**
     * Computes the first 5 formants from the cepstrum
     */
    AudioProcessor.getFormantsFromCepstrum = function(cepstrum, options) {

        var numFormants = options.numFormants || 3;
        var sampleRate = options.sampleRate || 44100;
        var fftSize = options.fftSize || 1024;
        var cutoff = options.cutoff || Math.round(fftSize / 8);

        var formants = [];

        // Lifter the cepstrum
        for (var i = cutoff; i < cepstrum.length; i++) {
            cepstrum[i] = 0;
        }

        // Inverse dct to get the envelope
        var envelope = AudioProcessor.inverseDct(cepstrum);

        // Find peaks in envelope
        var peakPositions = window.MathUtils.findPeaks(envelope, numFormants);

        for (var i = 0; i < numFormants; i++) {
            var frequency = AudioProcessor.toFrequency(peakPositions[i], sampleRate, fftSize)
            formants.push(frequency);
        }

        return formants;
    }

    /**
     * Computes the cepstrum from the fft data.
     */
    AudioProcessor.getCepstrum = function(fft, options) {

        var toLM = options.toLinearMagnitude === undefined ? true : !!options.toLinearMagnitude;

        if (toLM) {
            for (var j = 0; j < fft.length; j++) {
                fft[j] = AudioProcessor.decibelsToLinear(fft[j]);
            }
        }
        else {
            // we need to ensure that these are all positive values
            var tmpFFT = [];
            for (var i = 0; i < fft.length; i++) {
                tmpFFT[i] = Math.abs(fft[i]);
            }
            fft = tmpFFT;
        }

        // Compute the log of the spectrum
        var logSpectrum = [];
        for (var i = 0; i < fft.length; i++) {
            logSpectrum.push(Math.log(fft[i]));
        }

        // Perform the Discrete Cosine Transformation
        var postDCT = AudioProcessor.dct(logSpectrum);

        return postDCT;
    };

    /**
     * Returns the debical value of the given linear magnitude.
     * {@link http://webaudio.github.io/web-audio-api/#conversion-to-db}
     * @param {number} magnitude the value in magnitude to convert
     * @return {number} the dB value
     *
     * @public
     * @memberof AudioProcessor
     */
    AudioProcessor.linearToDecibel = function(magnitude) {
        return Math.log10(magnitude) / 0.05;
    };

    /**
     * Returns the linear magnitude of the given decibels value.
     * {@link http://webaudio.github.io/web-audio-api/#conversion-to-db}
     * @param {number} dB the value in dB to convert
     * @return {number} the linear magnitude
     *
     * @public
     * @memberof AudioProcessor
     */
    AudioProcessor.decibelsToLinear = function(dB) {
        return Math.pow(10, 0.05 * dB);
    };

    /**
     * @license
     *
     * AudioProcessor.toFrequency method developed with help from kr1 at
     * {@link http://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to}
     */
    /**
     * Gets the frequency at the given index
     * @param {number} position the position of the data to get the frequency of
     * @param {number} sampleRate the sample rate of the data, in Hz
     * @param {number} fftSize the FFT size
     * @return {number} the frequency at the given index
     * @private
     * @memberof AudioProcessor
     */
    AudioProcessor.toFrequency = function(position, sampleRate, fftSize) {
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

        var nyquist = sampleRate / 2;

        var totalBins = fftSize / 2;

        return position * (nyquist / totalBins);
    };

	/***
     * Contains precomputed values for the Hanning function at specific window
     * lengths.
     *
     * From Python's numpy.hanning(x) method.
     *
     * @see {@link WINDOW_SIZES}
     *
     * @constant
     * @type {Object.<number, Array.<number>>}
     * @private
     * @memberof AudioProcessor
     */
    AudioProcessor._HANNING_WINDOW = {
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
     * @license
     *
     * Hanning window code taken from http://wiki.scipy.org/Cookbook/SignalSmooth
     * both constant values and code preparing data for convolution
     *
     */
    /**
     * Applies a hanning window to the given dataset, returning a new array.
     * You  may want to shift the values to get them to line up with the FFT.
     * @example
     *  AudioProcessor.hann([...], 75).shift(AudioProcessor.HANNING_SHIFT);
     * @see {@link AudioProcessor.HANNING_SHIFT}
     * @param {Array.<number>} vals The values to change
     * @param {number} window_size the size of the window
     * @return {Array.<number>} the new values
     * @memberof AudioProcessor
     */
    /**
     * @license
     * Hanning window taken from http://wiki.scipy.org/Cookbook/SignalSmooth
     * both constant values and code preparing data for convolution
     */
    AudioProcessor.hann = function(vals, window_size) {
        if (typeof AudioProcessor._HANNING_WINDOW[window_size] === 'undefined') {
            throw new Error('No precomputed Hanning Window values found for ' +
                window_size);
        }

        var s = [];

        for (var i = window_size - 1; i > 0; i--) {
            s.push(vals[i]);
        }
        for (var i = 0; i < vals.length; i++) {
            s.push(vals[i]);
        }
        for (var i = vals.length - 1; i > vals.length - window_size; i--) {
            s.push(vals[i]);
        }

        var w = AudioProcessor._HANNING_WINDOW[window_size];

        var sum = 0;
        var wMorph = [];
        for (var i = 0; i < w.length; i++) {
            sum += w[i];
        }
        for (var i = 0; i < w.length; i++) {
            wMorph[i] = w[i] / sum;
        }
        return AudioProcessor.convolve(wMorph, s);
    };

    /**
     * Performs a convolution on two arrays
     * TODO: documentation; we pulled this algorithm from StackOverflow—but where?
     * @param {Array.<number>} m
     * @param {Array.<number>} y
     * @return {Array.<number>}
     * @memberof AudioProcessor
     *
     */
    AudioProcessor.convolve = function (m, y) {
        var result = new Array(),
            first = null,
            second = null;

        if (m.length > y.length) {
            first = y;
            second = m;
        }
        else {
            first = m;
            second = y;
        }
        var size = second.length - first.length + 1;
        for (var i = 0; i < size; i++) {
            var newNum = 0,
                len = first.length;

            for (var j = 0; j < first.length; j++) {
                newNum = newNum + first[len - 1 - j] * second[j + i];
            }
            result.push(newNum);
        }
        return result;
    };

    /**
     * @license
     *
     * Savitsky-Golay filter (AudioProcessor.savitzkyGolay)
     * adapted from http://wiki.scipy.org/Cookbook/SavitzkyGolay
     *
     */
    /**
     * Applies the Savitsky-Golay filter to the given array
     * uses numeric javascript
     * Adapted from http://wiki.scipy.org/Cookbook/SavitzkyGolay
     * @param {Array.<number>} y The values to smooth
     * @param {number} window_size The window size.
     * @param {number} order The...? TODO
     * @return {Array.<number>} if plotted gives you a smooth curve version of an parameter array
     * @memberof AudioProcessor
     */
    AudioProcessor.savitzkyGolay = function(y, window_size, order) {
        //probably we don't need to parseInt anything or take the absolute value if we always make sure that our windown size and order are positive.  "golay.py" gave a window size of 55 and said that anything higuer will make a flatter graph
        //window size must be positive and an odd number for this to work better
        var windowSize = Math.abs(parseInt(window_size, 10));
        order = Math.abs(parseInt(order, 10));
        var order_range = order + 1;

        var half_window = (windowSize - 1) / 2;
        var b = new Array();

        for (var k = -half_window; k < half_window + 1; k++) {
            var row = new Array();
            for (var i = 0; i < order_range; i++) {
                row.push(Math.pow(k, i));
            }
            b.push(row);
        }
        //This line needs to be changed if you use something other than 0 for derivative
        var temp = window.MathUtils.pinv(b);
        var m = temp[0];
        //if you take a look at firstvals in the python code, and then at this code you'll see that I've only broken firstvals down into different parts such as first taking a sub array, flipping it, and so on
        var yTemp = new Array();
        yTemp = y.subarray ? y.subarray(1, half_window + 1) : y.slice(1, half_window + 1);
        yTemp = window.MathUtils.flipArray(yTemp);
        yTemp = window.MathUtils.addToArray(yTemp, -y[0]);
        yTemp = window.MathUtils.arrayAbs(yTemp);
        yTemp = window.MathUtils.negArrayAddValue(yTemp, y[0]);
        var firstvals = yTemp;

        //Same thing was done for lastvals
        var yTemp2 = new Array();
        yTemp2 = y.subarray ? y.subarray(-half_window - 1, -1) : y.slice(-half_window - 1, -1);
        yTemp2 = window.MathUtils.flipArray(yTemp2);
        yTemp2 = window.MathUtils.addToArray(yTemp2, -y[y.length - 1]);
        yTemp2 = window.MathUtils.arrayAbs(yTemp2);
        yTemp2 = window.MathUtils.addToArray(yTemp2, y[y.length - 1]);
        var lastvals = yTemp2;

        y = window.MathUtils.concatenate(firstvals, y, lastvals);
        m = window.MathUtils.flipArray(m);
        var result = new Array();
        result = window.AudioProcessor.convolve(m, y);
        return result;
    };

}(window.numeric));