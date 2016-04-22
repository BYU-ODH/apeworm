clc; close all;
files = dir('audio/singular/*.wav');
% files = dir('audio/*.wav');
for file = files'
    fprintf('audio/singular/%s\n', file.name);
%     fprintf('audio/%s\n', file.name);
    figure
    [t, vowel_backness, vowel_height] = estimateVowels(sprintf('audio/singular/%s', file.name));
%     [t, vowel_backness, vowel_height] = estimateVowels(sprintf('audio/%s', file.name));
    plotVowels(t, vowel_backness, vowel_height);
end

% filenames = ['i.wav', 'e.wav', 'a.wave', 'o.wave', 'u.wav'];
% for filename = filenames
%     sprintf('audio/%s', filename)
%     figure
%     [t, vowel_backness, vowel_height] = estimateVowels(sprintf('audio/%s', filename));
%     plotVowels(t, vowel_backness, vowel_height);
% end