//receives the array with the positions of the peaks
//receives the sampleRate and fftSize
//returns an array with the frequencies at the peaks


function frequencyFinder(peakPositions, sampleRate, fftSize) {
	var frequenciesAtPeaks = new Array();
	for(var i = 0; i < peakPositions.length; i++) {
		//equation to find frequency.  Found online		
		//http://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to	
		var frequency = peakPositions[i]*(sampleRate/fftSize);
		//keeps only two decimals [@TODO: why?]
		frequency = frequency.toFixed(2);
		frequenciesAtPeaks.push(frequency);
	} 
	return frequenciesAtPeaks;
};
