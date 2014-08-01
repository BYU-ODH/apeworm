window.VowelWorm.module('game', function(worm) {  
  var game = this;
  game.width = 700;
  game.height = 500;
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

  game.create = function(width, height, bgcolor){
    game._stage = new PIXI.Stage(bgcolor);
    game._renderer = PIXI.autoDetectRenderer(width, height);
    game._renderer.render(game._stage);
        
    //TODO - Replace a given HTML element instead of just appending the view to the page
    document.body.appendChild(game._renderer.view);
      
    game.drawVowels();
  };

  game.play = function(){
    if(!game._stage){
      game.create(game.width, game.height, 0xFFFFFF);
    }

    game.drawWorm();
    
    window.requestAnimationFrame(game.play.bind(game));    
  };
  
  game.drawVowels = function(){
    var letters = [
      ["e",241.28871891963863,272.35519027188354],
      ["i",189.01833799969594,191.97765003235634],
      ["a",337.6219414250667,357.00896411883406],
      ["o",404.5714404194302,304.96641792056766],
      ["u",432.17314090483404,251.94657762575406]
    ];   
        
    for(var i=0; i<letters.length; i++){      
      var letter = new PIXI.Text(letters[i][0],{font: "35px sans-serif", fill: "black", align: "center"});
      letter.position.x = letters[i][1];
      letter.position.y = letters[i][2];
      
      game._stage.addChild(letter);
    }
    game._renderer.render(game._stage);
  };
  
  game.drawWorm = function(){
    var coords = getCoords(worm);
    if(coords!==null){

      if(game.graphics){
        game._stage.removeChild(game.graphics);
      }

      var x = coords.x;
      var y = coords.y;
      
      //The target here is arbitrarily set around 'e'
      var percent = getPercentDistanceFromTwoPoints(x,y,241,272);
      //Make the color difference more extreme
      percent = percent*3;
      var color = getColorFromPercent(percent);      
      
      var graphics = new PIXI.Graphics();
      graphics.beginFill(color,1);
      graphics.drawCircle(x,y,10);

      game.graphics = graphics;
      
      game._stage.addChild(graphics);
      game._renderer.render(game._stage);
    }  
  };
  
  var getPercentDistanceFromTwoPoints = function(x,y,goal_x,goal_y){
    
    var distance = Math.sqrt(Math.pow((x-goal_x),2) + Math.pow((y-goal_y),2));
    var max_distance = Math.sqrt(Math.pow((0-game.width),2) + Math.pow((0-game.height),2));
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
      minFreq: game.minHz,
      maxFreq: game.maxHz,
      filterBanks: game.fb
    });
    
    if(position.length) {
      var x = position[1];
      var y = position[2];

      // rotate 90 degrees
      var tmpY = y;
      var tmpX = x;
      x = tmpY;
      y = -tmpX;

      var coords = adjustXAndY(x,y);
      return coords;
    }else{
      return null;
    }
  };
  
  var adjustXAndY = function(x,y){
    var x1 = game.x1;
    var x2 = game.x2;
    var y1 = game.y1;
    var y2 = game.y2;
    
    var xStart = x1;
    var xEnd = x2;
    var yStart = y1;
    var yEnd = y2;

    var xDist = game.width/(xEnd-xStart);
    var yDist = game.height/(yEnd-yStart);

    var adjustedX = (x-xStart)*xDist + 20;
    var adjustedY = game.height-(y-yStart)*yDist+20;
    
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

});
