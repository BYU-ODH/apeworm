/**
 * @param {Object=} options Configuration options
 * @param {VowelWorm.instance|Array.<VowelWorm.instance>} options.worms Any
 * VowelWorm instances to begin with
 * @param {number=} [options.width=700] The width of the game board
 * @param {number=} [options.height=500] The height of the game board
 * @param {number=} [options.background=0x99ccff] The background color of the game  (old color = 0xFFFFFF)
 * @param {HTMLElement=} [options.element=document.body] What to append the graph to
 * @constructor
 * @name VowelWorm.Game
 */
window.VowelWorm.Game = function( options ) {
    "use strict";

    var game = this;
	var x1_guess = 600;
	var x2_guess = 3400;
	var x_scale = 5;
	var y1_guess = 300;
	var y2_guess = 1200;
	var y_scale = 2;
	
	
    game.width = options.width || ((x2_guess-x1_guess)/x_scale);
    game.height = options.height || ((y2_guess-y1_guess)/y_scale);
    game.margin = 50; //adds to the width and height
	
	//English frame:
	//game.width = options.width || 560;
    //game.height = options.height || 450;

    game.x1 = 0;
    game.x2 = 4.0;
    game.y1 = 0;
    game.y2 = 3.0;
	
    game.minHz = 0;
    game.maxHz = 8000;
    game.fb = 25;

    /**
     * Represents the threshold in dB that VowelWorm's audio should be at in
     * order to to plot anything.
     * @see {@link isSilent}
     * @memberof VowelWorm.Game
     * @name silence
     * @type number
     */
    game.silence = -70;

    /**
     * Contains all instances of worms for this game
     * @type Array.<Object>
     * @private
     */
	
	var worms = [];

    /**
     * You can change this with game.ipa = true/false
     * @type boolean
     * @memberof VowelWorm.Game
     * @name ipa
     */
    var ipaEnabled = true;

    var ipaChart = new PIXI.DisplayObjectContainer();

    /**
     * Begins animation of worms
     * @memberof VowelWorm.Game
     * @name play
     */
    game.play = function(){
      game.drawWorm();
      window.requestAnimationFrame(game.play);
    };

    /**
     * Inserts a worm into the ever-increasing frenzy of VowelWorm.
     * @param {window.VowelWorm.instance} worm
     * @memberof VowelWorm.Game
     * @name addWorm
     */
    game.addWorm = function(worm) {
     var container = {};
     container.worm = worm;
     container.circles = [];
     worms.push(container);
    };

    /**
     * @private
     */
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
				console.log (x, y);

                var circle = new PIXI.Sprite.fromImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZBAMAAAA2x5hQAAAAJ1BMVEUAAAD///////////////// //////////////////////////////+uPUo5AAAADHRSTlMAB+jh0bmoiU41HivIpyZzAAAAeklE QVQY02MAAsbpQYfCJwIZYE7LGSA40gjhLTsDBscWgDjcNmcgwBrEW3wGCg4DJRlzzsBAIgMDxxk4 OMHAIILgHRFgmHMGASYw1CDxChhikHgBDDpIPAWGM0jgAKocqj5UM1HtQ3ULijtR/YDqPwy/I8IF PcxQwxMAviHDkWPqCWAAAAAASUVORK5CYII=");
                circle.position.x = x;
                circle.position.y = y;
                circle.tint = current_color;
                circle.scale = new PIXI.Point(.8,.8);

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
        var buffer = worm.getFFT();

        if(isSilent(buffer)) {
          return null;
        }

        var mfccs = worm.getMFCCs({
            minFreq: game.minHz,
            maxFreq: game.maxHz,
            filterBanks: game.fb,
            fft: buffer
        });

        if(mfccs.length) {
            mfccs = mfccs.slice(0,game.fb);
            var position = window.VowelWorm.normalize(mfccs, window.VowelWorm.Normalization.regression);
            if(position.length) {
              var coords = adjustXAndY(position[0],position[1]);
              return coords;
            }
        }
        return null;
    };

    var adjustXAndY = function(x,y){
        var xStart = game.x1;
        var xEnd = game.x2;
        var yStart = game.y1;
        var yEnd = game.y2;

        var xDist = game.width/(xEnd-xStart);
        var yDist = game.height/(yEnd-yStart);

        var adjustedX = (x-xStart)*xDist + game.margin;
        var adjustedY = game.height-(y-yStart)*yDist + game.margin;

        return {x:adjustedX,y:adjustedY};
    };

    /**
     * Determines whether, for plotting purposes, the audio data is silent or not
     * Compares against the threshold given for {@link game.silence}.
     * @param {Array.<number>|Float32Array} data - An array containing dB values
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
	
/*	
	var aChild = element.appendChild(aChild);
	 
	var p = document.createElement("p");
	document.body.appendChild(p);
*/
	
    var drawVowels = function() {
        if(!ipaChart.children.length) {
            /*var letters = [
                ["e",221.28871891963863,252.35519027188354],
                ["i",169.01833799969594,171.97765003235634],
                ["a",317.6219414250667,337.00896411883406],
                ["o",384.5714404194302,284.96641792056766],
                ["u",412.17314090483404,231.94657762575406],
            ];*/
            var chart = new PIXI.Sprite.fromImage("mouth.png");
				//For testing purposes:
					//var chart = new PIXI.Sprite.fromImage("https://github.com/BYU-ODH/apeworm/plot_2.png");
			chart.width = '560';
			chart.height = '450';
//			button.style.position='absolute';
            chart.position.x = 0 + game.margin;
            chart.position.y = 0 + game.margin;
            ipaChart.addChild(chart);
			
			/*
			//Draws the vowels ("letters") on the gameboard
            for(var i=0; i<letters.length; i++){
				var letter = new PIXI.Text(letters[i][0],{font: "35px sans-serif", fill: "black", align: "center"});
				letter.position.x = letters[i][1];
				letter.position.y = letters[i][4];
				ipaChart.addChild(letter);

				var button = document.createElement("button");
				var text = letters[i][0];
				button.className = "btn btn-lg btn-primary btn-circle-3d";
				button.setAttribute("id", text);
				var t = document.createTextNode(text);
				button.appendChild(t);
				button.style.position='absolute';
				button.style.left = "0px"; //letters[i][1]
				button.style.top = "0px"; //letters[i][4]
				//button.style.top='10px';
				//button.style.left='10px';
				c.appendChild(button);
            }*/
			
						
        }		
    };

    // CREATE GAME
    var bgColor = options.background !== undefined ? options.background : 0x99ccff;
    game._stage = new PIXI.Stage(bgColor);
    game._renderer = PIXI.autoDetectRenderer(game.width + game.margin*2, game.height + game.margin*2);
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
    
	
	var i_en_F2 = 2761;		var i_en_F1 = 437;
	var I_en_F2 = 2365;		var I_en_F1 = 483;
	var e_en_F2 = 2530;		var e_en_F1 = 536;
	var E_en_F2 = 2058;		var E_en_F1 = 731;
	var ae_en_F2 = 2349;	var ae_en_F1 = 731;
	var a_en_F2 = 1551;		var a_en_F1 = 936;
	var c_en_F2 = 1136;		var c_en_F1 = 781;
	var o_en_F2 = 1035;		var o_en_F1 = 555;
	var horse_en_F2 = 1225;	var horse_en_F1 = 519;
	var u_en_F2 = 1105;		var u_en_F1 = 459;
	var hut_en_F2 = 1426;	var hut_en_F1 = 753;
	var Er_en_F2 = 1588;	var Er_en_F1 = 523;

	var Englishletters = [
		// tests borders
		//['tl',(((x2_guess-x2_guess)/x_scale) - 20),(((y1_guess-y1_guess)/y_scale)-20)],
		//['bl',(((x2_guess-x2_guess)/x_scale) - 20),(((y2_guess-y1_guess)/y_scale)-20)],
		//['tr',(((x2_guess-x1_guess)/x_scale) - 20),(((y1_guess-y1_guess)/y_scale)-20)],
		//['br',(((x2_guess-x1_guess)/x_scale) - 20),(((y2_guess-y1_guess)/y_scale)-20)],
		['i',i_en_F2,i_en_F1],
		['\u026A',I_en_F2,I_en_F1],
		['e',e_en_F2,e_en_F1],
		['\u025B',E_en_F2,E_en_F1],
		['\u00E6',ae_en_F2,ae_en_F1],
		['\u0251',a_en_F2,a_en_F1],
		['\u0254',c_en_F2,c_en_F1],
		['o',o_en_F2,o_en_F1],
		['\u028A',horse_en_F2,horse_en_F1],
		['u',u_en_F2,u_en_F1],
		['\u028C',hut_en_F2,hut_en_F1],
		['\u025D',Er_en_F2,Er_en_F1],
	];

	var Germanletters = [
		// tests borders
		//['tl',x2_guess,y1_guess],
		//['bl',x2_guess,y2_guess],
		//['tr',x1_guess,y1_guess],
		//['br',x1_guess,y2_guess],
		//[letter,F2, minF2, maxF2, F1, minF1, maxF1]
		["a", 1384.5, 1224, 1583, 679.5, 529, 838], //a
		["ah", 1286, 1166, 1439, 709, 570, 880], //ah
		["\u00E4", 1791.5, 1517, 2100, 545, 443, 687], //ä
		["\u00E4"+"h", 2034, 1902, 2166, 533, 482, 584], //äh
		["eh", 2060, 1700, 2472, 401.5, 328, 495], //eh
		["i", 1969.5, 1640, 2348, 367, 303, 442], //i
		["ih", 2151, 1813, 2496, 309.5, 266, 385], //ih
		["o", 1117, 992, 1279, 539.5, 455, 660], //o
		["oh", 930, 774, 1102, 409, 352, 487], //oh
		["\u00F6", 1635.5, 1376, 1870, 473, 407, 584], //ö
		["\u00F6"+"h", 1552, 1383, 1739, 404.5, 333, 482], //öh
		["u", 1121, 966, 1302, 416, 332, 504], //u
		["uh", 1004.5, 835, 1220, 329.5, 283, 405], //uh
		["\u00fc", 1521.5, 1345, 1735, 390, 333, 466], //üh
		["\u00fc"+"h", 1586, 1362, 1833, 326, 278, 401], //üh
		["e", 1633.5, 1391, 1948, 395, 321, 482], //e
		["er", 1490, 1253, 1754, 546.5, 440, 685], //er
	];

//Draws the vowels ("letters") on the gameboard
	/*var x1_guess = x1_guess;
	var x2_guess = x2_guess;
	var x_scale = x_scale;
	var y1_guess = y1_guess;
	var y2_guess = y2_guess;
	var y_scale = 5;*/
	
for(var i=0; i<Germanletters.length; i++){
	var text = "/"+Germanletters[i][0]+"/";
	var x = (((x2_guess-Germanletters[i][1])/x_scale) + game.margin + 10);
	var y = (((Germanletters[i][4]-y1_guess)/2) + game.margin + 10);
	
	//var x = ((x2_guess-Germanletters[i][1])-game.x1)*(game.width/(game.x2-game.x1)) + game.margin;
	//var y = game.height-((Germanletters[i][2])-game.y1)*(game.height/(game.y2-game.y1)) + game.margin;
	//console.log ("("+x+","+y+")")
	
	/*var letter = new PIXI.Text(Germanletters[i][0],{font: "35px sans-serif", fill: "black", align: "center"});
	letter.position.x = Germanletters[i][1];
	letter.position.y = Germanletters[i][2];
	ipaChart.addChild(letter);*/


	var buttcanvas= document.getElementById('VowelsButtons');//('ButtonCanvas');
	
	var button = document.createElement("button");
	button.className = "btn btn-lg btn-primary btn-circle-3d";
	button.setAttribute("id", Germanletters[i][0]);
	var t = document.createTextNode(text);
	button.appendChild(t);
	button.style.position='absolute';
	button.style.left = x+'px'; //Germanletters[i][1]
	button.style.top = y+'px'; //Germanletters[i][2]
	//button.style.top='10px';
	//button.style.left='10px';
	
	/*if(Germanletters[i][0]=="i"){
		button.setAttribute("onclick", "makeOval()");
	}*/
	
	VowelsButtons.appendChild(button);
}

	var mimi = 215;
	var titi = 217;
	
	//Lets vowel button toggle the oval
		$(document).ready(function(){
			$("#i").click(function(){
				$(".ovalCanvas").toggle();
			});
		});
		
		var centerX = 65;
		var centerY = 55;
		var radiusX = 40;
		var radiusY = 69;
		var rotation = 0.8;
		
		var ox = ((((x2_guess-Germanletters[0][1])/x_scale) + 30)-(centerX/2)-10)
		var oy = ((((Germanletters[0][4]-y1_guess)/2) + 30)-(centerY/2)-10)
		
		var masterdiv = document.getElementById('canvasesdiv');
		var c = document.createElement('canvas');
		c.setAttribute("id", Germanletters[0][0]+'canvas');
		c.style.zIndex = "2";
		c.className = "ovalCanvas";
		c.style.position='absolute';
		c.style.left = ox+'px';
		c.style.top = oy+'px';
		
	//draw oval

	//var canvas = document.getElementById('ovalCanvas');
	var cxt = c.getContext('2d');

	cxt.beginPath();
	for (var i = 0 * Math.PI; i < 2 * Math.PI; i += 0.01 ) {
		var xPos = centerX - (radiusX * Math.sin(i)) * Math.sin(rotation * Math.PI) + (radiusY * Math.cos(i)) * Math.cos(rotation * Math.PI);
		var yPos = centerY + (radiusY * Math.cos(i)) * Math.sin(rotation * Math.PI) + (radiusX * Math.sin(i)) * Math.cos(rotation * Math.PI);

		if (i == 0) {
			cxt.moveTo(xPos, yPos);
		} else {
			cxt.lineTo(xPos, yPos);
		}
	}
	cxt.fillStyle = '#8ED6FF';
	cxt.fill();
	cxt.lineWidth = 2;
	cxt.strokeStyle = '#1dadff';
	cxt.stroke();
	cxt.closePath();
	//From http://scienceprimer.com/draw-oval-html5-canvas*/
	
	canvasesdiv.appendChild(c);
	//c.appendChild(ctx);
	
	console.log ("Peek-a-boo!")
};