import * as AudioProcessor from "./modules/utils/audioprocessor.js";
import * as MathUtils from "./modules/utils/mathutils.js";

const DEFAULT_SAMPLE_RATE = 44100;
const WINDOW_SIZE = 0.046;
const NUM_FILTER_BANKS = 40;
const FIRST_MFCC = 2;
const LAST_MFCC = 25;
const BACKNESS_MIN = 0;
const BACKNESS_MAX = 4;
const HEIGHT_MIN = 0;
const HEIGHT_MAX = 3;

export const AUDIO = 1;
export const VIDEO = 2;
export const STREAM = 3;
export const REMOTE_URL = 4;

/**
 * Transposed MFCC weight matrices for prediction.
 * From Harald Frostel, Andreas Arzt, and Gerhard Widmer at the
 * Department of Computational Perception, Johannes Kepler University, Linz, Austria.
 */
export const MFCC_WEIGHTS = {
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
 * Loads regression weights from an XML file on the server.
 * @param {boolean} normalizeMFCCs - Whether to use weights for normalized MFCCs
 */
export function loadRegressionWeights(normalizeMFCCs) {
  var url = normalizeMFCCs
    ? "training/weights_norm_mfcc.xml"
    : "training/weights.xml";

  fetch(url)
    .then(function(response) { return response.text(); })
    .then(function(text) {
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(text, "text/xml");
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
      MFCC_WEIGHTS[25].backness = new Float32Array(backWeights);
      MFCC_WEIGHTS[25].height = new Float32Array(heightWeights);
    })
    .catch(function() {
      // Silently fall back to hardcoded weights
    });
}

export const MAPPING_METHODS = {
  linearRegression: function(fftData, options) {
    var mfccs = AudioProcessor.getMFCCs({
      fft: fftData,
      fftSize: options.fftSize,
      minFreq: options.minHz,
      maxFreq: options.maxHz,
      filterBanks: NUM_FILTER_BANKS,
      sampleRate: options.sampleRate,
    });

    if (mfccs.length) {
      var features = mfccs.slice(FIRST_MFCC - 1, LAST_MFCC);

      if (options.normalizeMFCCs) {
        var normSquared = 0;
        for (var i = 0; i < features.length; i++) {
          normSquared += features[i] * features[i];
        }
        for (var i = 0; i < features.length; i++) {
          features[i] /= Math.sqrt(normSquared);
        }
      }

      features.splice(0, 0, 1);

      if (MFCC_WEIGHTS[features.length] === undefined) {
        throw new Error("No weights found for mfccs of length " + mfccs.length);
      }

      var backness = MathUtils.predict(features, MFCC_WEIGHTS[features.length].backness);
      var height = MathUtils.predict(features, MFCC_WEIGHTS[features.length].height);
      return [backness, height];
    }
    return [];
  },

  mfccFormants: function(fftData, options) {
    var mfccs = AudioProcessor.getMFCCs({
      fft: fftData,
      fftSize: options.fftSize,
      minFreq: options.minHz,
      maxFreq: options.maxHz,
      filterBanks: options.numFilterBanks,
      sampleRate: options.sampleRate
    });

    if (mfccs.length) {
      // TODO: getFormantsFromMfccs is not yet implemented
      return [];
    }
    return [];
  },

  cepstrumFormants: function(fftData, options) {
    var cepstrum = AudioProcessor.getCepstrum(fftData, {});

    if (cepstrum.length) {
      var formants = AudioProcessor.getFormantsFromCepstrum(cepstrum, {
        numFormants: 2,
        sampleRate: options.sampleRate,
        fftSize: options.fftSize,
        cutoff: 200
      });

      if (formants.length > 0) {
        return mapFormantsToIPA(formants[0], formants[1]);
      }
      return [];
    }
    return [];
  }
};

function mapFormantsToIPA(f1, f2) {
  var backness = MathUtils.mapToScale(f2, AudioProcessor.F2_MAX, AudioProcessor.F2_MIN, BACKNESS_MIN, BACKNESS_MAX);
  var height = MathUtils.mapToScale(f1, AudioProcessor.F1_MAX, AudioProcessor.F1_MIN, HEIGHT_MIN, HEIGHT_MAX);
  return [backness, height];
}

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }
  return audioContext;
}

export class VowelWorm {
  constructor(stream, options = {}) {
    this._context = getAudioContext();
    this._analyzer = this._context.createAnalyser();
    this._sourceNode = null;
    this._analyzer.fftSize = MathUtils.nextPow2(this._context.sampleRate * WINDOW_SIZE);
    this._buffer = new Float32Array(this._analyzer.frequencyBinCount);
    this._audioBuffer = null;

    // Instance config (decoupled from global state)
    this.mappingMethod = options.mappingMethod || MAPPING_METHODS.linearRegression;
    this.normalizeMFCCs = options.normalizeMFCCs !== undefined ? options.normalizeMFCCs : true;
    this.smoothingConstant = options.smoothingConstant || 5;
    this.minHz = options.minHz || 0;
    this.maxHz = options.maxHz || 8000;

    this.mode = null;
    this.positions = [];
    this.positionSMA = [];

    // ScriptProcessorNode (deprecated but still universally supported;
    // AudioWorklet is the replacement but adds significant complexity)
    var that = this;
    this._processorNode = this._context.createScriptProcessor(this._analyzer.fftSize, 1, 1);
    this._processorNode.onaudioprocess = function() {
      that.computePosition();
    };
    this._processorNode.connect(this._context.destination);

    if (stream) {
      this.setStream(stream);
    }
  }

  getSampleRate() {
    switch (this.mode) {
      case REMOTE_URL:
        return this._sourceNode.buffer.sampleRate;
      case AUDIO:
      case VIDEO:
        return DEFAULT_SAMPLE_RATE;
      case STREAM:
        return this._context.sampleRate;
      default:
        return DEFAULT_SAMPLE_RATE;
    }
  }

  getFFTSize() {
    return this._analyzer.fftSize;
  }

  getFFT() {
    this._analyzer.getFloatFrequencyData(this._buffer);
    return this._buffer;
  }

  computePosition() {
    var buffer = this.getFFT();
    var fft = [];
    for (var i = 0; i < buffer.length; i++) {
      fft.push(buffer[i]);
    }

    var position = this.mappingMethod(fft, {
      fftSize: this.getFFTSize(),
      minHz: this.minHz,
      maxHz: this.maxHz,
      sampleRate: this.getSampleRate(),
      normalizeMFCCs: this.normalizeMFCCs
    });

    if (this.positions.length === 0) {
      this.positionSMA = position;
    } else if (this.positions.length < this.smoothingConstant) {
      for (var i = 0; i < this.positionSMA.length; i++) {
        this.positionSMA[i] = (position[i] + this.positions.length * this.positionSMA[i]) /
          (this.positions.length + 1);
      }
    } else {
      var oldPosition = this.positions[0];
      for (var i = 0; i < this.positionSMA.length; i++) {
        this.positionSMA[i] += (position[i] - oldPosition[i]) / this.positions.length;
      }
      this.positions = this.positions.slice(1);
    }
    this.positions.push(position);
  }

  getPosition() {
    return this.positionSMA;
  }

  resetPosition() {
    this.positions = [];
    this.positionSMA = [];
  }

  setStream(stream) {
    if (typeof stream === "string") {
      this._loadFromURL(stream);
    } else if (typeof stream === "object" && stream.constructor &&
               stream.constructor.name === "MediaStream") {
      this._loadFromStream(stream);
    } else if (stream && (stream instanceof Audio || (stream.tagName && stream.tagName === "AUDIO"))) {
      this._loadFromAudio(stream);
    } else if (stream && stream.tagName === "VIDEO") {
      this._loadFromVideo(stream);
    } else {
      throw new Error("VowelWorm.setStream only accepts URL strings, " +
        "MediaStream instances, or <audio>/<video> elements");
    }
  }

  _loadFromURL(url) {
    var that = this;
    fetch(url)
      .then(function(response) {
        if (!response.ok) {
          throw new Error("Failed to load audio at '" + url + "': " + response.status);
        }
        return response.arrayBuffer();
      })
      .then(function(arrayBuffer) {
        return that._context.decodeAudioData(arrayBuffer);
      })
      .then(function(buffer) {
        that.mode = REMOTE_URL;
        that._audioBuffer = buffer;
        that._resetSourceNode();
      })
      .catch(function(err) {
        throw new Error("Could not load/decode audio from " + url + ": " + err.message);
      });
  }

  _resetSourceNode() {
    this._sourceNode = this._context.createBufferSource();
    this._sourceNode.buffer = this._audioBuffer;
    this._sourceNode.connect(this._analyzer);
    this._sourceNode.connect(this._processorNode);
  }

  _loadFromStream(stream) {
    this.mode = STREAM;
    this._sourceNode = this._context.createMediaStreamSource(stream);
    this._sourceNode.connect(this._analyzer);
    this._sourceNode.connect(this._processorNode);
  }

  _loadFromAudio(audio) {
    this.mode = AUDIO;
    this._sourceNode = this._context.createMediaElementSource(audio);
    this._sourceNode.connect(this._analyzer);
    this._analyzer.connect(this._context.destination);
    this._sourceNode.connect(this._processorNode);
  }

  _loadFromVideo(video) {
    this.mode = VIDEO;
    this._sourceNode = this._context.createMediaElementSource(video);
    this._sourceNode.connect(this._analyzer);
    this._analyzer.connect(this._context.destination);
    this._sourceNode.connect(this._processorNode);
  }

  destroy() {
    if (this._processorNode) {
      this._processorNode.disconnect();
    }
    if (this._sourceNode) {
      this._sourceNode.disconnect();
    }
  }
}
