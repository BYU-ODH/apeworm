%  mfcc - Mel frequency cepstrum coefficient analysis.
%   [ceps,freqresp,fb,fbrecon,freqrecon] = ...
%			mfcc(input, samplingRate, [frameRate])
% Find the cepstral coefficients (ceps) corresponding to the
% input.  Four other quantities are optionally returned that
% represent:
%	the detailed fft magnitude (freqresp) used in MFCC calculation,
%	the mel-scale filter bank output (fb)
%	the filter bank output by inverting the cepstrals with a cosine
%		transform (fbrecon),
%	the smooth frequency response by interpolating the fb reconstruction
%		(freqrecon)
%  -- Malcolm Slaney, August 1993
% Modified a bit to make testing an algorithm easier... 4/15/94
% Fixed Cosine Transform (indices of cos() were swapped) - 5/26/95
% Added optional frameRate argument - 6/8/95
% Added proper filterbank reconstruction using inverse DCT - 10/27/95
% Added filterbank inversion to reconstruct spectrum - 11/1/95

% (c) 1998 Interval Research Corporation
%
% Modified and simplified by Harald Frostel 10/13/2010

function [ceps, mfccFilterWeights, earMag ,earMagNoLog] = ...
    mfcc5(input, samplingRate, cepstralCoefficients, windowSize, hopSize, fftSize)

%	Filter bank parameters
%lowestFrequency = 133.3333;
%linearFilters = 13;
%linearSpacing = 66.66666666;
%logFilters = 27;
%logSpacing = 1.0711703;


if nargin < 3
    cepstralCoefficients = 13;
end

if nargin < 4
    windowSize = min(round(1024/44100*samplingRate),length(input));
end
if nargin < 5
    hopSize = fix(windowSize/2);
end

if nargin < 6
    fftSize = 2^nextpow2(windowSize-1);
end

Nspec = fix(fftSize/2+1);


totalFilters = 40;
%totalFilters = 25;
lowestFreq = 0;
highestFreq = 8000;
lowestMel = log(1+lowestFreq/700)*1127.01048;
highestMel = log(1+highestFreq/700)*1127.01048;
melSpacing = linspace(lowestMel,highestMel,totalFilters+2);
fftFreqs = [0:Nspec-1]' * samplingRate/fftSize;
fftFreqs2Mel = log(1+fftFreqs./700).*1127.01048;

mel2f = @(m)700.* (exp(m./1127.01048)-1);

lower = melSpacing(1:totalFilters);
center = melSpacing(2:totalFilters+1);
upper = melSpacing(3:totalFilters+2);
width = mel2f(upper)-mel2f(lower);

mfccFilterWeights = zeros(totalFilters,Nspec);
for chan=1:totalFilters
    %mfccFilterWeights(chan,:) = max(0,(1-abs(fftFreqs2Mel-center(chan)) ./ (center(chan)-lower(chan))) * 2./width(chan));
    mfccFilterWeights(chan,:) = max(0,(1-abs(fftFreqs2Mel-center(chan)) ./ (center(chan)-lower(chan))));
    %mfccFilterWeights(chan,:) = mfccFilterWeights(chan,:) ./ sum(mfccFilterWeights(chan,:));
end

cols = max(0,floor((length(input)-windowSize)/hopSize)+1);

% Allocate all the space we need for the output arrays.
ceps = zeros(cepstralCoefficients, cols);


% Ok, now let's do the processing.  For each chunk of data:
%    * Window the data with a hamming window,
%    * Shift it into FFT order,
%    * Find the magnitude of the fft,
%    * Convert the fft data into filter bank outputs,
%    * Find the log base 10,
%    * Find the cosine transform to reduce dimensionality.

preemp = false;


% Filter the input with the preemphasis filter.  Also figure how
% many columns of data we will end up with.
if preemp
    input = filter([1 -.97], 1, input);
end

hamWindow = hamming(windowSize);

%Normalize window (concerns only 1st coeff)

hamWindow = hamWindow .* 2./sum(hamWindow);


ind = 1;
%earMagNoLog = zeros(cepstralCoefficients,1)+eps;
for i=1:cols
    %Calc Spectrum
    
    fftMag = abs(fft(input(ind:ind+windowSize-1) .* hamWindow,fftSize));
    

    % mine as well
    earMagNoLog = mfccFilterWeights * fftMag(1:Nspec);
    %earMagNoLog(1:totalFilters) = mfccFilterWeights * fftMag(1:Nspec);
    
    earMag = log10(earMagNoLog);
  
    dctres = dct(earMag);
    ceps(:,i) = dctres(1:cepstralCoefficients);
    
    ind = ind+hopSize;
end

