
//passes an array as param and plots it
//passes peaksArray as param
function plotPoints(y, peaks) {
	var stage = new PIXI.Stage(0xFFFFFF, true);
	//stage.setInteractive(true);
	var renderer = PIXI.autoDetectRenderer(1024, 550);
	//renderer.view.style.display = "block";
	document.body.appendChild(renderer.view);
		
	var graphics = new PIXI.Graphics();
	graphics.lineStyle(1, 0x000000, 1);
	//graphics.beginFill(0xFF700B, 1);
	graphics.moveTo(0,550-2*y[0]);
	//graphics.lineTo(300, 50);
	
	for(var i = 1; i < y.length; i++) {
		graphics.lineTo(i, 550-2*y[i]);
	}
	//graphics.endFill();
	graphics.lineStyle(1, 0x990000, 1);
	graphics.beginFill(0x990000,1);

	for(var i = 0; i < peaks.length; i++) {
		var xVal = peaks[i];
		var yVal = y[peaks[i]];
		graphics.drawCircle(xVal, 550-2*yVal,3);
		var text = new PIXI.Text(xVal + ", " + yVal.toFixed(2), {font: "Times New Roman 12px", align: "center"});
		var extraSpace = 20;
		text.position.x = xVal - extraSpace;
		text.position.y = 550 - 2*(yVal + extraSpace);
		stage.addChild(text);
	}
	graphics.endFill();
	stage.addChild(graphics);
	renderer.render(stage);
	
	
}

