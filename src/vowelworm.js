(function(numeric){
    "use strict";

    /**
     * @namespace
     * @const
     * @ignore
     */
    var VowelWorm = {};

    /**
     * @namespace
     * @name VowelWorm
     */
    window.VowelWorm = VowelWorm;

    /**
     * @const
     */
    var CONTEXT = new window.AudioContext();

    /**
     * A collection of all vowel worm instances. Used for attaching modules.
     * @see {@link VowelWorm.module}
     * @type {Array.<window.VowelWorm.instance>}
     */
    var instances = [];

    /**
     * A collection of modules to add to instances, whenever they are created
     * @type {Object.<string, Function>}
     */
    var modules = {};

    /**
     * The sample rate used when one cannot be found.
     */
    var DEFAULT_SAMPLE_RATE = 44100;

    /**
<<<<<<< HEAD
     * The window size to use for each analysis frame
=======
     * From both Wikipedia (http://en.wikipedia.org/wiki/Formant; retrieved 23 Jun.
     * 2014, 2:52 PM UTC) and Cory Robinson's chart (personal email)
     *
     * These indicate the minimum values in Hz in which we should find our formants
     * 
     * TODO get better documentation (wikipedia's not the most reliable of sources, and I don't know if anyone who's still here has access to the email with Cory Robinson's chart.)
     */

    /**
     * @const
     * @type number
     */
    var F1_MIN = 100;
    /**
>>>>>>> ae5b061f1d0660bdb59dd980c7dd801ac5f31fb2
     * @const
     * @type number
     */
    var WINDOW_SIZE = 0.046;

    /**
     * The number of filter banks to use when computing MFCCs.
     * @const
     * @type number
     */
    var NUM_FILTER_BANKS = 40;

    /**
     * The first MFCC to use in the mapping algorithms.
     * @const
     * @type number
     */
    var FIRST_MFCC = 2;

    /**
     * The last MFCC to use in the mapping algorithms.
     * @const
     * @type number
     */
    var LAST_MFCC = 25;

    /**
<<<<<<< HEAD
     * The minimum backness value. Used for transforming between formants to backness.
=======
     * Represent the minimum differences between formants, to ensure they are
     * properly spaced
     *
     * 
     * I'm not sure if this is possible. Sometimes the formants, especially the
     * second and third formants, merge together for a little bit. (TODO Find source.)
     * 
     * If it's possible/reasonable, we might want to look at the beginning and end of
     * the vowelss to see if it's one or two formants.
     *
>>>>>>> ae5b061f1d0660bdb59dd980c7dd801ac5f31fb2
     * @const
     * @type number
     */
    var BACKNESS_MIN = 0;

    /**
     * The maximum backness value. Used for transforming between formants and backness.
     * @const
     * @type number
     */
    var BACKNESS_MAX = 4;

    /**
     * The minimum height value. Used for transforming between formants and height.
     * @const
     * @type number
     */
    var HEIGHT_MIN = 0;

    /**
     * The maximum height value. Used for transforming between formants and height.
     * @const
     * @type number
     */
    var HEIGHT_MAX = 3;

    /**
     * Transposed MFCC weight matrices for prediction.
     * Numeric keys represent the number of filter MFFCs used as regressors (features).
     * These are transposed from the matrices given in the VowelWorm MATLAB code
     * @constant
     */
    /**
     * @license
     * VowelWorm concept and VowelWorm._MFCC_WEIGHTS from Harald Frostel, Andreas
     * Arzt, and Gerhard Widmer at the Department of Computational Perception
     * Johannes Kepler University, Linz, Austria.
     * http://www.cp.jku.at/projects/realtime/vowelworm.html
     *
     */
    VowelWorm._MFCC_WEIGHTS = {
        25: {
            height: new Float32Array([
                1.104270, 0.120389, 0.271996, 0.246571, 0.029848, -0.489273, -0.734283,
                -0.796145, -0.441830, -0.033330, 0.415667, 0.341943, 0.380445, 0.260451,
                0.092989, -0.161122, -0.173544, -0.015523, 0.251668, 0.022534, 0.054093,
                0.005430, -0.035820, -0.057551, 0.161558
            ]),
            backness: new Float32Array([
                0.995437, 0.540693, 0.121922, -0.585859, -0.443847, 0.170546, 0.188879,
                -0.306358, -0.308599, -0.212987, 0.012301, 0.574838, 0.681862, 0.229355,
                -0.222245, -0.222203, -0.129962, 0.329717, 0.142439, -0.132018, 0.103092,
                0.052337, -0.034299, -0.041558, 0.141547
            ])
        }
    };

    /**
     * Loads the regression weights from the server
     * @param boolean normalizeMFCCs indicates whether to use weights for normalized or 
     * non-normalized MFCCs
     */
    VowelWorm.loadRegressionWeights = function(normalizeMFCCs) {
        
        var weightsReq = new XMLHttpRequest();
        weightsReq.addEventListener("load", function() {

            // Parse the backness and height weights
            var xmlDoc = weightsReq.responseXML;
            var backWeightsElements = xmlDoc.getElementsByTagName("backness")[0]
                    .getElementsByTagName("weight");
            var heightWeightsElements = xmlDoc.getElementsByTagName("height")[0]
                    .getElementsByTagName("weight");
            var backWeights = [];
            var heightWeights = [];
            for (var i = 0; i < backWeightsElements.length; i++) {
                backWeights.push(backWeightsElements[i].childNodes[0].nodeValue);
                heightWeights.push(heightWeightsElements[i].childNodes[0].nodeValue);
            }
            VowelWorm._MFCC_WEIGHTS[25].backness = new Float32Array(backWeights);
            VowelWorm._MFCC_WEIGHTS[25].height = new Float32Array(heightWeights);
        })
        if (normalizeMFCCs) {
            weightsReq.open("GET", "training/weights_norm_mfcc.xml", true);        
        }
        else {
            weightsReq.open("GET", "training/weights.xml", true);
        }
        weightsReq.send();
    }
    

    /**
     * Given an array of fft data, returns backness and height coordinates
     * in the vowel space.
     * @param {Array.<number>} fftData The fftData to map
     * @return {Array.<number>} an array formatted thusly: [x,y]. May be empty
     * @nosideeffects
     */
    VowelWorm._MAPPING_METHODS = {
        linearRegression: function(fftData, options) {

            // Get the mfccs to use as features
            var mfccs = window.AudioProcessor.getMFCCs({
                fft: fftData,
                fftSize: options.fftSize,
                minFreq: options.minHz,
                maxFreq: options.maxHz,
                filterBanks: NUM_FILTER_BANKS,
                sampleRate: options.sampleRate,
            });

            // Predict the backness and height using multiple linear regression
            if(mfccs.length) {

                // Get the specified MFCCs to use as regressors (features)
                // Also makes a copy of mfccs (since they are changing with the streaming audio)
                var features = mfccs.slice(FIRST_MFCC - 1, LAST_MFCC);

                // Normalize the MFCC vector
                if (window.game.normalizeMFCCs) {
                    var normSquared = 0;
                    for (var i = 0; i < features.length; i++) {
                        normSquared += features[i] * features[i];
                    }
                    for (var i = 0; i < features.length; i++) {
                        features[i] /= Math.sqrt(normSquared);
                    }                    
                }

                // Insert DC coefficient for regression
                features.splice(0, 0, 1);

                // Check for corresponding weights
                if (VowelWorm._MFCC_WEIGHTS[features.length] === undefined) {
                    throw new Error("No weights found for mfccs of length " +
                        mfccs.length + ". If you are using getMFCCs, make sure the " +
                        "amount of filter banks you are looking for corresponds to one of " +
                        "the keys found in VowelWorm._MFCC_WEIGHTS.");
                }

                // Do the prediction
                var backness = window.MathUtils.predict(features, VowelWorm._MFCC_WEIGHTS[features.length].backness);
                var height = window.MathUtils.predict(features, VowelWorm._MFCC_WEIGHTS[features.length].height);

                return [backness, height];
            } 
            return [];
        },
        mfccFormants: function(fftData, options) {

            var mfccs = window.AudioProcessor.getMFCCs({
                fft: fftData,
                fftSize: options.fftSize,
                minFreq: options.minHz,
                maxFreq: options.maxHz,
                filterBanks: options.numFilterBanks,
                sampleRate: options.sampleRate
            });

            if(mfccs.length) {

                // Convert the mfccs to formants
                var formants = window.AudioProcessor.getFormantsFromMfccs(mfccs);
                var backness;
                var height;
                if (formants.length > 0) {
                    var pos = mapFormantsToIPA(formants[0], formants[1]);
                }

                return [backness, height];
            } 
            return [];
        },
        cepstrumFormants: function(fftData, options) {
            var cepstrum = window.AudioProcessor.getCepstrum(fftData, {});

            if(cepstrum.length) {

                // Convert the cepstrum to formants
                var formants = window.AudioProcessor.getFormantsFromCepstrum(cepstrum, {
                    numFormants: 2,
                    sampleRate: options.sampleRate,
                    fftSize: options.fftSize,
                    cutoff: 200
                });

                if (formants.length > 0) {
                    var pos = mapFormantsToIPA(formants[0], formants[1]);
                    return pos;
                }
                else {
                    return [];
                }
            }
            return [];
        }
    };

    /**
     * Maps first and second formants to the IPA vowel space.
     */
    var mapFormantsToIPA = function(f1, f2) {

        // var backness = window.MathUtils.mapToScale(f2 - f1, 
        //     window.AudioProcessor.F2_MAX - window.AudioProcessor.F1_MAX, 
        //     window.AudioProcessor.F2_MIN - window.AudioProcessor.F1_MIN, BACKNESS_MIN, BACKNESS_MAX);
		
        var backness = window.MathUtils.mapToScale(f2, 
            window.AudioProcessor.F2_MAX, window.AudioProcessor.F2_MIN, BACKNESS_MIN, BACKNESS_MAX);

        var height = window.MathUtils.mapToScale(f1, 
            window.AudioProcessor.F1_MAX, window.AudioProcessor.F1_MIN, HEIGHT_MIN, HEIGHT_MAX);

        return [backness, height];
    }

    /**
     * Representative of the current mode VowelWorm is in.
     * In this case, an audio element
     * @const
     * @memberof VowelWorm
     */
    VowelWorm.AUDIO = 1;

    /**
     * Representative of the current mode VowelWorm is in.
     * In this case, a video element
     * @const
     * @memberof VowelWorm
     */
    VowelWorm.VIDEO = 2;

    /**
     * Representative of the current mode VowelWorm is in.
     * In this case, a media stream
     * @const
     * @memberof VowelWorm
     */
    VowelWorm.STREAM = 3;

    /**
     * Representative of the current mode VowelWorm is in.
     * In this case, a remote URL turned into a source node
     * @const
     * @memberof VowelWorm
     */
    VowelWorm.REMOTE_URL = 4;

    /**
     * Contains methods used in the analysis of vowel audio data
     * @param {*} stream The audio stream to analyze OR a string representing the URL for an audio file
     * @constructor
     * //@struct (attaching modules breaks this as a struct; is there a better way?)
     * @final
     * @name VowelWorm.instance
     * @memberof VowelWorm
     */
    window.VowelWorm.instance = function (stream) {
        var that = this;

        this._context = CONTEXT;
        this._analyzer = this._context.createAnalyser();
        this._sourceNode = null; // for analysis with files rather than mic input
        this._analyzer.fftSize = window.MathUtils.nextPow2(this._context.sampleRate * WINDOW_SIZE);
        this._buffer = new Float32Array(this._analyzer.frequencyBinCount);
        this._audioBuffer = null; // comes from downloading an audio file

        // Attach an processor node to analyze data from every buffer.
        // Note: this is deprecated but the replacement has not been implemented in any browers yet.
        // See https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode/onaudioprocess
        this._processorNode = this._context.createScriptProcessor(this._analyzer.fftSize, 1, 1);
        this._processorNode.onaudioprocess = function(e) {
            that.computePosition(window.game.map, window.game.smoothingConstant);

            if (window.game.saveData) {

                // Save the timestamp for this frame
                this.timestamps.push(this._analyzer.currentTime);

                // Save the time domain data
                var timeDomainBuffer = new Float32Array(this.getFFTSize());
                this._analyzer.getFloatTimeDomainData(timeDomainBuffer);
                var timeDomainData = new Float32Array(this.fftSize);
                for (var i = 0; i < timeDomainBuffer.length; i++) {
                    timeDomainData[i] = timeDomainBuffer[i];
                }
                this.timeDomainData.push(timeDomainData[i]);  

                // Save the FFT data
                var fftBuffer = this.getFFT();
                var fftData = new Float32Array(fftBuffer.length);
                for (var i = 0; i < fftBuffer.length; i++) {
                    fftData[i] = fftBuffer[i];
                }
                this.ffts.push(fftBuffer[i]);
            }
        }
        this._processorNode.connect(this._context.destination);
        
        if (stream) {
            this.setStream(stream);
        }

        for (var name in modules) {
            if (modules.hasOwnProperty(name)) {
                attachModuleToInstance(name, that);
            }
        }
        instances.push(this);
    };
    VowelWorm.instance = window.VowelWorm.instance;

    VowelWorm.instance.prototype = Object.create(VowelWorm);
    VowelWorm.instance.constructor = VowelWorm.instance;

    var proto = VowelWorm.instance.prototype;

    /**
     * Attaches a module to the given instance, with the given name
     * @param {string} name The name of the module to attach. Should be present in
     * {@link modules} to work
     * @param {window.VowelWorm.instance} instance The instance to affix a module to
     */
    function attachModuleToInstance(name, instance) {
        instance[name] = {};
        modules[name].call(instance[name], instance);
    };

    /**
     * Callback used by {@link VowelWorm.module}
     * @callback VowelWorm~createModule
     * @param {window.VowelWorm.instance} instance
     */

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
     * @memberof VowelWorm
     */
    VowelWorm.module = function (name, callback) {
        if (proto[name] !== undefined || modules[name] !== undefined) {
            throw new Error("Cannot define a VowelWorm module with the name \"" + name +
                "\": a property with that name already exists. May I suggest \"" + name +
                "_kewl_sk8brdr_98\" instead?");
        }
        if (typeof callback !== 'function') {
            throw new Error("No callback function submitted.");
        }
        modules[name] = callback;
        instances.forEach(function (instance) {
            attachModuleToInstance(name, instance);
        });
    };

    /**
     * Removes a module from all current and future VowelWorm instances. Used
     * primarily for testing purposes.
     * @param {string} name - The name of the module to remove
     * @memberof VowelWorm
     */
    VowelWorm.removeModule = function (name) {
        if (modules[name] === undefined) {
            return;
        }
        delete modules[name];
        instances.forEach(function (instance) {
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
     * @member
     * @memberof VowelWorm.instance
     */
    VowelWorm.instance.prototype.mode = null;

    /**
     * Removes reference to this particular worm instance as well as
     * all properties of it.
     * @memberof VowelWorm.instance
     */
    VowelWorm.instance.prototype.destroy = function () {
        var index = instances.indexOf(this);
        if (index !== -1) {
            instances.splice(index, 1);
        }
        for (var i in this) {
            if (this.hasOwnProperty(i)) {
                delete this[i];
            }
        }
    };

    /**
     * The sample rate of the attached audio source
     * @return {number}
     * @memberof VowelWorm.instance
     * @nosideeffects
     */
    VowelWorm.instance.prototype.getSampleRate = function () {
        switch (this.mode) {
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
        }
    };

    /**
     * The size of the FFT. This is twice the number of bins.
     * @return {number}
     * @memberof VowelWorm.instance
     * @nosideeffects
     */
    VowelWorm.instance.prototype.getFFTSize = function () {
        return this._analyzer.fftSize;
    };

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
     * @memberof VowelWorm.instance
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
    VowelWorm.instance.prototype.getFFT = function () {
        this._analyzer.getFloatFrequencyData(this._buffer);
        return this._buffer;
    };

    /**
     * Stores all timestamps for future use.
     */
    VowelWorm.instance.prototype.timestamps = [];

    /**
     * Stores all fft buffers for future use.
     */
    VowelWorm.instance.prototype.ffts = [];

    /**
     * Stores all time domain buffers for future use.
     */
    VowelWorm.instance.prototype.timeDomainData = [];

    /**
     * Stores the previous positions for smoothing
     */
    VowelWorm.instance.prototype.positions = [];

    /**
     * Stores the current simple moving average for smoothing.
     */
    VowelWorm.instance.prototype.positionSMA = [];

    /**
     * Computes the (backness, height) coordinates of this worm for the current time frame
     * The position is smoothed over time with a simple moving average.
     * See https://en.wikipedia.org/wiki/Moving_average#Simple_moving_average
     */
    VowelWorm.instance.prototype.computePosition = function (mappingMethod, smoothingConstant) {

        var buffer = this.getFFT();

        // Copy the fft data since it will change as audio streams in
        var fft = [];
        for (var i = 0; i < buffer.length; i++) {
          fft.push(buffer[i]);
        }

        // Map the fft data to (backness, height) coordinates in the vowel space
        var position = mappingMethod(fft, {
          fftSize: this.getFFTSize(),
          minHz: window.game.minHz,
          maxHz: window.game.maxHz,
          sampleRate: this.getSampleRate()
        });

        // Smooth the position over time
        if (this.positions.length == 0) {
            this.positionSMA = position;
        }
        else if (this.positions.length < smoothingConstant) {
            // Compute each coordinate separately
            for (var i = 0; i < this.positionSMA.length; i++) {
                // Until we have enough previous data, this is the same as the cumulative moving average
                this.positionSMA[i] = (position[i] + this.positions.length * this.positionSMA[i]) / 
                        (this.positions.length + 1)
            }
        }
        else {
            var oldPosition = this.positions[0];
            for (var i = 0; i < this.positionSMA.length; i++) {
                this.positionSMA[i] += (position[i] - oldPosition[i]) / this.positions.length;
            }
            this.positions = this.positions.slice(1);
        }
        // Make sure to store this position for next time
        this.positions.push(position);
    }

    /**
     * Gets the current (backness, height) coordinates of this worm.
     */
    VowelWorm.instance.prototype.getPosition = function () {
        return this.positionSMA;
    }

    VowelWorm.instance.prototype.resetPosition = function() {
        this.positions = [];
        this.positionSMA = [];
    }

    /**
     * @license
     *
     * VowelWorm.instance.prototype.setStream helper functions borrow heavily from
     * Chris Wilson's pitch detector, under the MIT license.
     * See https://github.com/cwilso/pitchdetect
     *
     */
    /**
     * Specifies the audio source for the instance. Can be a video or audio element,
     * a URL, or a MediaStream
     * @memberof VowelWorm.instance
     * @param {MediaStream|string|HTMLAudioElement|HTMLVideoElement} stream The audio stream to analyze OR a string representing the URL for an audio file OR an Audio file
     * @throws An error if stream is neither a Mediastream, Audio or Video Element, or a string
     */
    VowelWorm.instance.prototype.setStream = function (stream) {
        if (typeof stream === 'string') {
            this._loadFromURL(stream);
        }
        else if (typeof stream === 'object' && stream['constructor']['name'] === 'MediaStream') {
            this._loadFromStream(stream);
        }
        else if (stream && (stream instanceof window.Audio || stream.tagName === 'AUDIO')) {
            this._loadFromAudio(stream);
        }
        else if (stream && stream.tagName === 'VIDEO') {
            this._loadFromVideo(stream);
        }
        else {
            throw new Error("VowelWorm.instance.setStream only accepts URL strings, " +
                "instances of MediaStream (as from getUserMedia), or " +
                "<audio> elements");
        }
    };

    /**
     * @param {string} url Where to fetch the audio data from
     * @throws An error when the server returns an error status code
     * @throws An error when the audio file cannot be decoded
     * @private
     * @memberof VowelWorm.instance
     */
    VowelWorm.instance.prototype._loadFromURL = function loadFromURL(url) {
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

        request.onload = function () {
            if (request.status !== 200) {
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
     * @private
     * @memberof VowelWorm.instance
     */
    VowelWorm.instance.prototype._resetSourceNode = function resetSourceNode() {
        this._sourceNode = this._context.createBufferSource();
        this._sourceNode.buffer = this._audioBuffer;
        this._sourceNode.connect(this._analyzer);
        this._sourceNode.connect(this._processorNode);
    };

    /**
     * @param {MediaStream} stream
     * @memberof VowelWorm.instance
     * @private
     */
    VowelWorm.instance.prototype._loadFromStream = function (stream) {
        this.mode = this.STREAM;
        this._sourceNode = this._context.createMediaStreamSource(stream);
        this._sourceNode.connect(this._analyzer);
        this._sourceNode.connect(this._processorNode);
    };

    /**
     * Loads an audio element as the data to be processed
     * @param {HTMLAudioElement} audio
     * @private
     * @memberof VowelWorm.instance
     */
    VowelWorm.instance.prototype._loadFromAudio = function loadFromAudio(audio) {

        this.mode = this.AUDIO;
        this._sourceNode = this._context.createMediaElementSource(audio);
        this._sourceNode.connect(this._analyzer);
        this._analyzer.connect(this._context.destination);
        this._sourceNode.connect(this._processorNode);
    };

    /**
     * Loads a video element as the data to be processed
     * @param {HTMLVideoElement} video
     * @private
     * @memberof VowelWorm.instance
     */
    VowelWorm.instance.prototype._loadFromVideo = function loadFromVideo(video) {

        this.mode = this.VIDEO;
        this._sourceNode = this._context.createMediaElementSource(video);
        this._sourceNode.connect(this._analyzer);
        this._analyzer.connect(this._context.destination);
        this._sourceNode.connect(this._processorNode);
    };
}(window.numeric));
