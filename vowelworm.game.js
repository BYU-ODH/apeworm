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
  
  game.congrats_visible = false;
  
  game.old_circles = [];
  
  /**
   * Represents the threshold in dB that VowelWorm's audio should be at in
   * order to to plot anything.
   * @see {@link isSilent}
   */
  game.silence = -70;

  game.create = function(width, height, bgcolor, element){
    game._stage = new PIXI.Stage(bgcolor);
    game._renderer = PIXI.autoDetectRenderer(width, height);
    game._renderer.render(game._stage);

    var thing = new PIXI.Text("Good job!",{font: "35px sans-serif", fill: "black", align: "center"});
    thing.position.x = 100;
    thing.position.y = 100;
    
    game.congrats = new PIXI.Text("Good job!",{font: "35px sans-serif", fill: "black", align: "center"});
    game.congrats.position.x = 100;
    game.congrats.position.y = 100;
    
   // game._stage.addChild(game.congrats);
    //game._renderer.render(game._stage);
    

        
    try{
      element.appendChild(game._renderer.view);
    }catch(e){
      document.body.appendChild(game._renderer.view);
    }
      
    game.drawVowels();
  };

  game.play = function(element){
    if(!game._stage){
      game.create(game.width, game.height, 0xFFFFFF,element);
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
  
  game.showCongrats = function(){
    game._stage.addChild(game.congrats);
    game._renderer.render(game._stage);
    game.congrats_visible = true;
  };
  
  game.hideCongrats = function(){
    game._stage.removeChild(game.congrats);
    game._renderer.render(game._stage);
    game.congrats_visible = false;
  };
  
  game.drawWorm = function(){
    var coords = getCoords(worm);
    if(coords!==null){

      fadeOldCircles();

      var x = coords.x;
      var y = coords.y;
            
      //The target here is arbitrarily set around 'e'
      var percent = getPercentDistanceFromTwoPoints(x,y,241,272);
      //Make the color difference more extreme
      percent = percent*3;
      var color = getColorFromPercent(percent);      
                        
      if(percent<.25){
        if(!game.congrats_visible){
          game.showCongrats();
        }
      }else{
        if(game.congrats_visible){
          game.hideCongrats();
        }
      }
      
      var graphics = new PIXI.Graphics();
      graphics.beginFill(color,1);
      graphics.drawCircle(x,y,10);

      game.old_circles.push({object:graphics,color:color,x:x,y:y});
      
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

  var fadeOldCircles = function(){

    for(var i=0; i<game.old_circles.length; i++){
      var obj = game.old_circles[i].object;
      var color = game.old_circles[i].color;
      var x = game.old_circles[i].x;
      var y = game.old_circles[i].y;
      
      var red = color >> 16;
      var green = (color >> 8) & 0x00FF;
      var blue = color & 0x0000FF;
      
      
      red = updateColor(red);
      green = updateColor(green);
      blue = updateColor(blue);
      
      color = (red << 16) | (green << 8) | (blue);
      
      if(color===0xFFFFFF){
        obj.endFill();
        game._stage.removeChild(obj);
        game.old_circles.splice(i, 1);
        i--;
      }else{
        obj.beginFill(color,1);
        obj.drawCircle(x,y,10);
        game.old_circles[i].color = color;
      }
    }
  };

  var updateColor = function(color){
    if(color<0xFF){
      color = color + 0x55;
      if(color>0xFF){
        color = 0xFF;
      }
    }
    return color;
  };

});
