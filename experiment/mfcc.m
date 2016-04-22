%  mfcc - Mel frequency cepstrum coefficient analysis.
% Find the cepstral coefficients (ceps) corresponding to the
% spectrum input.
%
% Refactored from an implementation by Harald Frostel in 10/13/2010
% Note: inputLength is the length of the signal in the time domain
function [ceps, melFreqs, mfccFilterWeights, earMag ,earMagNoLog] = ...
    mfcc(fftMags, fftFreqs, fftSize)

% Parameters for the algorithm
Nspec = fix(fftSize/2);
totalFilters = 40;
lowestFreq = 0;
highestFreq = 8000;
lowestMel = log(1+lowestFreq/700)*1127.01048;
highestMel = log(1+highestFreq/700)*1127.01048;
melSpacing = linspace(lowestMel,highestMel,totalFilters+2);
fftFreqs2Mel = log(1+fftFreqs./700).*1127.01048;

lower = melSpacing(1:totalFilters);
center = melSpacing(2:totalFilters+1);
melFreqs = center(1:totalFilters);

% Prepare the mel scale filterbank
mfccFilterWeights = zeros(totalFilters,Nspec);
for chan=1:totalFilters
    mfccFilterWeights(chan,:) = max(0,(1-abs(fftFreqs2Mel-center(chan)) ./ (center(chan)-lower(chan))));
end

% Ok, now let's do the processing.  For the chunk of data:
%    * Convert the fft data into filter bank outputs,
%    * Find the log base 10,
%    * Find the cosine transform to reduce dimensionality.

% Map signal to mel scale
earMagNoLog = mfccFilterWeights * fftMags(1:Nspec);

% Compute the cepstrum of the mel spectrum
earMag = log10(earMagNoLog);
ceps = dct(earMag);
