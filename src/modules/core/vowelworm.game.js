/**
 * @param {Object=} options Configuration options
 * @param {(VowelWorm.instance|VowelWorm.instance[])} options.worms Any
 * VowelWorm instances to begin with
 * @param {number=700} options.width The width of the game board
 * @param {number=500} options.height The height of the game board
 * @param {number=0xFFFFFF} options.background The background color of the game
 * @param {HTMLElement=document.body} options.element What to append the graph to
 * @type VowelWorm.Game
 * @constructor
 */
window.VowelWorm.Game = function( options ) {
  "use strict";

  var game = this;
  game.width = options.width || 700;
  game.height = options.height || 500;
  game.x1 = -1;
  game.x2 = 2;
  game.y1 = -1;
  game.y2 = 3;
  
  game.minHz = 300;
  game.maxHz = 8000;
  game.fb = 10;

  /**
   * Represents the threshold in dB that VowelWorm's audio should be at in
   * order to to plot anything.
   * @see {@link isSilent}
   */
  game.silence = -70;

  /**
   * Used for storing frequency data.
   * Chrome does not adequately garbage collect typed arrays, so this shouldn't
   * be created in a repeatedly-called function--otherwise we'll run up memory
   * pretty fast.
   *
   * TODO - the VowelWorm core code needs to handle this, not this game module
   */ 
  var buffer = new Float32Array(1024);

  /**
   * Contains all instances of worms for this game
   * @type Array.<Object>
   */
  var worms = [];

  /**
   * You can change this with game.ipa = true/false
   * @type boolean
   */
  var ipaEnabled = true;
 
  var ipaChart = new PIXI.DisplayObjectContainer();  

  game.play = function(){
    game.drawWorm();
    window.requestAnimationFrame(game.play);
  };

  /**
   * Inserts a worm into the ever-increasing frenzy of VowelWorm.
   * @param {VowelWorm.instance} worm
   */
  game.addWorm = function(worm) {
   var container = {};
   container.worm = worm;
   container.circles = [];
   worms.push(container);
  };

  game.drawWorm = function(){
    var current_color = 0x00FF00;
    worms.forEach(function(container) {
      var worm = container.worm,
          circles = container.circles;

      var coords = getCoords(worm);

      if(coords!==null){
        var doRender = true;
        
        var x = coords.x;
        var y = coords.y;

        var circle = new PIXI.Sprite.fromImage("src/modules/core/circle.png");
        circle.position.x = x;
        circle.position.y = y;
        circle.tint = current_color;

        circles.push(circle);
        
        game._stage.addChild(circle);
      }
      current_color = getNextColor(current_color);  
    });
    fadeOldCircles();
    game._renderer.render(game._stage);
  };

  Object.defineProperties(game, {
    ipa: {
      enumerable: true,
      get: function() {
        return ipaEnabled;
      },
      set: function(val) {
        var bool = !!val;
        if(ipaEnabled === bool) {
          return;
        }
        ipaEnabled = bool;
        
        if(ipaEnabled) {
          game._stage.addChild(ipaChart);
        }
        else
        {
          game._stage.removeChild(ipaChart);
        }
        window.requestAnimationFrame(game._renderer.render);
      }
    }
  });
  
  var getCoords = function(worm){
    worm._analyzer.getFloatFrequencyData(buffer);

    if(isSilent(buffer)) {
      return null;
    }

    var position = worm.getMFCCs({
      minFreq: game.minHz,
      maxFreq: game.maxHz,
      filterBanks: game.fb
    });
    
    if(position.length) {
      var x = position[1];
      var y = position[2];

      //Pass in coords flipped 90 degrees
      var coords = adjustXAndY(y,-x);
      return coords;
    }else{
      return null;
    }
  };
  
  var adjustXAndY = function(x,y){    
    var xStart = game.x1;
    var xEnd = game.x2;
    var yStart = game.y1;
    var yEnd = game.y2;

    var xDist = game.width/(xEnd-xStart);
    var yDist = game.height/(yEnd-yStart);

    var adjustedX = (x-xStart)*xDist;
    var adjustedY = game.height-(y-yStart)*yDist;
    
    return {x:adjustedX,y:adjustedY};
  };

  /**
   * Determines whether, for plotting purposes, the audio data is silent or not
   * Compares against the threshold given for {@link game.silence}.
   * @param {Array.<number>} data - An array containing dB values
   * @return {boolean} Whether or not the data is essentially 'silent'
   */
  var isSilent = function(data) {
    for(var i = 0; i<data.length; i++) {
      if(data[i] > game.silence) {
        return false;
      }
    }
    return true;
  };

  var fadeOldCircles = function(){
    worms.forEach(function(container) {
      var circles = container.circles;
      for(var i=0; i<circles.length; i++){
        var obj = circles[i];
        
        obj.alpha = obj.alpha - .2;
        
        if(obj.alpha <= 0){
          game._stage.removeChild(obj);
          circles.splice(i, 1);
          i--;
        }
      }
    });
  };

  //Color Functions
  //Converts an integer representing a color to an integer representing a color 45 degrees away
  var getNextColor = function(old_color){
    if(typeof old_color == 'number'){
      old_color = old_color.toString(16);
      //Pad with 0's if necessary
      while(old_color.length<6){
        old_color = "0" + old_color;
      }
    }

    old_color = new tinycolor(old_color);
    var new_color = old_color.spin(45).toHex();
    new_color = parseInt(new_color,16);
    return new_color;
  };
 
  /**
   * Fills the IPA Chart. A constructor helper method.
   */
  var drawVowels = function() {
    if(!ipaChart.children.length) {
      var letters = [
        ["e",221.28871891963863,252.35519027188354],
        ["i",169.01833799969594,171.97765003235634],
        ["a",317.6219414250667,337.00896411883406],
        ["o",384.5714404194302,284.96641792056766],
        ["u",412.17314090483404,231.94657762575406]
      ];
      for(var i=0; i<letters.length; i++){
        var letter = new PIXI.Text(letters[i][0],{font: "35px sans-serif", fill: "black", align: "center"});
        letter.position.x = letters[i][1];
        letter.position.y = letters[i][2];
        ipaChart.addChild(letter);
      }
    }
  };

  // CREATE GAME
  var bgColor = options.background !== undefined ? options.background : 0xFFFFFF;
  game._stage = new PIXI.Stage(bgColor);
  game._renderer = PIXI.autoDetectRenderer(game.width, game.height);
  try{
    options.element.appendChild(game._renderer.view);
  }catch(e){
    document.body.appendChild(game._renderer.view);
  }
  drawVowels();
  if(ipaEnabled) {
    game._stage.addChild(ipaChart);
  }
  
  if(options.worms) {
    if(options.worms instanceof Array) {
      options.worms.forEach(function(worm) {
        game.addWorm(worm);
      });
    }
    else
    {
      game.addWorm(options.worms);
    }
  }
  game._renderer.render(game._stage);
  game.play();
};
