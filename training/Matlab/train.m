function weights = train(features, outputs)
%TRAIN Trains a multiple linear regression learner on the given data.
%generateTrainingData must be run before this

%   features is an n X p matrix, where n is the number of observations and 
%       p is the number of features
%   targets is an n X m matrix, where n is the number of observations and
%       m is the number of outputs. Also known as the "ground truth"
%   Returns weights, a (p+1) X m matrix, where p is the number of features and
%       m is the number of outputs. The extra row is for a DC coefficient
%       (bias weight)

n = size(features, 1);
p = size(features, 2);
m = size(outputs, 2);

% Add a DC regression coefficient in the first column
features = [ones(n, 1) features];

weights = zeros(p + 1, m);

% Find weights for each output separately
for i=1:m
    weights(:,i) = regress(outputs(:,i),features);
end

end