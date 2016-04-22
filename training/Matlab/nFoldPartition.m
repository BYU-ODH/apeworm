function [ points ] = nFoldPartition( points,nfolds)
%UNTITLED Summary of this function goes here
%   Detailed explanation goes here

speakers = {points.Speaker};
uspeakers = unique(speakers);

if mod(length(uspeakers),nfolds) ~= 0
    error('Speakers must be divideable trough number of folds.');
end
spPerFold = length(uspeakers)/nfolds;
fprintf('Using %i speakers per fold\n',spPerFold);

uspeakers = uspeakers(randperm(length(uspeakers)));
for i = 1:nfolds
    foldsp = uspeakers((i-1) * spPerFold + 1:i * spPerFold);
    fprintf('Fold %i: ',i);
    for j = 1:length(foldsp)
        fprintf('%s ',foldsp{j});
    end
    fprintf('\n');
    ind = find(ismember(speakers,foldsp));
    
    for j = 1:length(ind)
        points(ind(j)).Fold = i;
    end
end
end

