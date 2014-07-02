/**
 * Plugin for visualizing Vowel Worm's data.
 * Data is attached to VowelWorm.instance.prototype.draw.
 * Requires PIXI.js
 */
(function(VowelWorm){
  "use strict";

  if(VowelWorm === undefined) {
    throw new Error("No instance of Vowel Worm found. Please include " +
      "'vowelworm.js' before the visualization script.");
  }

  /**
   * The default background color
   * @type number
   * @const
   */
  var BGCOLOR = 0xFFFFFF;

  /**
   * The default color of the axes
   * @type number
   * @const
   */
  var AXES_COLOR = 0x000000;

  /**
   * Indicates how far away each marker on the X axis must be 
   * from the previous one.
   * @type number (in pixels)
   * @const
   */
  var X_AXIS_DISTANCE = 50;

  /**
   * Where the x axis should sit
   * @type number
   * @const
   */
  var Y_POS_OF_X = 0; 
  
  /**
   * How large the tick size of the axes should be
   * @type number (in pixels)
   * @const
   */
  var TICK_SIZE = 5;

  var proto = VowelWorm.instance.prototype;
  var v = proto.draw = {};

  v.worm = proto;

  /**
   * Creates a new instance of a PIXI js stage and returns a canvas element.
   * @param {number} width The desired width of the stage
   * @param {number} height The desired height of the stage
   * @param {number=} bgcolor The desired background color for the element.
   * Defaults to white. Consider using a hex code for this, like 0xFF0000
   *
   * @return {Object} the canvas element to attach to the HTML
   */
  v.create = function create(width, height, bgcolor) {
    if(this._stage) {
      throw new Error("Only one view per VowelWorm.instance allowed.");
    }
    if(bgcolor === undefined || bgcolor === null) {
      bgcolor = BGCOLOR;
    }
    this._stage = new PIXI.Stage(bgcolor);
    this._renderer = PIXI.autoDetectRenderer(width, height);
    this._renderer.render(this._stage);
    return this._renderer.view;
  };

  /**
   * Draws a Hz axis as well as a dB axis on the stage for the current set of
   * data.
   * @param {number=} color The color to set the axes and labels to. Defaults
   * to black;
   */
  v.drawAxes = function drawAxes(color) {
    if(!this._stage) {
      throw new Error("You must call draw.create() before you can draw axes.");
    }

    if(this._axes) {
      var that = this;
      this._axes.forEach(function(o) {
        that.draw._stage.removeChild(o);
      });
    }

    var stage    = this._stage,
        renderer = this._renderer;

    var scale = renderer.width/this.worm.getFFTSize()/2;

    if(color === undefined || color === null) {
      color = AXES_COLOR;
    }

    var axes = this._axes = [];

    var xLabel = new PIXI.Text("kHz");
    xLabel.position.x = 0;
    xLabel.position.y = Y_POS_OF_X;
    stage.addChild(xLabel);
    axes.push(xLabel);
    
    // x Markers
    for(var x = X_AXIS_DISTANCE; x<renderer.width; x+=X_AXIS_DISTANCE) {
      var tick = new PIXI.Graphics();
      tick.lineStyle(1, color);
      tick.moveTo(x, Y_POS_OF_X);
      tick.lineTo(x, TICK_SIZE);
      stage.addChild(tick);
      axes.push(tick);

      var freq = this.worm._toFrequency(x*scale, this.worm.getSampleRate(), this.worm.getFFTSize());
      freq = Math.floor(freq*100)/100;
      var label = new PIXI.Text(freq);
      label.position.x = x;
      label.position.y = TICK_SIZE;
      stage.addChild(label);
      axes.push(label);
    }
  }

}(window.VowelWorm));
