%  mfcc - Mel frequency cepstrum coefficient analysis.
% Find the cepstral coefficients (ceps) corresponding to the
% spectrum input.
%
% Refactored from an implementation by Harald Frostel in 10/13/2010

function [fftMags, fftFreqs] = ...
    fftData(input, samplingRate, windowSize, hopSize, fftSize)

if nargin < 3
    windowSize = min(round(1024/44100*samplingRate),length(input));
end

if nargin < 4
    hopSize = fix(windowSize/2);
end

if nargin < 5
    fftSize = 2^nextpow2(windowSize-1);
end

% Parameters for the algorithm
Nspec = fix(fftSize/2+1);
fftFreqs = [0:Nspec-1]' * samplingRate/fftSize;

cols = max(0,floor((length(input)-windowSize)/hopSize)+1);

% Ok, now let's do the processing.  For each chunk of data:
%    * Window the data with a hamming window,
%    * Shift it into FFT order,
%    * Find the magnitude of the fft,
%    * Convert the fft data into filter bank outputs,
%    * Find the log base 10,

preemp = false;

% Filter the input with the preemphasis filter.  Also figure how
% many columns of data we will end up with.
if preemp
    input = filter([1 -.97], 1, input);
end

hamWindow = hamming(windowSize);

%Normalize window (concerns only 1st coeff)
hamWindow = hamWindow .* 2./sum(hamWindow);

fftMags = zeros(fftSize, cols);
ind = 1;
for i=1:cols
    %Calc Spectrum
    windowedInput = input(ind:ind+windowSize-1) .* hamWindow;
    fftMags(:,i) = abs(fft(windowedInput, fftSize));
    ind = ind+hopSize;
end



