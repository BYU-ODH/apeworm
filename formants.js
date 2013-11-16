///http://ncslaap.lib.ncsu.edu/tools/norm/norm1_methods.php


var barWidth = 1,
        circleRadius = 5,
        maxWormSegments = 10,
        ipaHeight = 500,
        ipaWidth = 500,
        requiredFormants = 4, // 0, 1, 2, 3
        context = new webkitAudioContext(), // @todo: polyfill
        analyser = context.createAnalyser(),
        streamSource,
        data,
        data2;
        var frequency = 10;
        var reporter = 0;
		
	function log(text)
	{
            if(reporter == 0){
                console.log(text);
            }
	}
        
    	function smootherizer(size, period)
	{
            this.size = size;
            this.period = period;
            this.p = 0;
            this.stac=new Array();
            this.addNew = function(item){
                //if(stac.length
                this.enqueue(item);
                if(this.stac.length > this.size)
                {
                    this.dequeue();
                }
                this.p++;
                if(this.p > period)
                {
                    this.p = 0;
                    return this.average();
                }
                return null;
            }
            this.average=function(){
                var totals = [0,0,0];
                var count = 0;
                for(i = 0; i < this.stac.length; i++){
                    totals[0] += this.stac[i][0];
                    totals[1] += this.stac[i][1];
                    totals[2] += this.stac[i][2];
                    count++;
                }
                if(count == 0){
                    return [0,0,0]
                }
                var avgs = [(totals[0] / count),(totals[1] / count), (totals[2] / count)]
                return avgs;
            }
            this.dequeue=function(){
                return this.stac.pop();
            }
            this.enqueue=function(item){
                this.stac.unshift(item);
            }
	}
    
    
    function getUserMedia() {
        (navigator.getUserMedia || navigator.webkitGetUserMedia || function(){})
            .apply(navigator, arguments);
    }

    function barkScale( f ) { // Traunmuller conversion
        var result = 26.81/(1+(1960/f)) - 0.53;
        //var result = ( (26.81 * f) / (1960 + f) ) - 0.53;
        if(result < 2) {
            result += 0.15*(2-result);
        }
        else if(result > 20.1) {
            result += 0.22 * (result - 20.1);
        }
        return result;
    }

    function success( stream ) {
	console.log("A");
        streamSource = context.createMediaStreamSource(stream);
        streamSource.connect(analyser);
        //data = new Float32Array(analyser.frequencyBinCount); // @todo -- set this up with byteFrequencyData instead of float?
        data = new Uint8Array(analyser.frequencyBinCount);
        data2 = new Float32Array(analyser.frequencyBinCount);
        
        var freqGraph = document.getElementById('output'),
            freqCtx = freqGraph.getContext('2d'),
            ipaHolder = document.getElementById('ipa');

        var segments = new Array(maxWormSegments),
            currentSegment = 0;

        for(var i = 0; i<segments.length; i++) {
            var seg = document.createElement("canvas");
            seg.style.position = "absolute";
            seg.width = ipaWidth;
            seg.height = ipaHeight;
            ipaHolder.appendChild(seg);
            segments[i] = seg.getContext("2d");
        }
        
		console.log("B");
        /**
        @todo: polyfill
        **/
        requestAnimationFrame(function() {   //This is an event, called every time the frame has animated
			
			//console.log("C");
            //analyser.getFloatFrequencyData(data);
            analyser.getByteFrequencyData(data);
            
            analyser.getFloatFrequencyData(data2);
            if(naz == true){
                var d1 = "";
                var d2 = "";
                
                for(var i = 0; i < data.length; i++){
                    d1 = d1 + "," + data[i];
                }
                for(var i = 0; i < data2.length; i++){
                    d2 = d2 + "," + Math.floor(data2[i]);
                }
                
                console.log(d1);
                console.log("===========");
                console.log(d2);
                naz = false;
            }
            //freqCtx.clearRect(0, 0, freqGraph.width, freqGraph.height);

            var formants = new Uint8Array(requiredFormants); // to contain maxima of array
			//log(formants);
            // draw spectrum and extract formants
            //console.log("data.length= " + data.length);
            for(var i = 0; i<data.length; i++) {
                //var barHeight = data[i];
                //freqCtx.fillRect(i*barWidth, freqGraph.height - barHeight, barWidth, barHeight);

				
		if(data[i] < formants[formants.length-1]) {
                    continue;
                }

                for(var j = 0; j<formants.length; j++) {
					
                    if(data[i] > formants[j]) {
						//log("data(i) > formants(j), or " + data[i] + " > " + formants[j]);
                        formants[j] = data[i];
                        break;
                    }
                }
            }

            // draw marker on IPA graph
            // @TODO: need Cory's input
            var f1 = barkScale(formants[1]) - barkScale(formants[3]);
            var f2 = barkScale(formants[2]) - barkScale(formants[3]); 
		//log(formants[1] + "-----------" + formants[2] + "-----------" + formants[3])	;
			//the following is all drawing

            if(currentSegment >= segments.length) {
                currentSegment = 0;
                segments[segments.length - 1].fillStyle = "rgba(0,0,0,0.5)";
                segments[segments.length - 1].fill();
            }
            else if(currentSegment > 0)
            {
                segments[currentSegment - 1].fillStyle = "rgba(0,0,0,0.5)";
                segments[currentSegment - 1].fill();
            }
            
            ipaCtx = segments[currentSegment];
            ipaCtx.clearRect(0,0,ipaWidth,ipaHeight);
            ipaCtx.beginPath();

            // *70 to spread things out a little more
            ipaCtx.arc(f1 * 100, f2 * 100, circleRadius, 0, Math.PI*2);
            ipaCtx.fillStyle = "rgba(0,255,255,1)";
            ipaCtx.fill();
            currentSegment++;

            if(reporter == 0)
            {
                reporter = frequency;
            }
            else
            {
                reporter--;
            }
            // restart
            requestAnimationFrame(arguments.callee);
        });
    }
	
    function failure() {
        alert("Could not capture audio.");
    }

    getUserMedia({audio: true}, success, failure);

