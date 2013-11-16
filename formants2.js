/*    var barWidth = 1,
        circleRadius = 5,
        maxWormSegments = 10,
        ipaHeight = 500,
        ipaWidth = 500,
        requiredFormants = 4, // 0, 1, 2, 3
        context = new webkitAudioContext(), // @todo: polyfill
        analyser = context.createAnalyser(),
        streamSource,
        data,
        data2,
        averages,
        si = 0, //sample index
        sampleCount = 100,
        buffered = false,
        bufferedPeaks = false,
        value1 = null,
        ticker = 0,
        PSI = 0, //Peak Sample Index
        peakSamples = new Array(sampleCount),
        samples = new Array(sampleCount);*/
    var barWidth = 1,
        circleRadius = 5,
        maxWormSegments = 10,
        ipaHeight = 300,
        ipaWidth = 500,
        requiredFormants = 4, // 0, 1, 2, 3
        context = new webkitAudioContext(), // @todo: polyfill
        analyser = context.createAnalyser(),
        streamSource,
        data,
        data2,
        averages,
        si = 0, //sample index
        sampleCount = 50,
        smoothingConstants = [2,2,2,2,2,2];
        buffered = false,
        bufferedPeaks = false,
        value1 = null,
        ticker = 0,
        PSI = 0, //Peak Sample Index
        peakSamples = new Array(sampleCount),
        currentSegment = 0,
        isSpeaking = false,
        samples = new Array(sampleCount);
    function nextPSI(){
        PSI++;
        if(PSI == sampleCount){
            PSI = 0;
            bufferedPeaks = true;
        }
    }
    function nextSI(){
        si++;
        if(si == sampleCount){
            si = 0;
            buffered = true;
        }
    }
    function prevPSI(){
        PSI--;
        if(PSI == -1) {
            PSI = sampleCount - 1;
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
    
    function averagePoint(values, index, range){
        var avgCount = range*2 + 1;
        var total = 0;
        
        for(var i = (index - range); i <= (index + range); i++){
            if (typeof values[i] === 'undefined') {
                avgCount--;
            }
            else{
                total += values[i];
            }
        }
        if(avgCount == 0){
            return 0;
        }
        return total / avgCount;
    }
    
    function smoothData(values, range, multiplier){
        var newValues = new Float32Array(values.length);
        for(var i = 0; i < newValues.length; i++){
            newValues[i] = averagePoint(values, i, range)*multiplier;
        }
        return newValues;
    }
    
    function getFormants(sonogram, panel){
        var POIs = new Array(); //points of Interest
        var MAXs = new Array();
        var MINs = new Array();
        var D1 = new Array();
        var D2 = new Array();
        var INFs = new Array();
        var startIsPeak = false;
        var isPeak = false;
        var POIindex = 0;
        
        for(var i = 1; (i + 1) < sonogram.length; i++){
            if(sonogram[i-1] < sonogram[i] && sonogram[i] > sonogram[i+1]){
                //we have a peak
                MAXs[i] = i;
            }
            else if(sonogram[i-1] > sonogram[i] && sonogram[i] < sonogram[i+1]){
                //we have a valley
                MINs[i] = i;
            }
            D1[i - 1] = sonogram[i] - sonogram[i-1];
        }
        
        //calculate second derivative
        for(var i = 1; (i + 1) < sonogram.length; i++){
            D2[i] = D1[i] - D1[i-1];
        }
        
        //calculate inflection points
        for(var i = 1; (i + 1) < sonogram.length; i++){
            if(((D2[i] > 0) && (D2[i+1] < 0)) 
                || ((D2[i] < 0) && (D2[i+1] > 0))
                || (D2[i] == 0)
            ){
                INFs[i] = i;
            }
        }
        ticker++;
        
        //Determine whether or not the mins/max's work
        errors = false;
        for(var i = 0; i < sonogram.length; i++){
            if(MAXs[i] === i){
                var error = "";
                if(POIindex > 0){
                    if(POIs[POIindex - 1].type != "INF"){
                        error = "Max, Expected INF " + ticker;
                        console.log(error);
                        errors = true;
                    }
                }
                POIs[POIindex] = {"type":"MAX","index":i,"error":error};
                POIindex++;
            }
            if(MINs[i] === i){
                var error = "";
                if(POIindex > 0){
                    if(POIs[POIindex - 1].type != "INF"){
                        error = "Min, expected INF " + ticker;
                        console.log(error);
                        errors = true;
                    }
                }
                POIs[POIindex] = {"type":"MIN","index":i,"error":error};
                POIindex++;
            }
            if(INFs[i] === i){
                var error = "";
                POIs[POIindex] = {"type":"INF","index":i,"error":error};
                POIindex++;
            }
        }
        
        if(errors){
            return null;
            //console.log(JSON.stringify({"sonogram":sonogram}), JSON.stringify({"POIs":POIs}));
        }
        
        //add new peakSample
        nextPSI();
        if(!addPeakSample(MAXs)) {
            prevPSI();
            return null;
        }
        //get standard deviations/means of peak samples
        if(bufferedPeaks){
            var stDevSet = getStdevSet();
            var stDevs = stDevSet.stDevs;
            //var means = stDevSet.means;
            var means = stDevSet.standardMeans;
            //get first 5 peaks from peakSamples[PSI]
            
            /*console.log("["+ Math.round(means[0] - stDevs[0]) +"-"+Math.round(means[0] + stDevs[0])+"],"+
                        "["+ Math.round(means[1] - stDevs[1]) +"-"+Math.round(means[1] + stDevs[1])+"],"+
                        "["+ Math.round(means[2] - stDevs[2]) +"-"+Math.round(means[2] + stDevs[2])+"],"+
                        "["+ Math.round(means[3] - stDevs[3]) +"-"+Math.round(means[3] + stDevs[3])+"],"+
                        "["+ Math.round(means[4] - stDevs[4]) +"-"+Math.round(means[4] + stDevs[4])+"]")*/
            
            
            
            var hstdev = 20;
            var n;
            
            //Fill Standard Deviation markers
            
            panel.fillStyle="#FF0000";
            n = 0;
            panel.fillRect(means[n] - stDevs[n], 300, stDevs[n]*2, hstdev);
            
            panel.fillStyle="#F0F0F0";
            n++;
            panel.fillRect(means[n] - stDevs[n], 320, stDevs[n]*2, hstdev);
            
            panel.fillStyle="#AFAFAF";
            n++;
            panel.fillRect(means[n] - stDevs[n], 300, stDevs[n]*2, hstdev);
            
            panel.fillStyle="#8F8F8F";
            n++;
            panel.fillRect(means[n] - stDevs[n], 320, stDevs[n]*2, hstdev);
            
            panel.fillStyle="#F1F1F1";
            n++;
            panel.fillRect(means[n] - stDevs[n], 300, stDevs[n]*2, hstdev);
            
            var overlapCount = 0;
            n = 0;
            for(n = 0; n< 4; n++){
                if((means[n] + stDevs[n]) > (means[n + 1] - stDevs[n + 1])){
                    overlapCount++;
                }
            }
            if(overlapCount < 4){
                panel.fillStyle="#00FF00";
                panel.fillRect(0, 0, 20, 20);
                isSpeaking = true;
            }
            else{
                isSpeaking = false;
            }
            
            
            
            panel.fillStyle="#000000";
            
            panel.fillRect(means[0], 300, barWidth, 300);
            panel.fillRect(means[1], 320, barWidth, 300);
            panel.fillRect(means[2], 300, barWidth, 300);
            panel.fillRect(means[3], 320, barWidth, 300);
            panel.fillRect(means[4], 300, barWidth, 300);
            //debugger;
            
            //analyze new sample, determine whether or not to use it, 
            //determine average based on whether or not new Sample fits, detect formants
            
            return means;
        }
        return [0,0,0,0,0];
        
    }
    
    function selectFormantsFromSample(stdevs, means){
        var sample = peakSample[PSI];
        if(isInStdev(sample[0], means[0], stDevs[0])){
            
        }
    }
    
    function isInStdev(value, mean, stdev){
        if((value < (mean + stdev)) && (value > (mean - stdev))){
            return true;
        }
        return false
    }
    
    function getStdevSet(){
        //Get standard deviation for first 5 formants
        var totals = [0,0,0,0,0];
        var means = [0,0,0,0,0];
        var squares = [0,0,0,0,0];
        var stDevs = [0,0,0,0,0];
        for(var i = 0; i < sampleCount; i++){
            for(var j = 0; j < 5; j++){
                totals[j] += peakSamples[i].peaks[j];
            }
        }
        for(var j = 0; j < 5; j++){
            means[j] = totals[j] / sampleCount;
        }
        for(var i = 0; i < sampleCount; i++){
            for(var j = 0; j < 5; j++){
                var diff = peakSamples[i].peaks[j] - means[j]
                squares[j] += (diff * diff);
            }
        }
        
        for(var j = 0; j < 5; j++){
            stDevs[j] = Math.sqrt(squares[j] / sampleCount);
        }
        
        var outCount = [0,0,0,0,0];
        var inCount = [0,0,0,0,0];
        var standardTotals = [0,0,0,0,0];
        var standardMeans = [0,0,0,0,0];
        for(var i = 0; i < sampleCount; i++){
            //analytics, how many are outside of the standard deviation?
            for(var j = 0; j < 5; j++){
                var val = peakSamples[i].peaks[j];
                if(isInStdev(val, means[j], stDevs[j])){
                    inCount[j]++;
                    standardTotals[j] += val;
                }
                else{
                    outCount[j]++;
                }
            }
        }
        //console.log(Math.round((outCount / inCount) * 100));
        for(var j = 0; j < 5; j++){
            standardMeans[j] = standardTotals[j] / inCount[j];
        }
        
        return {
            "stDevs":stDevs,
            "means":means,
            "standardMeans":standardMeans
        };
    }
    
    
    function addPeakSample(MAXs){
        //adds a new peakSample, writing over oldest existing sample
        var peaks = new Array();
        var PI = 0;//peak index
        for(var i = 0; i < MAXs.length; i++){
            if(MAXs[i] === i){
                //add this peak
                peaks[PI] = i;
                PI++;
            }
            if(PI > 4) break;
        }
        if(PI != 5){
            return false;
        }
        
        var newSample = {
            "peaks":peaks,
            "use":true,
            "formants":new Array()
        };
        
        peakSamples[PSI] = newSample;
        return true;
    }

    function success( stream ) {
        streamSource = context.createMediaStreamSource(stream);
        streamSource.connect(analyser);
        //data = new Float32Array(analyser.frequencyBinCount); // @todo -- set this up with byteFrequencyData instead of float?
        data = new Uint8Array(analyser.frequencyBinCount);
        data2 = new Float32Array(analyser.frequencyBinCount);
        averages = new Float32Array(analyser.frequencyBinCount);
        
        value1 = analyser.fftSize;
        
        var freqGraph = document.getElementById('output'),
            freqCtx = freqGraph.getContext('2d'),
            ipaHolder = document.getElementById('ipa');

        var segments = new Array(maxWormSegments);/*,
            currentSegment = 0;*/

        for(var i = 0; i<segments.length; i++) {
            var seg = document.createElement("canvas");
            seg.style.position = "absolute";
            seg.width = ipaWidth;
            seg.height = ipaHeight;
            ipaHolder.appendChild(seg);
            segments[i] = seg.getContext("2d");
        }
        
        /**
        @todo: polyfill
        **/
        requestAnimationFrame(function() {
            //analyser.getFloatFrequencyData(data);
            analyser.getByteFrequencyData(data);
            analyser.getFloatFrequencyData(data2);
            samples[si] = data2;
            nextSI();
            
            
            
            if(buffered){
                /*var trash = new Array(1,2,3,1,5,2,2,8,5,3,6,12,3);
                console.log(smoothData(trash, 1, 1));
                debugger;*/
                //generate average values
                for(var i = 0; i < analyser.frequencyBinCount; i++){
                    averages[i] = 0;
                }
                for(var i = 0; i < analyser.frequencyBinCount; i++){
                    for(var j = 0; j < sampleCount; j++){
                        averages[i] = averages[i] + samples[j][i];
                    }
                }
                for(var i = 0; i < analyser.frequencyBinCount; i++){
                    averages[i] = ((averages[i] / sampleCount) + 100)*3;
                }
                
               
                var datax = averages;
                for(var i = 0; i < smoothingConstants.length; i++){
                    datax = smoothData(datax, smoothingConstants[i], 1);
                }
                
                //console.log(averages, datax);

                freqCtx.clearRect(0, 0, freqGraph.width, freqGraph.height);
                freqCtx.fillRect(172, 200, barWidth, 400);
                
                //debugger;
                var formants = getFormants(datax, freqCtx);
                
                //var formants = new Array(); // to contain maxima of array
                var fIndex = 1;
                // draw spectrum and extract formants
                for(var i = 0; i<datax.length; i++) {
                    var barHeight = datax[i];
                    freqCtx.fillRect(i*barWidth, freqGraph.height - barHeight, 5, barHeight);

                    /*if(datax[i] < formants[formants.length-1]) {
                        continue;
                    }

                    for(var j = 0; j<formants.length; j++) {
                        if(datax[i] > formants[j]) {
                            formants[j] = datax[i];
                            break;
                        }
                    }*/
                    /*formants[fIndex] = datax[i]*23.4375; //this is taken from samplerate/ fftsize
                    fIndex++;
                    freqCtx.fillRect(i, 200, barWidth, 400);*/
                }

                // draw marker on IPA graph
                // @TODO: need Cory's input
                if(formants != null && formants[0] != null && formants[1] != null & formants[2] != null){
                    var f1 = barkScale(formants[1-1]*23.4375) - barkScale(formants[3-1]*23.4375);
                    var f2 = barkScale(formants[2-1]*23.4375) - barkScale(formants[3-1]*23.4375); 

                    if(isSpeaking || true){
                        addSegment(f2 *(-30), f1*(-15), "seg"+currentSegment);
                        currentSegment++;
                    }
                    
                }
            }

            // restart
            requestAnimationFrame(arguments.callee);
        });
    }

    function failure() {
        alert("Could not capture audio.");
    }

    getUserMedia({audio: true}, success, failure);
