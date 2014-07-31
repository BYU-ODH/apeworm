window.VowelWorm.module('game', function(worm) {
  this.width = 700;
  this.height = 500;
  this.x1 = -1;
  this.x2 = 2;
  this.y1 = -1;
  this.y2 = 3;

  this.create = function(width, height, bgcolor){
    this._stage = new PIXI.Stage(bgcolor);
    this._renderer = PIXI.autoDetectRenderer(width, height);
    this._renderer.render(this._stage);
    
    //TODO - Replace a given HTML element instead of just appending the view to the page
    document.body.appendChild(this._renderer.view);

  };

  //TODO - Access the worm object without passing it around
  this.play = function(worm){
    if(!this._stage){
      this.create(this.width, this.height, 0xFFFFFF);
    }

    this.drawWorm(worm);
    this.drawVowels(worm);
    
  };
  
  this.drawVowels = function(worm){
        
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
  
  this.drawWorm = function(worm){
    var coords = getCoords(worm);
    if(coords!==null){

      if(this.graphics){
        this._stage.removeChild(this.graphics);
      }

      x = coords.x;
      y = coords.y;
      
      var percent = getPercentDistanceFromTwoPoints(x,y,241,272);      
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
    var green = percent*0xFF;
    var red = 0xFF-green;
    
    green = Math.round(green);
    red = Math.round(red);
    
    var color_string = "";
    if(red==0){
      color_string = color_string + "00";
    }else{
      color_string = color_string + red.toString(16);
    }
    
    if(green==0){
      color_string = color_string + "00";
    }else{
      color_string = color_string + green.toString(16);
    }
    
    var color_string = color_string + "00";
    
    
    return parseInt(color_string, 16);
  };
  
  var getCoords = function(worm){
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

});
