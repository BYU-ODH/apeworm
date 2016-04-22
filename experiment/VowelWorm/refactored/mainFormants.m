clc; close all;
files = dir('audio/singular/*.wav');
for file = files'
    fprintf('audio/singular/%s\n', file.name);
    figure
    [t, formants] = estimateFormants(sprintf('audio/singular/%s', file.name));
    formants
end