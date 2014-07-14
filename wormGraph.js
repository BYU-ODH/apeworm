//var xStart = 5;
//var xEnd = 15;
//var yStart = 0;
//var yEnd = 20;

function makeGraph(stage, renderer, width, height, x1, x2, y1, y2) {
	//var stage = new PIXI.Stage(0xFFFFFF, true);
	//var renderer = new PIXI.autoDetectRenderer(width+40, height+40);
	document.body.appendChild(renderer.view);

	//var xDist = width/9;
	//xDist = xDist.toFixed(2);
	//var yDist = height/14;
	//yDist = yDist.toFixed(2);

	
	var xStart = x1;
	var xEnd = x2;
	var yStart = y1;
	var yEnd = y2;


	var graphics = new PIXI.Graphics();
	graphics.lineStyle(1,0x000000,1);
	graphics.moveTo(20,20);
	graphics.lineTo(20,20+height);
	graphics.lineTo(20+width,20+height);
	graphics.lineTo(20+width,20);
	graphics.lineTo(20,20);
	
	stage.addChild(graphics);

	var leftBot = new PIXI.Text(xStart + ", " + yStart, {font: "12px"});
	leftBot.position.x = 10;
	leftBot.position.y = 25+height;	

	var leftTop = new PIXI.Text(xStart + ", " + yEnd, {font: "12px"});
	leftTop.position.x = 10;
	leftTop.position.y = 5;

	var rightBot = new PIXI.Text(xEnd + ", " + yStart, {font: "12px"});
	rightBot.position.x = 10+width;
	rightBot.position.y = 25+height;

	var rightTop = new PIXI.Text(xEnd + ", " + yEnd, {font: "12px"});
	rightTop.position.x = 10+width;
	rightTop.position.y = 5;

	stage.addChild(leftBot);
	stage.addChild(leftTop);
	stage.addChild(rightBot);
	stage.addChild(rightTop);

	renderer.render(stage);
}

var makeWorm = (function(){
	var graphics = null;

	return function make(x, y, stage, renderer, width, height, x1, x2, y1, y2) {
		
		var xStart = x1;
		var xEnd = x2;
		var yStart = y1;
		var yEnd = y2;
		//deletes previous worm
		if(graphics) {
			stage.removeChild(graphics);
		}

		var xDist = width/(xEnd-xStart);
		var yDist = height/(yEnd-yStart);
		
				

		var adjustedX = (x-xStart)*xDist + 20;
		var adjustedY = height-(y-yStart)*yDist+20;
		graphics = new PIXI.Graphics();
		graphics.beginFill(0x99000,1);
		graphics.drawCircle(adjustedX,adjustedY ,10);
		stage.addChild(graphics);
		renderer.render(stage);
	}
})();
