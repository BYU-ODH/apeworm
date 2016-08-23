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
	
	/**>>>>>>> ae5b061f1d0660bdb59dd980c7dd801ac5f31fb2
     * @const
     * @type number
     */
    var BACKNESS_MIN = 0;

    /**
    /**
     * The maximum backness value. Used for transforming between formants and backness.
     * @const
     * @type number
     */
    var BACKNESS_MAX = 4;

    /**
     * The minimum height value. Used for transforming between formants and height.
     * @const
     * @type number
     */
    var HEIGHT_MIN = 0;

    /**
     * The maximum height value. Used for transforming between formants and height.
     * @const
     * @type number
     */
    var HEIGHT_MAX = 3;


    game.width = options.width || 700;
    game.height = options.height || 500;
    game.margin = 50;

    game.x1 = -1.5;
    game.x2 = 3.0;
    game.y1 = -0.5;
    game.y2 = 2.5;

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
     * Specify here which vowel mapping algorithm to use
     * @see {@link VowelWorm._MAPPING_METHODS}
     * @memberof VowelWorm.Game
     * @name map
     */
    game.map = window.VowelWorm._MAPPING_METHODS.linearRegression;
    // game.map = window.VowelWorm._MAPPING_METHODS.mfccFormants;
    // game.map = window.VowelWorm._MAPPING_METHODS.cepstrumFormants;

    /**
     * Indicates whether to normalize the MFCC vector before prediction
     * @memberof VowelWorm.Game
     * @name normalizeMFCCs
     * @type boolean
     */
    game.normalizeMFCCs = true;

    /**
     * Indicates whether to save time domain  and frequency domain data for experimentation.
     * @memberof VowelWorm.Game
     * @name saveData
     * @type boolean
     */
    game.saveData = false;

    /**
     * The number of past positions to keep when computing the simple moving average (SMA)
     * @memberof VowelWorm.Game
     * @name smoothingConstant
     * @type number
     */
    game.smoothingConstant = 5;

    /**
     * Contains all instances of worms for this game
     * @type Array.<Object>
     * @private
     */
    var worms = [];

    var stopped = false;

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
	 
	//draws the circle (worm) that plots the input from the microphone (or other source)
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
				
				//for debugging
				//console.log (x, y);

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
		//console.log("Here I am!");
		
		//Gets FFTs from audio
        var buffer = worm.getFFT(); //https://developer.mozilla.org/en-US/search?q=getFFT

        if(isSilent(buffer)) {
          worm.resetPosition();
          return null;
        }

        // Get the position from the worm
        var position = worm.getPosition();
		console.log (position[0], position[1]);

        // Transform (backness, height) to (x, y) canvas coordinates
        if(position.length) {
          var coords = transformToXAndY(position[0],position[1]);
          return coords;
        }
        return null;
    };

    /**
     * Transforms from vowel space (backness, height) to canvas space (x, y)
     * @param {number} backness
     * @param {number} height
     * @name transformToXAndY
     */
    var transformToXAndY = function(backness, height){
        var xStart = game.x1;
        var xEnd = game.x2;
        var yStart = game.y1;
        var yEnd = game.y2;

        var xDist = game.width/(xEnd-xStart);
        var yDist = game.height/(yEnd-yStart);

        var adjustedX = (backness-xStart)*xDist + game.margin;
        var adjustedY = game.height-(height-yStart)*yDist + game.margin;

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
    var drawVowels = function() {
        if(!ipaChart.children.length) {
			//mostly arbitrarily placed letters for demonstration purposes only
            var letters = [
                ["e",221.28871891963863,252.35519027188354],
                ["i",169.01833799969594,171.97765003235634],
                ["a",317.6219414250667,337.00896411883406],
                ["o",384.5714404194302,284.96641792056766],
                ["u",412.17314090483404,231.94657762575406]
            ];
            var chart = new PIXI.Sprite.fromImage("profile.png");
            chart.width = game.width;
            chart.height = game.height;
            chart.position.x = 0 + game.margin;
            chart.position.y = 0 + game.margin;
            ipaChart.addChild(chart);
			//Draws the vowels ("letters") on the gameboard
            // for(var i=0; i<letters.length; i++){
            //   var letter = new PIXI.Text(letters[i][0],{font: "35px sans-serif", fill: "black", align: "center"});
            //   letter.position.x = letters[i][1];
            //   letter.position.y = letters[i][2];
            //   ipaChart.addChild(letter);
            // }
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
    window.VowelWorm.loadRegressionWeights(game.normalizeMFCCs);
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
		//[letter,targetF2, minF2, maxF2, targetF1, minF1, maxF1, RotationAngle]
		// tests borders
		//['tl',2500,2500,2500,300,300,300],
		//['bl',2500,2500,2500,900,900,900],
		//['tr',1000,1000,1000,300,300,300],
		//['br',1000,1000,1000,900,900,900],
		["a", 1384.5, 1224, 1583, 679.5, 529, 838, 0], //a
		["ah", 1286, 1166, 1439, 709, 570, 880, 0], //ah
		["\u00E4", 1791.5, 1517, 2100, 545, 443, 687, 0], //ä
		["\u00E4"+"h", 2034, 1902, 2166, 533, 482, 584, 0], //äh
		["eh", 2060, 1700, 2472, 401.5, 328, 495, 0], //eh
		["i", 1969.5, 1640, 2348, 367, 303, 442, 0], //i
		["ih", 2151, 1813, 2496, 309.5, 266, 385, 0], //ih
		["o", 1117, 992, 1279, 539.5, 455, 660, 0], //o
		["oh", 930, 774, 1102, 409, 352, 487, 0], //oh
		["\u00F6", 1635.5, 1376, 1870, 473, 407, 584, 0], //ö
		["\u00F6"+"h", 1552, 1383, 1739, 404.5, 333, 482, 0], //öh
		["u", 1121, 966, 1302, 416, 332, 504, 0], //u
		["uh", 1004.5, 835, 1220, 329.5, 283, 405, 0], //uh
		["\u00fc", 1521.5, 1345, 1735, 390, 333, 466, 0], //üh
		["\u00fc"+"h", 1586, 1362, 1833, 326, 278, 401, 0], //üh
		["e", 1633.5, 1391, 1948, 395, 321, 482, 0], //e
		["er", 1490, 1253, 1754, 546.5, 440, 685, 0], //er
	];

	//Draws the vowels ("letters") on the gameboard
			
	for(var i=0; i<Germanletters.length; i++){
		var text = Germanletters[i][0];
		//var buttonCoords = transformToXAndY(Germanletters[i][1],Germanletters[i][4]);
		//console.log(buttonCoords);
		//var x = buttonCoords.x;
		//var y = buttonCoords.y;
		//var x = (-2.64*(Germanletters[i][1])+2031.27);
		//var y = (1.2*(Germanletters[i][4])-12.22);
		var x = window.MathUtils.xFormantToPixel(Germanletters[i][1]);
		var y = window.MathUtils.yFormantToPixel(Germanletters[i][4]);
		//var x = window.MathUtils.mapToScale(Germanletters[i][1], window.AudioProcessor.F2_MAX, window.AudioProcessor.F2_MIN, 0, game.width);
		//var y = window.MathUtils.mapToScale(Germanletters[i][4], window.AudioProcessor.F1_MIN, window.AudioProcessor.F1_MAX, 0, game.height);
		//console.log (Germanletters[i][4], window.AudioProcessor.F1_MAX, window.AudioProcessor.F1_MIN, game.height, 0)
		//console.log (Germanletters[i][0], x, y)
		//http://illuminations.nctm.org/Activity.aspx?id=4186
		
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
		
		if(Germanletters[i][0]=="i"){
			button.setAttribute("onclick", "makeOval()");
		}
		
		VowelsButtons.appendChild(button);
	}

/*
	//Lets vowel button toggle the oval
		var ovalCanvas = Germanletters[0][0];
		$(document).ready(function(){
			$("#i").click(function(){
				$("."+ovalCanvas).toggle();
			});
		});
		
		//var centerX = ((window.MathUtils.xFormantToPixel(Germanletters[0][3])-window.MathUtils.xFormantToPixel(Germanletters[0][2]))/2)+window.MathUtils.xFormantToPixel(Germanletters[0][2]);
		//var centerY = ((window.MathUtils.yFormantToPixel(Germanletters[0][5])-window.MathUtils.xFormantToPixel(Germanletters[0][6]))/2)+window.MathUtils.xFormantToPixel(Germanletters[0][6]);
		var centerX = 200;
		var centerY = 200;
		var radiusX = window.MathUtils.xFormantToPixel(Germanletters[0][2])-window.MathUtils.xFormantToPixel(Germanletters[0][3]);
		console.log(window.MathUtils.xFormantToPixel(Germanletters[0][2]));
		console.log(window.MathUtils.xFormantToPixel(Germanletters[0][3]));
		var radiusY = window.MathUtils.yFormantToPixel(Germanletters[0][6])-window.MathUtils.yFormantToPixel(Germanletters[0][5]);
		console.log(window.MathUtils.yFormantToPixel(Germanletters[0][6]));
		console.log(window.MathUtils.yFormantToPixel(Germanletters[0][5]));
		var rotation = Germanletters[0][7];
		
		var ox = window.MathUtils.xFormantToPixel(Germanletters[0][3])-10;
		var oy = window.MathUtils.yFormantToPixel(Germanletters[0][5])-10;
		
		var masterdiv = document.getElementById('canvasesdiv');
		var c = document.createElement('canvas');
		c.setAttribute("id", Germanletters[0][0]+'canvas');
		c.style.zIndex = "2";
		c.className = ovalCanvas;
		c.style.position='absolute';
		c.style.left = ox+'px';
		c.style.top = oy+'px';
		c.setAttribute("width", 500);
		c.setAttribute("height", 500);
		console.log(radiusX, radiusY);
		
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
	//From http://scienceprimer.com/draw-oval-html5-canvas
	
	canvasesdiv.appendChild(c);
	//c.appendChild(ctx);*/
	
	console.log ("Peek-a-boo!")
};