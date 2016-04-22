function compareActualPredicted(actual, predicted)
%COMPAREFFT Compares predicted vs. actual for some computation
% Each row of the data is a time step

rows = size(actual, 1);
close all;
figure
for k = 1:rows
    subplot(2, 2, 1);
    plot(actual(k, :));
    subplot(2, 2, 2);
    plot(predicted(k, :));
    subplot(2, 2, [3 4]);
    diff = abs(actual(k, :) - predicted(k, :));
    plot(diff);
    pause(.5);
end
end
