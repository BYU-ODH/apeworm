console.log("worm.js loaded");
var segmentOpacity = .7;
var fadeDuration = 500;//1750
var radius = 15;

var x = 100;
var y = 100;
var direction = 1;
var index = 0;

var svgID;
var parentID;

var xmax;
var ymax;



function removeSVG(id)
{
	var element = document.getElementById(id);
	element.parentNode.removeChild(element);
}

function addSegment(x1, y1, id){
	var cir = document.createElementNS("http://www.w3.org/2000/svg","circle");
	$(cir).attr({id:id, fill:"blue", cx:x1, cy:y1, r:"5%", opacity: segmentOpacity});
	$("#tapewormSVG").append(cir);


	//$("#vowelworm").html($("#vowelworm").html());  //refreshes svg
	//$(rect).attr({height:20});


	$(cir).animate({tabIndex: 0},
		{
		  duration: fadeDuration,
		  step: function (now, fx)
			 {
				$(this).attr('r', radius - Math.round(radius * fx.pos));
                                //console.log($(this).attr('opacity') + " becomes " + (segmentOpacity - (segmentOpacity * fx.pos)));
				$(this).attr('opacity', segmentOpacity - (segmentOpacity * fx.pos));
				// .attr('stroke', 'aqua')  Need color transistion helper to make this happen
				$(this).attr('stroke-width', 3 + Math.round(7 * fx.pos));
				//$(this).attr('fill', "blue");
                                //$("#" + parentID).html($("#" + parentID).html());
                                //console.log($(this).attr("r"));
			 },
		  complete:function(){
				removeSVG($(this).attr("id"));
			 }
		}
	);
}

function setWormTarget(target)
{
    svgID = target;
    xmax = $("#"+svgID).attr("width");
    ymax = $("#"+svgID).attr("height");
    radius = ymax * .05;
}

function simulate(){
    setInterval(function()
	{//Simulates high volume of data in a worm-like pattern
		var change = Math.floor(Math.random() * 5) + 1;
		if(change == 2){
			direction = Math.floor(Math.random() * 8);
		}
		var distance = Math.floor(Math.random() * 20) + 10;
		
		if(direction == 0) y = y - distance;
		if(direction == 1) x = x + distance;
		if(direction == 2) y = y + distance;
		if(direction == 3) x = x - distance;
		if(direction == 4) {x = x + (distance/2); y = y - (distance/2);}
		if(direction == 5) {x = x + (distance/2); y = y + (distance/2);}
		if(direction == 6) {x = x - (distance/2); y = y + (distance/2);}
		if(direction == 7) {x = x - (distance/2); y = y - (distance/2);}
		
		
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > xmax) x = xmax;
		if(y > ymax) y = ymax;
		if(x == 0 || y == 0 || x == xmax || y == ymax)
		{
			direction = Math.floor(Math.random() * 8);
		}
		
		if(x == 0) x = 1;
		if(y == 0) y = 1;
		if(x == xmax) x = (xmax - 1);
		if(y == ymax) y = (ymax - 1);
		
		addSegment(x, y, "circle" + index);
		index++;
	},
	50);
}



