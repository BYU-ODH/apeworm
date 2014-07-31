window.VowelWorm.module('game', function(worm) {
  var game = this;
  this.width = 700;
  this.height = 500;
  this.x1 = -1;
  this.x2 = 2;
  this.y1 = -1;
  this.y2 = 3;
  
  /**
   * Represents the threshold in dB that VowelWorm's audio should be at in
   * order to to plot anything.
   * @see {@link isSilent}
   */
  this.silence = -70;

  this.create = function(width, height, bgcolor){
    this._stage = new PIXI.Stage(bgcolor);
    this._renderer = PIXI.autoDetectRenderer(width, height);
    this._renderer.render(this._stage);
    
    game.drawVowels();
    
    //TODO - Replace a given HTML element instead of just appending the view to the page
    document.body.appendChild(this._renderer.view);

  };

  this.play = function(){
    if(!game._stage){
      game.create(this.width, this.height, 0xFFFFFF);
    }

    game.drawWorm();
    
    window.requestAnimationFrame(this.play.bind(this));    
  };
  
  this.drawVowels = function(){
        
    var letters = [
      ["e",-0.05161977605869161,0.9811584778249319],
      ["i",-0.2756356942870174,1.6241787997411496],
      ["a",0.3612368918217143,0.30392828704932756],
      ["o",0.6481633160832724,0.7202686566354586],
      ["u",0.7664563181635743,1.1444273789939676]
    ];   
        
    for(var i=0; i<letters.length; i++){
      var coords = adjustXAndY(letters[i][1],letters[i][2]);
      
      var letter = new PIXI.Text(letters[i][0],{font: "35px sans-serif", fill: "black", align: "center"});
      letter.position.x = coords.x;
      letter.position.y = coords.y;
      
      this._stage.addChild(letter);
    }

    this._renderer.render(this._stage);
    
  };
  
  this.drawWorm = function(){
    var coords = getCoords(worm);
    if(coords!==null){

      if(this.graphics){
        this._stage.removeChild(this.graphics);
      }

      x = coords.x;
      y = coords.y;
      
      //The target here is arbitrarily set around 'e'
      var percent = getPercentDistanceFromTwoPoints(x,y,241,272);
      //Make the color difference more extreme
      percent = percent*3;
      var color = getColorFromPercent(percent);      
      
      var graphics = new PIXI.Graphics();
      graphics.beginFill(color,1);
      graphics.drawCircle(x,y,10);

      this.graphics = graphics;
      
      this._stage.addChild(graphics);
      this._renderer.render(this._stage);
    }  
  };
  
  var getPercentDistanceFromTwoPoints = function(x,y,goal_x,goal_y){
    
    var distance = Math.sqrt(Math.pow((x-goal_x),2) + Math.pow((y-goal_y),2));
    var max_distance = Math.sqrt(Math.pow((0-width),2) + Math.pow((0-height),2));
    var percent = distance/max_distance;
    
    return percent;
  };
  
  var getColorFromPercent = function(percent){
    percent = Math.round(percent*100)/100;
    
    if(percent<0){percent=0;}
    if(percent>1){percent=1;}
    
    var red = percent*0xFF;
    var green = 0xFF-red;
    
    green = Math.round(green);
    red = Math.round(red);
    
    red = red << 16;
    green = green << 8;
        
    return red | green;

  };
  
  var getCoords = function(){
    var data = new Float32Array(worm.getFFTSize()/2);
    worm._analyzer.getFloatFrequencyData(data);

    if(isSilent(data)) {
      return null;
    }

    var position = worm.getMFCCs({
      minFreq: minHz,
      maxFreq: maxHz,
      filterBanks: fb
    });
    
    if(position.length) {
      x = position[1];
      y = position[2];

      // rotate 90 degrees
      var tmpY = y;
      var tmpX = x;
      x = tmpY;
      y = -tmpX;

      coords = adjustXAndY(x,y);
      return coords;
    }else{
      return null;
    }
  };
  
  var adjustXAndY = function(x,y){
    var x1 = this.x1;
    var x2 = this.x2;
    var y1 = this.y1;
    var y2 = this.y2;
    
    var xStart = x1;
    var xEnd = x2;
    var yStart = y1;
    var yEnd = y2;

    var xDist = this.width/(xEnd-xStart);
    var yDist = this.height/(yEnd-yStart);

    var adjustedX = (x-xStart)*xDist + 20;
    var adjustedY = this.height-(y-yStart)*yDist+20;
    
    return {x:adjustedX,y:adjustedY};
  };

  /**
   * Determines whether, for plotting purposes, the audio data is silent or not
   * Compares against the threshold given for {@link this.silence}.
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

});
