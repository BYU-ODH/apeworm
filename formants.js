///http://ncslaap.lib.ncsu.edu/tools/norm/norm1_methods.php

   var context = new webkitAudioContext(), // @todo: polyfill
    		analyser = context.createAnalyser();
        

    function getUserMedia() {
        (navigator.getUserMedia || navigator.webkitGetUserMedia || function(){})
            .apply(navigator, arguments);
    }

    function barkScale( f ) { // Traunmuller conversion
        var result = 26.81/(1+(1960/f)) - 0.53;
        //var result = ( (26.81 * f) / (1960 + f) ) - 0.53;
        /*if(result < 2) {
            result += 0.15*(2-result);
        }
        else if(result > 20.1) {
            result += 0.22 * (result - 20.1);
        }*/
        return result;
    }

    function success( stream ) {
	
        var streamSource = context.createMediaStreamSource(stream);
        streamSource.connect(analyser);
       
       var data = new Uint8Array(analyser.frequencyBinCount);
      
        /**
        @todo: polyfill
        **/
				var width = 500;
				var height = 400;

				var stage = new PIXI.Stage(0xFFFFFF);
				var renderer = PIXI.autoDetectRenderer(width+40, height+40);
			
				makeGraph(stage, renderer, width, height);
		
        requestAnimationFrame(function analyze() {   //This is an event, called every time the frame has animated
			
        analyser.getByteFrequencyData(data);
			
				var WINDOW_SIZE = 55;
				var ORDER = 1;
				var DERIVATIVE = 0;
				var first = smoothCurve(data, WINDOW_SIZE, ORDER, DERIVATIVE, 0);  
        var final = smoothCurve(first, WINDOW_SIZE, ORDER, DERIVATIVE, 0);
				var peaks = peaksFinder(final); 
				var formants = frequencyFinder(peaks, context.sampleRate, analyser.fftSize);
            // @TODO: need Cory's input
        var f1 = barkScale(formants[1]) - barkScale(formants[3]);
        var f2 = barkScale(formants[2]) - barkScale(formants[3]); 
		    
				makeWorm(f1, f2, stage, renderer, width, height);
            // restart
        requestAnimationFrame(analyze);
        });
    }
	
    function failure() {
        alert("Could not capture audio.");
    }

    getUserMedia({audio: true}, success, failure);
	//console.log(context.sampleRate());
	//console.log(analyzer.fftSize());

