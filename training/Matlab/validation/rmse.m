function [result, percent] = rmse(actual,predicted)
% rmse Computes the root mean square error of the two arrays
% expected and actual can be 1D or 2D arrays
    result = sqrt(mean((actual - predicted).^2));
    percent = sqrt(mean(((actual - predicted)/actual).^2));
end

