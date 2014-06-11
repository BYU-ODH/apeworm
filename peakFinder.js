//Finds the peaks of the curve
//Pass an array of numbers as param
//Use this file only after you have passed your array through the smoothCurve function twice
//returns an array with the positions of all the peaks found

function peaksFinder(smoothedArray) {
	var peakPositions = new Array();
	var previousNum;
	var currentNum;
	var nextNum;

	for(var i = 0; i < smoothedArray.length; i++) {
		if(i == 0) {
			previousNum = 0;
			currentNum = smoothedArray[i];
			nextNum = smoothedArray[i+1];
		}
		else if(i == smoothedArray.length - 1) {
			previousNum = smoothedArray[i-1];
			currentNum = smoothedArray[i];
			nextNum = 0;
		}
		else {
			previousNum = smoothedArray[i-1];
			currentNum = smoothedArray[i];
			nextNum = smoothedArray[i+1];
		}
		
		 if(currentNum > previousNum && currentNum > nextNum)
			peakPositions.push(i);
	}
	return peakPositions;
}
