normalizeMFCCs = true;
normalizeFFT = false;
smoothFFT = false;
smoothingTimeConstant = 0.8; % This is the default value in Web Audio API
winType = 'hamming';
% winType = 'blackman';

% Set the sampling rate
[~, fs] = audioread('audio/i.wav');

% Load the window timestamps
timestamps = csvread('data/i_stamp.csv');

% Load the time domain data. This was computed with Web Audio API
% Each row is a different timestamp
timeData = csvread('data/i_time.csv');

% Load the frequency data (actual). This was computed with Web Audio API
% Each row is a different timestamp
actualFreqData = csvread('data/i_freq.csv');

% The number of frames (windows) being analyzed individually
numFrames = size(timeData, 1);

% The number of datapoints in a single frame (window)
fftSize = 2^nextpow2(size(timeData, 2));

% Compute the frequency data from the time domain data (predicted)
predictedFreqData = zeros(size(actualFreqData));
fftFreqs = zeros(size(actualFreqData, 2), 1);
for k = 1:numFrames
    [fft, fftFreqs] = fftData(timeData(k, :)', fs, winType);
    predictedFreqData(k, :) = fft(1:length(fft)/2)';
    
    % Smooth the FFT data over time
    if smoothFFT
        if k == 1
            prevData = zeros(size(predictedFreqData(k, :)));
        else
            prevData = predictedFreqData(k-1, :);
        end
        predictedFreqData(k, :) = ...
            smoothingTimeConstant .* prevData + ...
            (1 - smoothingTimeConstant) .* predictedFreqData(k, :);
    end
end

% % Compare actual FFT and predicted FFT
% compareActualPredicted(actualFreqData, predictedFreqData);

% Compare MFCCs
firstMFCC = 2;
lastMFCC = 25;
numMFCCs = lastMFCC - firstMFCC + 1;
actualMFCCs = zeros(numMFCCs, numFrames);
predictedMFCCs = zeros(numMFCCs, numFrames);
maxDiff = 0;
maxNorm = 0;
totalDist = 0;
maxDiffTime = 0;
for k = 1:numFrames
    mfccs = mfcc(actualFreqData(k, :)', fftFreqs, fftSize);
    actualMFCCs(:,k) = mfccs(firstMFCC:lastMFCC);
    mfccs = mfcc(predictedFreqData(k, :)', fftFreqs, fftSize);
    predictedMFCCs(:,k) = mfccs(firstMFCC:lastMFCC);
    
    % Normalize the MFCC vectors
    if normalizeMFCCs
        actualMFCCs(:, k) = actualMFCCs(:, k) / norm(actualMFCCs(:, k));
        predictedMFCCs(:, k) = predictedMFCCs(:, k) / norm(predictedMFCCs(:, k));
    end
    
    predictedMFCCNorm = norm(predictedMFCCs(:,k));
    actualMFCCNorm = norm(actualMFCCs(:,k));
    
    maxNorm = max(maxNorm, max(actualMFCCNorm, predictedMFCCNorm));
    
    diff = abs(actualMFCCs(:, k) - predictedMFCCs(:, k));
    totalDist = totalDist + sum(diff.^2);
    [newMax, pos] = max(diff);
    if newMax > maxDiff
        maxDiff = newMax;
        maxDiffTime = k;
    end
end

% Compare actual MFCCs and predicted MFCCs
% compareActualPredicted(actualMFCCs(:, :)', predictedMFCCs(:, :)');

fprintf('Max diff: %g\n', maxDiff);
fprintf('Average distance between MFCC vectors for a single frame: %g\n', ...
    totalDist / numFrames);
fprintf('Max FFT vector norm: %g\n', maxNorm);

close all;
figure
subplot(2, 2, 1);
plot(actualMFCCs(:, maxDiffTime));
subplot(2, 2, 2);
plot(predictedMFCCs(:, maxDiffTime));
subplot(2, 2, [3 4]);
diff = abs(actualMFCCs(:, maxDiffTime) - predictedMFCCs(:, maxDiffTime));
plot(diff);
