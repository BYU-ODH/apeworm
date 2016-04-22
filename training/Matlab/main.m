samplesPerVowelSpeaker = 150;
winDuration = 0.046; %VowelWorm used window size of 46 ms
firstCoeff = 2;
lastCoeff = 25;

%Generate training data
[features, targets] = generateTrainingData(...
    samplesPerVowelSpeaker, winDuration, firstCoeff, lastCoeff);

%Normalize MFCCs
for i = 1:size(features, 1)
    features(i, :) = features(i, :) / norm(features(i, :));
end

%Train the model. First column is backness and second column is height.
weights = train(features, targets);

%Save the weights to an xml file
colHeaders = cellstr(['backness'; 'height  ']);
saveWeights('../weights.xml', weights, colHeaders);
