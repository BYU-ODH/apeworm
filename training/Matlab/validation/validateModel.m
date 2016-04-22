function [RMSE, RMSEpercent, r, predictions] = validateModel(features, responses)
%VALIDATEMODEL Validates the effectiveness of the model using the given
%       features and responses with n-fold cross-validation, where n
%       is the number of observations
%   features is an n X p matrix, where n is the number of observations and 
%       p is the number of features
%   responses is an n X m matrix, where n is the number of observations and
%       m is the number of metrics. Also known as the "ground truth"
%   Returns:
%       RMSE root mean square error, a 1 X m matrix, where m is the number of metrics
%       r correlation coefficient, a 1 X m matrix, where m is the number of
%       predictions the predicted values for each fold n-fold cross-validation,
%           a n X m matrix, where n is the number of observations
%           and m is the number of metrics

    n = size(responses,1); % the number of observations
    m = size(responses,2); % the number of metrics
    predictions = zeros(n, m);

    % Validate each metric prediction
    for i=1:m
        % Perform n-fold cross-validation
        for j=1:n
            % leave jth observation's features and response out for validation
            trainingFeatures = features;
            trainingFeatures(j,:) = [];
            trainingResponses = responses(:,i);
            trainingResponses(j,:) = [];

            % Compute the regression coefficients
            b = regress(trainingResponses,trainingFeatures);

            % Predict the response
            predictions(j,i) = features(j,:) * b;       
        end
    end

    % Compute RMSE for each metric
    [RMSE, RMSEpercent] = rmse(responses,predictions);
    
    means = mean(responses);
end

