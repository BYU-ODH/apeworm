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
   * How large the tick size of the axes should be
   * @type number (in pixels)
   * @const
   */
  var TICK_SIZE = 5;

  var proto = VowelWorm.instance.prototype;
  var v = proto.draw = {};
  proto.plugins.push(v);

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
   * @private
   * @stub
   */
  v._drawYAxis = function drawYAxis(color) {};

  /**
   * Draws an x axis on the stage
   * @param {number} color The color to draw the axis as
   * @private
   */
  v._drawXAxis = function drawXAxis(color) {
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

    var xLabel = new PIXI.Text("kHz", {font: '10px'});
    xLabel.position.x = 0;
    xLabel.position.y = Y_POS_OF_X;
    stage.addChild(xLabel);
    
    // only show half the FFT size, because there are only half as many bins
    var scale = (this.worm.getFFTSize()/2)/renderer.width;
    
    // x Markers
    for(var x = X_AXIS_DISTANCE; x<renderer.width; x+=X_AXIS_DISTANCE) {
      var tick = new PIXI.Graphics();
      tick.lineStyle(1, color);
      tick.moveTo(x, Y_POS_OF_X);
      tick.lineTo(x, Y_POS_OF_TICK);
      stage.addChild(tick);

      var freq = this.worm._toFrequency(x*scale, this.worm.getSampleRate(), this.worm.getFFTSize());
      freq /= 1000; // convert to kHz
      freq = parseFloat(freq.toFixed(2),10); // round

      var label = new PIXI.Text(freq, {font: '10px'});
      label.position.x = x - (label.width/2); // center it
      label.position.y = Y_POS_OF_TICK-10;
      stage.addChild(label);
    }
  };

  /**
   * Draws a Hz axis as well as a dB axis on the stage for the current set of
   * data.
   * @param {number=} color The color to set the axes and labels to. Defaults
   * to black
   */
  v.drawAxes = function drawAxes(color) {
    if(!this._stage) {
      throw new Error("You must call draw.create() before you can draw axes.");
    }

    if(color === undefined || color === null) {
      color = AXES_COLOR;
    }

    this._drawXAxis(color);
    this._drawYAxis(color);

    this._renderer.render(this._stage);
  };
  
  v.drawDataLines = function(){

    var makeValuesGraphable = function(values){
        for(var i=0; i<values.length; i++){
            //Invert the number to graph on the upside grid of the canvas
            values[i] = values[i]*-1;
        }
    };

    var stage    = this._stage;
    var renderer = this._renderer;     

    var values = new Float32Array(this.worm.getFFTSize()/2);
    this.worm._analyzer.getFloatFrequencyData(values);

    var smoothed_values = this.worm.hann(values, 75).slice(32);

    var COLOR_RED = 16711680;
    var COLOR_BLACK = 0;

    makeValuesGraphable(values);
    makeValuesGraphable(smoothed_values);
   
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
    this.peaks = this.drawPeaks(this.worm.getFormants(),COLOR_BLACK);
        
    console.log(this.worm.getFormants());

    renderer.render(stage);
  };
  
  v.drawLine = function(values,color,point_distance){
    var stage = this._stage;
    var renderer = this._renderer;
    
    var line = new PIXI.Graphics();
    line.lineStyle(1,color);
    line.moveTo(0,values[0]);
    
    for(var i=0; i<values.length; i++){
        line.lineTo(i*point_distance,values[i]);
        if(i==512){
            line.moveTo(i*point_distance,0);
            line.lineTo(i*point_distance,renderer.height);
            line.moveTo(i*point_distance,values[i]);
        }else if(i==256){
                        line.moveTo(i*point_distance,0);
            line.lineTo(i*point_distance,renderer.height);
            line.moveTo(i*point_distance,values[i]);
        }
    }
    
    stage.addChild(line);
    
    return line;
  };

  v.hertzToPixels = function(hz){
      return (this._renderer.width*hz)/(this.worm.getSampleRate()/2);
  };

  v.drawPeaks = function(values,color){
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

}(window.VowelWorm));
