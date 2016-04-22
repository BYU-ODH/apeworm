%  mfcc - Mel frequency cepstrum coefficient analysis.
% Find the cepstral coefficients (ceps) corresponding to the
% spectrum input.
%
% Refactored from an implementation by Harald Frostel in 10/13/2010

function [fftMags, fftFreqs] = ...
    fftData(input, samplingRate, windowSize)

if nargin < 3
    windowSize = min(round(1024/44100*samplingRate),length(input));
end

fftSize = 2^nextpow2(windowSize-1);

% Parameters for the algorithm
Nspec = fix(fftSize/2+1);
fftFreqs = (0:Nspec-1)' * samplingRate/fftSize;

% Ok, now let's do the processing:
%    * Window the data with a hamming window,
%    * Shift it into FFT order,
%    * Find the magnitude of the fft,

preemp = false;

% Filter the input with the preemphasis filter.  Also figure how
% many columns of data we will end up with.
if preemp
    input = filter([1 -.97], 1, input);
end

hamWindow = hamming(windowSize);

%Normalize window (concerns only 1st coeff)
hamWindow = hamWindow .* 2./sum(hamWindow);

%Apply the window
windowedInput = input(1:windowSize) .* hamWindow;

%Calc Spectrum
fftMags = abs(fft(windowedInput,fftSize));


