/**
 * Plugin for visualizing Vowel Worm's data.
 * Data is attached to VowelWorm.instance.prototype.draw.
 * Requires PIXI.js
 * @namespace draw
 * @memberof VowelWorm.instance.prototype
 */
window.VowelWorm.module('draw', function createDrawModule(worm) {
  "use strict";


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
   * Indicates how far away, in pixels, each marker on the X axis must be 
   * from the previous one.
   * @type number
   * @const
   */
  var X_AXIS_DISTANCE = 50;
  
  /**
   * Indicates how far away, in pixels, each marker on the Y axis must be 
   * from the previous one.
   * @type number
   * @const
   */
  var Y_AXIS_DISTANCE = 50;
  
  /**
   * How large, in pixels, the tick size of the axes should be
   * @type number
   * @const
   */
  var TICK_SIZE = 5;

  /**
   * The font size, in pixels, for the labels
   * @type number
   * @const
   */
  var LABEL_FONT_SIZE = 10;

  /**
   * Set the default minimum dB value for y-axis scaling
   * @memberof VowelWorm.instance.draw
   * @type number
   */
  this.minDecibels = -250;

  /**
   * Set the default minimum dB value for y-axis scaling
   * @memberof VowelWorm.instance.draw
   * @type number
   */
  this.maxDecibels = -30;

  /**
   * Creates a new instance of a PIXI js stage and returns a canvas element.
   * @param {number} width The desired width of the stage
   * @param {number} height The desired height of the stage
   * @param {number=} bgcolor The desired background color for the element.
   * Defaults to white. Consider using a hex code for this, like 0xFF0000
   *
   * @return {Object} the canvas element to attach to the HTML
   * @memberof VowelWorm.instance.draw
   */
  this.create = function(width, height, bgcolor) {
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
   * Draws a y axis on the stage
   * @private
   * @memberof VowelWorm.instance.draw
   */
  this._drawYAxis = function(color) {
    var axis = new PIXI.DisplayObjectContainer();
    this._axes.push(axis);

    var max      = this.maxDecibels,
        min      = this.minDecibels,
        renderer = this._renderer,
        stage    = this._stage;

    var yLabel = new PIXI.Text("db", {
      font: LABEL_FONT_SIZE + 'px',
      color: color
    });
    yLabel.position.x = 0;
    yLabel.position.y = 0;
    
    var scale = (min-max)/renderer.height; // becomes increasingly negative
    var db_offset = max;

    var x_offset = 5;

    for(var y = Y_AXIS_DISTANCE; y<=renderer.height; y+=Y_AXIS_DISTANCE) {
      var db = y*scale + db_offset;
      var db_rounded = Math.round(db*10)/10; // nearest 0.1

      var label = new PIXI.Text(db_rounded, {
        font: LABEL_FONT_SIZE + 'px',
        color: color
      });
      label.position.x = x_offset;
      label.position.y = y - label.height/2; // center it
      axis.addChild(label);
    }
    
    axis.addChild(yLabel);
    stage.addChild(axis);
  };

  /**
   * Draws an x axis on the stage
   * @param {number} color The color to draw the axis as
   * @private
   * @memberof VowelWorm.instance.draw
   */
  this._drawXAxis = function(color) {
    var axis = new PIXI.DisplayObjectContainer();
    this._axes.push(axis);

    var renderer = this._renderer,
        stage    = this._stage;

    /**
     * Where the x axis should sit
     * @type number
     * @const
     */
    var Y_POS_OF_X = renderer.height - 10;
    
    /**
     * Where the tick should extend to
     * @type number
     * @const
     */
    var Y_POS_OF_TICK = Y_POS_OF_X - TICK_SIZE;

    var xLabel = new PIXI.Text("kHz", {
      font: LABEL_FONT_SIZE + 'px',
      color: color
    });
    xLabel.position.x = X_AXIS_DISTANCE - xLabel.width/2;
    xLabel.position.y = Y_POS_OF_X;
    axis.addChild(xLabel);
    
    // only show half the FFT size, because there are only half as many bins
    var scale = (worm.getFFTSize()/2)/renderer.width;
    
    // x Markers
    for(var x = X_AXIS_DISTANCE; x<renderer.width; x+=X_AXIS_DISTANCE) {
      var tick = new PIXI.Graphics();
      tick.lineStyle(1, color);
      tick.moveTo(x, Y_POS_OF_X);
      tick.lineTo(x, Y_POS_OF_TICK);
      axis.addChild(tick);

      var freq = worm._toFrequency(x*scale, worm.getSampleRate(), worm.getFFTSize());
      freq /= 1000; // convert to kHz
      freq = parseFloat(freq.toFixed(2)); // round

      var label = new PIXI.Text(freq, {
        font: LABEL_FONT_SIZE + 'px',
        color: color
      });
      label.position.x = x - (label.width/2); // center it
      label.position.y = Y_POS_OF_TICK-10;
      axis.addChild(label);
      stage.addChild(axis);
    }
  };

  /**
   * Draws a Hz axis as well as a dB axis on the stage for the current set of
   * data.
   * @param {number=} color The color to set the axes and labels to. Defaults
   * to black
   * @memberof VowelWorm.instance.draw
   */
  this.drawAxes = function(color) {
    if(!this._stage) {
      throw new Error("You must call draw.create() before you can draw axes.");
    }

    if(color === undefined || color === null) {
      color = AXES_COLOR;
    }

    this._axes = this._axes || [];
    var axis = null;

    while(axis = this._axes.pop()) {
      this._stage.removeChild(axis);
    }

    this._drawXAxis(color);
    this._drawYAxis(color);

    this._renderer.render(this._stage);
  };
  
  this.makeValuesGraphable = function(values){
    for(var i=0; i<values.length; i++){         
        values[i] = this.decibelsToPixels(values[i]);
    }
  };
  
  this.decibelsToPixels = function(db){
      var height = this._renderer.height;
      var min = this.minDecibels;
      var max = this.maxDecibels;
      
      var b = (height/(min-max))*max;            
      var y = ((height/(min-max))*db)-b;
      
      return y;      
  
  };
  
  this.drawDataLines = function(){

    var stage    = this._stage;
    var renderer = this._renderer;     

    var values = worm.getFFT();

    var smoothed_values = worm.hann(values, 75).slice(window.VowelWorm.HANNING_SHIFT)

    var COLOR_RED = 16711680;
    var COLOR_BLACK = 0;

    this.makeValuesGraphable(values);
    this.makeValuesGraphable(smoothed_values);
   
    var point_distance = renderer.width/values.length;

    //Raw Line
    if(this.raw_line){
        stage.removeChild(this.raw_line);
    }
    this.raw_line = this.drawLine(values,COLOR_BLACK,point_distance);

    //Smoothed Line
    if(this.smoothed_line){
        stage.removeChild(this.smoothed_line);
    }
    this.smoothed_line = this.drawLine(smoothed_values,COLOR_RED,point_distance);

    //Peaks
    if(this.peaks){
        stage.removeChild(this.peaks);
    }
    this.peaks = this.drawPeaks(worm.getFormants(),COLOR_BLACK);
        
    renderer.render(stage);
  };
  
  this.drawLine = function(values,color,point_distance){
    var stage = this._stage;
    
    var line = new PIXI.Graphics();
    line.lineStyle(1,color);
    line.moveTo(0,values[0]);
    
    for(var i=0; i<values.length; i++){
        line.lineTo(i*point_distance,values[i]);
    }
    
    stage.addChild(line);
    
    return line;
  };

  this.hertzToPixels = function(hz){
      return (this._renderer.width*hz)/(worm.getSampleRate()/2);
  };

  this.drawPeaks = function(values,color){
      var stage = this._stage;
      var renderer = this._renderer;
      
      var peaks = new PIXI.Graphics();
      peaks.lineStyle(1,color);
      
      for(var i=0; i<values.length; i++){
          peaks.moveTo(this.hertzToPixels(values[i]),0);
          peaks.lineTo(this.hertzToPixels(values[i]),renderer.height);
      }

      stage.addChild(peaks);
      
      return peaks;
  };

});
