clear all; close all;
spectrum_data = load('spectrum.mat');
spectrum = spectrum_data.values;

fs = 44100;
filterBanks = 40;
winSize = round(2048/44100*fs);
hopLength = 0.01;
hopSize = round(hopLength*fs);
fftSize = 1024;

Nspec = fix(fftSize/2+1);
fftFreqs = (0:Nspec-1)' * fs/fftSize;

mfccs = mfcc(spectrum, fftFreqs, fs, fftSize, filterBanks);