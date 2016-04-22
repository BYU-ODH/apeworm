function [features, targets] = generateTrainingData(...
    samplesPerVowelSpeaker, winDuration, firstCoeff, lastCoeff)
%GENERATETRAININGDATA Generates training data from the Vocal Joystick
%corpusfor a multiple linear regression model 

%samplesPerVowelSpeaker is the number of samples to extract for each vowel
%   speaker combo
%winDuration is the window size in seconds

%Load the samples from the corpus
samples = generateVJSamples('../vj_dist/VJCorpus');

%Remove unreliable speakers. Remove voiced segment <15ms
cleansamples = removeSpeakers(samples,0.015); 

%Generate sample-points (VowelWorm used 150 per vowel and speaker)
points = generateLearningPoints(cleansamples, samplesPerVowelSpeaker); 

% Extract MFCCs 1-40 and their classes

fprintf('\textracting mfccs...\n');
mfccs = zeros(length(points),40);
classes = cell(length(points),1);
numSamples = 0;

for k=1:length(points)

    %Load the .wav file
    [y, fs] = audioread(points(k).File);

    % Convert window size from seconds to number of samples
    winSize = floor(fs * winDuration);

    %Convert to Mono
    y = sum(y,2) ./ size(y,2);

    %Get samples at the time stamp and within the window
    t = points(k).Time;
    n = t*fs;
    start = floor(n - winSize/2);
    stop = floor(n + winSize/2);

    % Only use this sample if window does not go past end of file
    if (stop <= length(y) && start >= 1)
        y = y(start:stop);

        %Compute fft
        fftSize = 2^nextpow2(winSize);
        [fftMags, fftFreqs] = fftData(y, fs, winSize);

        %Assert: fftMags is 1D

        %Calc MFCCs
        result = mfcc(fftMags(:,1), fftFreqs, fs, fftSize, 40);
        mfccs(numSamples + 1,:) = result';

        %Store the class
        classes(numSamples + 1,1) = cellstr(points(k).Classlabel);

        numSamples = numSamples + 1;
    else
        fprintf('samples (%g:%g) outside of range (1:%g)\n', start, stop, length(y));

        %Use the previous sample
        mfccs(numSamples + 1,:) = mfccs(numSamples,:);
        classes(numSamples + 1,1) = classes(numSamples,1);
        numSamples = numSamples + 1;
    end
end

% Get rid of all extra rows containing only zeros
mfccs = mfccs(1:numSamples,:);
classes = classes(1:numSamples,:);
fprintf('\tdone\n');
coords = vowel2Coord(classes);

% Only use specified MFCCs
features = mfccs(:,firstCoeff:lastCoeff);
backness = coords(:,1);
height = coords(:,2);
targets = [backness height];

end
