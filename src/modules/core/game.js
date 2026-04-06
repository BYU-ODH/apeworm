import { MAPPING_METHODS, loadRegressionWeights } from "../../vowelworm.js";

const BACKNESS_MIN = 0;
const BACKNESS_MAX = 4;
const HEIGHT_MIN = 0;
const HEIGHT_MAX = 3;
const DEFAULT_SILENCE = -70;
const DOT_RADIUS = 10;
const FADE_STEP = 0.2;

export class Game {
  constructor(options = {}) {
    this.width = options.width || 700;
    this.height = options.height || 500;
    this.margin = 50;

    this.x1 = options.x1 || BACKNESS_MIN;
    this.x2 = options.x2 || BACKNESS_MAX;
    this.y1 = options.y1 || HEIGHT_MIN;
    this.y2 = options.y2 || HEIGHT_MAX;

    this.minHz = options.minHz || 0;
    this.maxHz = options.maxHz || 8000;
    this.silence = options.silence || DEFAULT_SILENCE;
    this.normalizeMFCCs = options.normalizeMFCCs !== undefined ? options.normalizeMFCCs : true;
    this.smoothingConstant = options.smoothingConstant || 5;

    this._worms = [];
    this._ipaEnabled = true;
    this._chartImage = null;
    this._rafId = null;

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width + this.margin * 2;
    this.canvas.height = this.height + this.margin * 2;
    this.ctx = this.canvas.getContext("2d");

    var element = options.element || document.body;
    element.appendChild(this.canvas);

    // Load IPA chart overlay
    this._loadChartImage();

    // Load regression weights
    loadRegressionWeights(this.normalizeMFCCs);
  }

  _loadChartImage() {
    var that = this;
    var img = new Image();
    img.onload = function() {
      that._chartImage = img;
    };
    img.src = "plot2.png";
  }

  addWorm(worm) {
    // Sync worm config with game settings
    worm.minHz = this.minHz;
    worm.maxHz = this.maxHz;
    worm.normalizeMFCCs = this.normalizeMFCCs;
    worm.smoothingConstant = this.smoothingConstant;
    this._worms.push({
      worm: worm,
      circles: [],
      hue: 120 + this._worms.length * 45
    });
  }

  play() {
    var that = this;
    function frame() {
      that._drawFrame();
      that._rafId = requestAnimationFrame(frame);
    }
    this._rafId = requestAnimationFrame(frame);
  }

  stop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _drawFrame() {
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // IPA chart background
    if (this._ipaEnabled && this._chartImage) {
      ctx.drawImage(this._chartImage, this.margin, this.margin, this.width, this.height);
    }

    // Draw each worm's trail
    for (var wi = 0; wi < this._worms.length; wi++) {
      var container = this._worms[wi];
      var worm = container.worm;
      var circles = container.circles;
      var hue = container.hue;

      var coords = this._getCoords(worm);
      if (coords) {
        circles.push({ x: coords.x, y: coords.y, alpha: 1.0 });
      }

      // Draw and fade circles
      for (var i = circles.length - 1; i >= 0; i--) {
        var c = circles[i];
        ctx.beginPath();
        ctx.arc(c.x, c.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + hue + ", 100%, 50%, " + c.alpha + ")";
        ctx.fill();

        c.alpha -= FADE_STEP;
        if (c.alpha <= 0) {
          circles.splice(i, 1);
        }
      }
    }
  }

  _getCoords(worm) {
    var buffer = worm.getFFT();

    if (this._isSilent(buffer)) {
      worm.resetPosition();
      return null;
    }

    var position = worm.getPosition();
    if (position && position.length >= 2) {
      return this._transformToXAndY(position[0], position[1]);
    }
    return null;
  }

  _transformToXAndY(backness, height) {
    var xDist = this.width / (this.x2 - this.x1);
    var yDist = this.height / (this.y2 - this.y1);

    return {
      x: (backness - this.x1) * xDist + this.margin,
      y: this.height - (height - this.y1) * yDist + this.margin
    };
  }

  _isSilent(data) {
    for (var i = 0; i < data.length; i++) {
      if (data[i] > this.silence) {
        return false;
      }
    }
    return true;
  }
}
