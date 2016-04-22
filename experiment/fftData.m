%  mfcc - Mel frequency cepstrum coefficient analysis.
% Find the cepstral coefficients (ceps) corresponding to the
% spectrum input.
%
% Refactored from an implementation by Harald Frostel in 10/13/2010

function [fftMags, fftFreqs] = ...
    fftData(input, samplingRate, winType)

windowSize = length(input);

fftSize = 2^nextpow2(windowSize-1);

% Parameters for the algorithm
Nspec = fix(fftSize/2);
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

if strcmp(winType, 'blackman')
    % Use blackman window
    win = blackman(windowSize);
else
    % Use hamming window by default
    win = hamming(windowSize);

    %Normalize window (concerns only 1st coeff)
    win = win .* 2./sum(win);
end
%Apply the window
windowedInput = input(1:windowSize) .* win;

%Calc Spectrum
fftMags = abs(fft(windowedInput,fftSize));


