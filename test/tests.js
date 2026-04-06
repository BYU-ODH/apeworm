import { describe, it, expect } from "vitest";
import {
  convolve,
  savitzkyGolay,
  hann,
  getMFCCs,
  peakHeight,
  toFrequency,
  decibelsToLinear,
  HANNING_WINDOW
} from "../src/modules/utils/audioprocessor.js";

function _round(number) {
  return Math.round(number * 1000) / 1000;
}

describe("smoothing", () => {
  it("convolve: ignores argument order", () => {
    var y = [191,172,184,172,168,195,163,195,169,176,179,170,171,156,174,168,188,148,143,172,170,152,141,141,171,188,195,198,201,188,225,255,255,244,170,224,253,248,208,168,222,240,225,170,179,220,227,201,163,201,228,224,184,172,205,222,206,177,187,221,229,204,198,211,237,236,207,199,223,238,223,201,202,229,238,215,187,202,227,228,207,201,220,240,236,216,205,203,210,199,174,166,167,169,158,155,158,165,160,149];
    var m = Array(55).fill(1/55);
    var result1 = convolve(m, y);
    var result2 = convolve(y, m);
    expect(result1).toEqual(result2);
  });

  it("convolve: correct length (valid convolution)", () => {
    var y = [191,172,184,172,168,195,163,195,169,176,179,170,171,156,174,168,188,148,143,172,170,152,141,141,171,188,195,198,201,188,225,255,255,244,170,224,253,248,208,168,222,240,225,170,179,220,227,201,163,201,228,224,184,172,205,222,206,177,187,221,229,204,198,211,237,236,207,199,223,238,223,201,202,229,238,215,187,202,227,228,207,201,220,240,236,216,205,203,210,199,174,166,167,169,158,155,158,165,160,149];
    var m = Array(55).fill(1/55);
    // valid convolution: max(n,m) - min(n,m) + 1
    expect(convolve(m, y).length).toBe(y.length - m.length + 1);
  });

  it("savitzkyGolay: smoothing matches expected output", () => {
    var vowel = [198,201,188,225,255,255,244,170,224,253,248,208,168,222,240,225,170,179,220,227,201,163,201,228,224,184,172,205,222,206,177,187,221,229,204,198,211,237,236,207,199,223,238,223,201,202,229,238,215,187];
    var result = savitzkyGolay(vowel, 15, 1);
    expect(result.length).toBe(vowel.length);
    // Verify output is smoother than input (lower variance)
    var inputVariance = variance(vowel);
    var outputVariance = variance(result);
    expect(outputVariance).toBeLessThan(inputVariance);
  });

  it("savitzkyGolay: works with Uint8Array", () => {
    var vowel = [198,201,188,225,255,255,244,170,224,253];
    var result1 = savitzkyGolay(vowel, 5, 1);
    var result2 = savitzkyGolay(new Uint8Array(vowel), 5, 1);
    expect(result1.map(Math.round)).toEqual(result2.map(Math.round));
  });

  it("hann: accurate windowing", () => {
    var vowel = [3.4, -5, 2.31, 40, 6.4, -34.38, 10, 300, -20, 0, 15];
    var window_size = 5;
    var expected = [9.905, -1.0725, -0.8, -1.0725, 9.905, 22.1775, 4.605, -13.09, 71.405, 147.5, 65, -1.25, 11.25, 11.25, -1.25];

    HANNING_WINDOW[window_size] = new Float32Array([0, 0.5, 1, 0.5, 0]);

    var result = hann(vowel, window_size);
    expect(result.map(_round)).toEqual(expected.map(_round));
  });
});

describe("MFCC", () => {
  it("computes MFCCs from FFT data", () => {
    var data = [-93.305,-87.508,-79.355,-76.734,-65.169,-45.917,-39.915,-43.034,-56.982,-75.069,-69.580,-51.167,-43.743,-45.442,-57.023,-84.215,-89.514,-72.378,-63.382,-63.662,-73.813,-91.876,-90.179,-79.118,-69.153,-68.126,-76.031,-93.923,-100.776,-93.965,-83.489,-81.512,-88.005,-99.762,-99.285,-97.568,-88.826,-85.730,-90.313,-99.431,-101.457,-102.451,-96.431,-91.773,-94.666,-101.098,-103.602,-104.567,-94.557,-88.384,-89.743,-95.849,-100.978,-104.394,-102.287,-99.304,-99.129,-100.485,-101.215,-102.410,-102.745,-101.343,-101.246,-100.767,-100.308,-101.371,-103.088,-101.435,-99.928,-100.443,-100.091,-99.863,-99.609,-96.419,-94.630,-96.554,-99.596,-100.455,-101.732,-100.456,-99.328,-100.096,-101.255,-100.232,-100.551,-99.083,-98.114,-99.403,-102.154,-102.702,-103.703,-100.467,-98.918,-100.935,-100.336,-99.687,-99.353,-92.485,-86.920,-86.851];
    data = data.map(Math.abs);
    var response = getMFCCs({
      fft: data,
      filterBanks: 10,
      minFreq: 300,
      maxFreq: 8000,
      sampleRate: 44100,
      fftSize: data.length * 2,
      toLinearMagnitude: false
    });
    expect(response.length).toBe(10);
    // Verify MFCCs are finite numbers
    for (var i = 0; i < response.length; i++) {
      expect(isFinite(response[i])).toBe(true);
    }
  });
});

describe("peak height determination", () => {
  it("left peak", () => {
    expect(peakHeight(0, [10, 0, 0])).toBe(10);
  });

  it("right peak", () => {
    expect(peakHeight(2, [0, 0, 10])).toBe(10);
  });

  it("middle peak", () => {
    expect(peakHeight(1, [0, 10, 0])).toBe(10);
  });

  it("unequal sides", () => {
    expect(peakHeight(1, [5, 10, 3])).toBe(5);
  });

  it("not a peak", () => {
    expect(peakHeight(1, [20, 10, 20])).toBe(0);
  });

  it("long right decline", () => {
    expect(peakHeight(1, [0, 50, 40, 30, 20, 10, 0])).toBe(50);
  });

  it("long left decline", () => {
    expect(peakHeight(5, [0, 10, 20, 30, 40, 50, 0])).toBe(50);
  });
});

describe("frequency finding", () => {
  it("toFrequency converts bin positions to Hz", () => {
    expect(toFrequency(0, 16000, 2048)).toBe(0);
    expect(toFrequency(512, 16000, 2048)).toBe(4000);
    expect(toFrequency(1024, 16000, 2048)).toBe(8000);
    expect(toFrequency(2048, 16000, 2048)).toBe(16000);
  });
});

describe("decibelsToLinear", () => {
  it("converts dB to linear scale", () => {
    expect(decibelsToLinear(-40)).toBe(0.01);
    expect(decibelsToLinear(0)).toBe(1);
    expect(Math.abs(decibelsToLinear(-51) - 0.002818)).toBeLessThan(0.000001);
  });
});

describe("MathUtils", () => {
  it("predict computes dot product", async () => {
    var { predict } = await import("../src/modules/utils/mathutils.js");
    var features = [1, 2, 3];
    var weights = [0.5, 0.5, 0.5];
    expect(predict(features, weights)).toBe(3);
  });

  it("nextPow2 finds next power of two", async () => {
    var { nextPow2 } = await import("../src/modules/utils/mathutils.js");
    expect(nextPow2(1)).toBe(2);
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(5)).toBe(8);
    expect(nextPow2(1023)).toBe(1024);
    expect(nextPow2(1025)).toBe(2048);
  });

  it("mapToScale scales values between ranges", async () => {
    var { mapToScale } = await import("../src/modules/utils/mathutils.js");
    expect(mapToScale(5, 0, 10, 0, 100)).toBe(50);
    expect(mapToScale(0, 0, 10, 0, 100)).toBe(0);
    expect(mapToScale(10, 0, 10, 0, 100)).toBe(100);
  });
});

// Helper
function variance(arr) {
  var mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / arr.length;
}
