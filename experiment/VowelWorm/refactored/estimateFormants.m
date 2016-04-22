function [t, formants] = estimateFormants(wavfile, hopLength)
if nargin < 2
    hopLength = 0.01; %10ms
end

[y, fs] = audioread(wavfile);

%Convert to Mono
y = sum(y,2) ./ size(y,2);

winSize = round(2048/44100*fs);
fftSize = 2^nextpow2(winSize);

hopSize = round(hopLength*fs);

%Calc MFCCs
[fftMags, fftFreqs] = fftData(y, fs, winSize,hopSize,fftSize);
cols = size(fftMags, 2);
filterBanks = 25;
mfccs = zeros(filterBanks, cols);
melFreqs = zeros(filterBanks, cols);
for i=1:cols
    [mfccs(:,i), melFreqs(:,i)] = mfcc(fftMags(:,i), fftFreqs, fs, fftSize, filterBanks);
end

%Remove unused MFCC0 and replace by 1 (necessary for regression DC coefficient)
mfccs(1,:) = 1;

aveMfccs = zeros(filterBanks, 1);
for i=1:filterBanks
    aveMfccs(i,1) = mean(mfccs(i,:));
end

plot(melFreqs(:,1), aveMfccs);

%Time (corrected by half window length)
t = ((0:(size(mfccs,2)-1)) .* hopSize+1)/fs - 0.5*winSize/fs;