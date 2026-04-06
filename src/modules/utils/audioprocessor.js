import * as MathUtils from "./mathutils.js";

const DEFAULT_MIN_HZ = 0;
const DEFAULT_MAX_HZ = 8000;
const DEFAULT_FILTER_BANKS = 40;

const WINDOW_SIZES = [75, 61];

const MIN_DIFF_F1_F2 = 150;
const MIN_DIFF_F2_F3 = 500;
const MIN_PEAK_HEIGHT = 0.1;

export const F1_MIN = 200;
export const F1_MAX = 1000;
export const F2_MIN = 700;
export const F2_MAX = 3000;
export const F3_MIN = 1500;
export const F3_MAX = 5000;

export const DEFAULT_MAX_FORMANT_MALE = 5000;
export const DEFAULT_MAX_FORMANT_FEMALE = 5500;
export const DEFAULT_MAX_FORMANT_CHILD = 8000;

export const HANNING_SHIFT = 32;

export function dct(values) {
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var val = 0;
    for (var j = 0; j < values.length; j++) {
      val += values[j] * Math.cos(i * (j + 0.5) * Math.PI / values.length);
    }
    if (i === 0) {
      val /= Math.sqrt(2.0);
    }
    val *= Math.sqrt(2.0 / values.length);
    result.push(val);
  }
  return result;
}

export function inverseDct(values) {
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var val = values[0] / Math.sqrt(2);
    for (var j = 1; j < values.length; j++) {
      val += values[j] * Math.cos(j * (i + 0.5) * Math.PI / values.length);
    }
    val *= Math.sqrt(2.0 / values.length);
    result.push(val);
  }
  return result;
}

export function computeDft(inreal, inimag) {
  var n = inreal.length;
  var outreal = new Array(n);
  var outimag = new Array(n);
  for (var k = 0; k < n; k++) {
    var sumreal = 0;
    var sumimag = 0;
    for (var t = 0; t < n; t++) {
      var angle = 2 * Math.PI * t * k / n;
      sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
      sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
    }
    outreal[k] = sumreal;
    outimag[k] = sumimag;
  }
  return [outreal, outimag];
}

export function inverseDft(inreal, inimag) {
  var n = inreal.length;
  var outreal = new Array(n);
  var outimag = new Array(n);
  for (var k = 0; k < n; k++) {
    var sumreal = 0;
    var sumimag = 0;
    for (var t = 0; t < n; t++) {
      var angle = 2 * Math.PI * t * k / n;
      sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
      sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
    }
    outreal[k] = sumreal;
    outimag[k] = sumimag;
  }
  return [outreal, outimag];
}

function freqToMel(frequency) {
  return 1127.01048 * Math.log(1.0 + frequency / 700);
}

function initFilterBanks(Nspec, noFilterBanks, minFreq, maxFreq, sampleRate) {
  var filterBanks = [];
  var NFFT = Nspec * 2;
  var minMel = freqToMel(minFreq);
  var maxMel = freqToMel(maxFreq);
  var dMel = (maxMel - minMel) / (noFilterBanks + 1);
  var melSpacing = [];
  var fftFreqs2Mel = [];
  var lower = [];
  var center = [];

  for (var i = 0; i < noFilterBanks + 2; i++) {
    melSpacing.push(minMel + i * dMel);
  }
  for (var i = 0; i < Nspec; i++) {
    fftFreqs2Mel.push(freqToMel(i * sampleRate / NFFT));
  }
  for (var i = 0; i < noFilterBanks; i++) {
    lower.push(melSpacing[i]);
  }
  for (var i = 1; i < noFilterBanks + 1; i++) {
    center.push(melSpacing[i]);
  }

  for (var i = 0; i < noFilterBanks; i++) {
    var fBank = [];
    for (var j = 0; j < Nspec; j++) {
      fBank.push(Math.max(0.0, 1 - Math.abs(fftFreqs2Mel[j] - center[i]) / (center[i] - lower[i])));
    }
    filterBanks.push(fBank);
  }
  return filterBanks;
}

function logMel(spectrum, filterBanks) {
  var result = [];
  for (var i = 0; i < filterBanks.length; i++) {
    var val = 0.0;
    for (var j = 0; j < filterBanks[i].length; j++) {
      val += filterBanks[i][j] * spectrum[j];
    }
    result.push(Math.log10(val));
  }
  return result;
}

export function getMFCCs(options) {
  var toLM = options.toLinearMagnitude === undefined ? true : !!options.toLinearMagnitude;
  var fft = options.fft;

  if (toLM) {
    for (var j = 0; j < fft.length; j++) {
      fft[j] = decibelsToLinear(fft[j]);
    }
  } else {
    var tmpFFT = [];
    for (var i = 0; i < fft.length; i++) {
      tmpFFT[i] = Math.abs(fft[i]);
    }
    fft = tmpFFT;
  }

  var numFilterBanks = options.filterBanks || DEFAULT_FILTER_BANKS;
  var NFFT = options.fftSize;
  var minFreq = options.minFreq || DEFAULT_MIN_HZ;
  var maxFreq = options.maxFreq || DEFAULT_MAX_HZ;
  var sampleRate = options.sampleRate;

  var filterBanks = initFilterBanks(NFFT / 2, numFilterBanks, minFreq, maxFreq, sampleRate);
  var logMelSpectrum = logMel(fft, filterBanks);
  return dct(logMelSpectrum);
}

export function getFormants(data, sampleRate) {
  if (arguments.length !== 2) {
    throw new Error("Invalid arguments. Function must be called as getFormants(data, sampleRate)");
  }

  var fftSize = data.length * 2;

  for (var i = 0; i < WINDOW_SIZES.length; i++) {
    var smooth = hann(data, WINDOW_SIZES[i]).slice(HANNING_SHIFT);
    var formants = getPeaks(smooth, sampleRate, fftSize);

    if (formants[0] < F1_MIN || formants[0] > F1_MAX || formants[0] >= formants[1] ||
        formants[1] < F2_MIN || formants[1] > F2_MAX || formants[1] >= formants[2] ||
        formants[2] < F3_MIN || formants[2] > F3_MAX) {
      continue;
    } else {
      return formants;
    }
  }
  return [];
}

function getPeaks(smoothedArray, sampleRate, fftSize) {
  var peaks = [];
  for (var i = 0; i < smoothedArray.length; i++) {
    var hz = toFrequency(i, sampleRate, fftSize);
    var formant = peaks.length + 1;

    switch (formant) {
      case 1:
        if (hz < F1_MIN) continue;
        break;
      case 2:
        if (hz < F2_MIN || hz - peaks[0] < MIN_DIFF_F1_F2) continue;
        break;
      case 3:
        if (hz < F3_MIN || hz - peaks[1] < MIN_DIFF_F2_F3) continue;
        break;
      default:
        return null;
    }

    var previousNum = smoothedArray[i - 1] || 0;
    var currentNum = smoothedArray[i] || 0;
    var nextNum = smoothedArray[i + 1] || 0;

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
}

export function peakHeight(index, values) {
  var peak = values[index],
      lheight = null,
      rheight = null;

  var prev = null;
  for (var i = index - 1; i >= 0; i--) {
    if (prev !== null && values[i] > prev) break;
    prev = values[i];
    lheight = peak - prev;
  }

  prev = null;
  for (var i = index + 1; i < values.length; i++) {
    if (prev !== null && values[i] > prev) break;
    prev = values[i];
    rheight = peak - prev;
  }

  var result;
  if (lheight === null) {
    result = +rheight;
  } else if (rheight === null) {
    result = +lheight;
  } else {
    result = lheight < rheight ? lheight : rheight;
  }

  return result < 0 ? 0 : result;
}

export function getFormantsFromCepstrum(cepstrum, options) {
  var numFormants = options.numFormants || 3;
  var sampleRate = options.sampleRate || 44100;
  var fftSize = options.fftSize || 1024;
  var cutoff = options.cutoff || Math.round(fftSize / 8);
  var formants = [];

  for (var i = cutoff; i < cepstrum.length; i++) {
    cepstrum[i] = 0;
  }

  var envelope = inverseDct(cepstrum);
  var peakPositions = MathUtils.findPeaks(envelope, numFormants);

  for (var i = 0; i < numFormants; i++) {
    formants.push(toFrequency(peakPositions[i], sampleRate, fftSize));
  }
  return formants;
}

export function getCepstrum(fft, options) {
  var toLM = options.toLinearMagnitude === undefined ? true : !!options.toLinearMagnitude;

  if (toLM) {
    for (var j = 0; j < fft.length; j++) {
      fft[j] = decibelsToLinear(fft[j]);
    }
  } else {
    var tmpFFT = [];
    for (var i = 0; i < fft.length; i++) {
      tmpFFT[i] = Math.abs(fft[i]);
    }
    fft = tmpFFT;
  }

  var logSpectrum = [];
  for (var i = 0; i < fft.length; i++) {
    logSpectrum.push(Math.log(fft[i]));
  }

  return dct(logSpectrum);
}

export function linearToDecibel(magnitude) {
  return Math.log10(magnitude) / 0.05;
}

export function decibelsToLinear(dB) {
  return Math.pow(10, 0.05 * dB);
}

export function toFrequency(position, sampleRate, fftSize) {
  var nyquist = sampleRate / 2;
  var totalBins = fftSize / 2;
  return position * (nyquist / totalBins);
}

export const HANNING_WINDOW = {
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

export function hann(vals, window_size) {
  if (typeof HANNING_WINDOW[window_size] === "undefined") {
    throw new Error("No precomputed Hanning Window values found for " + window_size);
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

  var w = HANNING_WINDOW[window_size];
  var sum = 0;
  var wMorph = [];
  for (var i = 0; i < w.length; i++) {
    sum += w[i];
  }
  for (var i = 0; i < w.length; i++) {
    wMorph[i] = w[i] / sum;
  }
  return convolve(wMorph, s);
}

export function convolve(m, y) {
  var result = [];
  var first, second;

  if (m.length > y.length) {
    first = y;
    second = m;
  } else {
    first = m;
    second = y;
  }

  var size = second.length - first.length + 1;
  for (var i = 0; i < size; i++) {
    var newNum = 0;
    var len = first.length;
    for (var j = 0; j < first.length; j++) {
      newNum += first[len - 1 - j] * second[j + i];
    }
    result.push(newNum);
  }
  return result;
}

export function savitzkyGolay(y, window_size, order) {
  var windowSize = Math.abs(parseInt(window_size, 10));
  order = Math.abs(parseInt(order, 10));
  var order_range = order + 1;
  var half_window = (windowSize - 1) / 2;
  var b = [];

  for (var k = -half_window; k < half_window + 1; k++) {
    var row = [];
    for (var i = 0; i < order_range; i++) {
      row.push(Math.pow(k, i));
    }
    b.push(row);
  }

  var temp = MathUtils.pinv(b);
  var m = temp[0];

  var yTemp = y.subarray ? y.subarray(1, half_window + 1) : y.slice(1, half_window + 1);
  yTemp = MathUtils.flipArray(yTemp);
  yTemp = MathUtils.addToArray(yTemp, -y[0]);
  yTemp = MathUtils.arrayAbs(yTemp);
  yTemp = MathUtils.negArrayAddValue(yTemp, y[0]);
  var firstvals = yTemp;

  var yTemp2 = y.subarray ? y.subarray(-half_window - 1, -1) : y.slice(-half_window - 1, -1);
  yTemp2 = MathUtils.flipArray(yTemp2);
  yTemp2 = MathUtils.addToArray(yTemp2, -y[y.length - 1]);
  yTemp2 = MathUtils.arrayAbs(yTemp2);
  yTemp2 = MathUtils.addToArray(yTemp2, y[y.length - 1]);
  var lastvals = yTemp2;

  y = MathUtils.concatenate(firstvals, y, lastvals);
  m = MathUtils.flipArray(m);
  return convolve(m, y);
}
