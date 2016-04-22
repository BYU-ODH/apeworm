clear all; close all;

%Load regression weights
reg_weights = load('weights.mat');

fft = load('fft.csv');

fs = 44100;
filterBanks = 25;
winSize = round(2048/44100*fs);
hopLength = 0.01;
hopSize = round(hopLength*fs);
fftSize = 1024; 

Nspec = fix(fftSize/2+1);
fftFreqs = (0:Nspec-1)' * fs/fftSize;

mfccs = zeros(size(fft,1), filterBanks);
for i=1:size(fft,1)
    mfccs(i,:) = mfcc(fft(i,:)', fftFreqs, fs, fftSize, filterBanks);
end

% %Remove unused MFCC0 and replace by 1 (necessary for regression DC coefficient)
% mfccs(:,1) = 1;
% 
% mfccs = mfccs';
% 
% %Regress
% vowel_backness = reg_weights.w_backness.' * mfccs;
% vowel_height = reg_weights.w_height_nof0.' * mfccs;
% 
% fprintf(sprintf('(%s, %s)\n', mean(vowel_backness), mean(vowel_height)));
% %Time (corrected by half window length)
% t = ((0:(size(mfccs,2)-1)) .* hopSize+1)/fs - 0.5*winSize/fs;
% 
% plotVowels(t, vowel_backness, vowel_height);
