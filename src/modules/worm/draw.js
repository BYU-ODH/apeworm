/**
 * FFT spectrum draw module using Canvas 2D.
 * Renders frequency-domain data with optional axes, labels, and peak markers.
 */

const AXIS_COLOR = "#333333";
const SPECTRUM_COLOR = "#3366cc";
const PEAK_COLOR = "#cc3333";
const LABEL_FONT = "11px sans-serif";
const DEFAULT_WIDTH = 700;
const DEFAULT_HEIGHT = 300;

export class DrawModule {
  constructor(worm, options = {}) {
    this.worm = worm;
    this.width = options.width || DEFAULT_WIDTH;
    this.height = options.height || DEFAULT_HEIGHT;
    this.showAxes = options.showAxes !== undefined ? options.showAxes : true;
    this.showPeaks = options.showPeaks !== undefined ? options.showPeaks : false;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");

    var element = options.element || document.body;
    element.appendChild(this.canvas);
  }

  draw() {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var buffer = this.worm.getFFT();
    var sampleRate = this.worm.getSampleRate();
    var fftSize = this.worm.getFFTSize();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    if (!buffer || buffer.length === 0) return;

    // Map FFT bins to pixel positions
    var binCount = buffer.length;
    var barWidth = w / binCount;

    // Draw spectrum
    ctx.strokeStyle = SPECTRUM_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < binCount; i++) {
      var x = i * barWidth;
      // Map dB range [-140, 0] to canvas height
      var magnitude = Math.max(buffer[i], -140);
      var y = h - ((magnitude + 140) / 140) * h;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw axes
    if (this.showAxes) {
      this._drawAxes(buffer, sampleRate, fftSize);
    }
  }

  _drawAxes(buffer, sampleRate, fftSize) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;

    ctx.strokeStyle = AXIS_COLOR;
    ctx.fillStyle = AXIS_COLOR;
    ctx.font = LABEL_FONT;
    ctx.lineWidth = 1;

    // Y axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, h);
    ctx.stroke();

    // X axis
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.stroke();

    // Frequency labels along X axis
    var maxFreq = sampleRate / 2;
    var freqSteps = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
    for (var fi = 0; fi < freqSteps.length; fi++) {
      var freq = freqSteps[fi];
      if (freq > maxFreq) break;
      var x = (freq / maxFreq) * w;
      ctx.fillText(freq / 1000 + "kHz", x - 15, h - 5);
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - 5);
      ctx.stroke();
    }

    // dB labels along Y axis
    var dbValues = [-120, -100, -80, -60, -40, -20, 0];
    for (var di = 0; di < dbValues.length; di++) {
      var db = dbValues[di];
      var y = h - ((db + 140) / 140) * h;
      ctx.fillText(db + "dB", 5, y + 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(5, y);
      ctx.stroke();
    }
  }
}
