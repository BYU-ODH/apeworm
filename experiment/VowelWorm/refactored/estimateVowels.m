function [t, vowel_backness, vowel_height] = estimateVowels(wavfile, hopLength)
if nargin < 2
    hopLength = 0.01; %10ms
end

%Load regression weights
reg_weights = load('weights.mat');

[y, fs] = audioread(wavfile);

%Convert to Mono
y = sum(y,2) ./ size(y,2);

winSize = round(2048/44100*fs);
fftSize = 2^nextpow2(winSize);

hopSize = round(hopLength*fs);

%Calc MFCCs
% mfcc_reg = mfcc5(y, fs, 25, winSize,hopSize,fftSize);

%Calc MFCCs
[fftMags, fftFreqs] = fftData(y, fs, winSize,hopSize,fftSize);
fprintf('%g\n', sum(fftMags));
cols = size(fftMags, 2);
filterBanks = 25;
mfcc_reg = zeros(filterBanks,cols);
for i=1:cols
    mfcc_reg(:,i) = mfcc(fftMags(:,i), fftFreqs, fs, fftSize, filterBanks);
end;

% plot(fftFreqs, fftMags)

%Remove unused MFCC0 and replace by 1 (necessary for regression DC coefficient)
mfcc_reg(1,:) = 1;

%Regress
vowel_backness = reg_weights.w_backness.' * mfcc_reg;
vowel_height = reg_weights.w_height_nof0.' * mfcc_reg;

fprintf(sprintf('(%s, %s)\n', mean(vowel_backness), mean(vowel_height)));
%Time (corrected by half window length)
t = ((0:(size(mfcc_reg,2)-1)) .* hopSize+1)/fs - 0.5*winSize/fs;
