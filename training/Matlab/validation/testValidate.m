numMetrics = 3;
numSingers = 3;
numFeatures = 25;

% Each row is a different singer
features = rand(numSingers, numFeatures);
responses = rand(numSingers, numMetrics);
[RMSE, RMSEpercent] = validateModel(features, responses);
