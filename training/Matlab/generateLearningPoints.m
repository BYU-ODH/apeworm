function [points] = generateLearningPoints(samples, nSamplesPerSpVowel)
%UNTITLED Summary of this function goes here
%   Detailed explanation goes here

classlabels = {samples.Classlabel};
uclasses = unique(classlabels);
speakers = {samples.Speaker};
uspeakers = unique(speakers);

nsamp = length(uspeakers)*length(uclasses)*nSamplesPerSpVowel;

fprintf('   Generating %i samples ...\n',nsamp);

points = repmat(struct('Time',0,'File','','Classlabel','','Speaker','','F0',0,'Fold',0),1,nsamp);

c = 1;
for i = 1:length(uspeakers)
    fprintf('   Generating %i samples from speaker %s ...',nSamplesPerSpVowel * length(uclasses),uspeakers{i});
    for j = 1:length(uclasses)
        cursamples = samples(strcmp(uspeakers{i},speakers) & strcmp(uclasses{j},classlabels));
        %len = diff([cursamples.Pos]);
        %size(len)
        timevec = [];
        f0vec = [];
        indvec = [];
        for m = 1:length(cursamples)
            ts = load(sprintf('%s.f0ex',cursamples(m).File),'-mat');
            mask = false(size(ts.F0));
            for n = 1:size(cursamples(m).Pos,2)
                mask = mask | (ts.Time >= cursamples(m).Pos(1,n) & ts.Time <= cursamples(m).Pos(2,n));
            end
            mask = mask & ~isnan(ts.F0);
            timevec = [timevec;ts.Time(mask)];
            f0vec = [f0vec;ts.F0(mask)];
            indvec = [indvec;zeros(sum(mask),1)+m];
        end
        ind = randperm(length(timevec));
        %ind = ind(1:nSamplesPerSpVowel);
        if length(ind) < nSamplesPerSpVowel
            length(ind)
            nSamplesPerSpVowel
        end
        for m = ind(1:nSamplesPerSpVowel)
            points(c).Time = timevec(m);
            points(c).F0 = f0vec(m);
            points(c).File = cursamples(indvec(m)).File;
            points(c).Classlabel = cursamples(indvec(m)).Classlabel;
            points(c).Speaker = cursamples(indvec(m)).Speaker;
            c = c+1;
        end
        %points = [points, cursamples(indvec(ind))]; 
    end
    fprintf('done\n');
end
[~,ix] = sort({points.File});
points = points(ix);
end