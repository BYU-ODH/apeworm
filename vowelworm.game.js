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
    //this.ipa
  
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
      
      var graphics = new PIXI.Graphics();
      graphics.beginFill(0x99000,1);
      graphics.drawCircle(x,y,10);
      this.graphics = graphics;
      
      this._stage.addChild(graphics);
      this._renderer.render(this._stage);
    }  
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
