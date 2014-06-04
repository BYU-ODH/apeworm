///http://ncslaap.lib.ncsu.edu/tools/norm/norm1_methods.php

   var context = new webkitAudioContext(), // @todo: polyfill
    		analyser = context.createAnalyser();
        

    function getUserMedia() {
        (navigator.getUserMedia || navigator.webkitGetUserMedia || function(){})
            .apply(navigator, arguments);
    }

		function barkScale( formant ) { // Traunmuller conversion
			if(formant == 0) {
				formant = 1;
			}
			return 26.81/(1+(1960/formant)) - 0.53;
		}

    function success( stream ) {
	
        var streamSource = context.createMediaStreamSource(stream);
        streamSource.connect(analyser);
        var maxDesiredHz = 5500;
       
        var binCount =  Math.ceil(maxDesiredHz/(context.sampleRate/analyser.fftSize));

        if(binCount > analyser.frequencyBinCount) {
          binCount = analyser.frequencyBinCount;
        }
       
        var data = new Uint8Array(binCount);
      
				var width = 500;
				var height = 400;

				var stage = new PIXI.Stage(0xFFFFFF);
				var renderer = PIXI.autoDetectRenderer(width+40, height+40);
			
				makeGraph(stage, renderer, width, height);

        /**
        @todo: polyfill
        **/
        requestAnimationFrame(function analyze() {   //This is an event, called every time the frame has animated
			
        analyser.getByteFrequencyData(data);
			
				var WINDOW_SIZE = 55;
				var ORDER = 1;
				var DERIVATIVE = 0;
				var first = smoothCurve(data, WINDOW_SIZE, ORDER, DERIVATIVE, 0);  
        //var final = smoothCurve(first, WINDOW_SIZE, ORDER, DERIVATIVE, 0);
				var peaks = peaksFinder(first); 
				var formants = frequencyFinder(peaks, context.sampleRate, analyser.fftSize);
            // @TODO: need Cory's input
            // we believe that the first peak is not the fundamental frequency, but the first formant
        var f1 = barkScale(formants[2]) - barkScale(formants[0]);
        var f2 = barkScale(formants[2]) - barkScale(formants[1]); 
		    
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

