function [samples,toremove ] = removeSpeakers( samples,minlen )
%UNTITLED Summary of this function goes here
%   Detailed explanation goes here

fprintf('Removing samples with less than requiered length ...\n');

speakers = {samples.Speaker};
cl = {samples.Classlabel};
uc = unique(cl);

toremove = false(size(samples));

for i = 1:length(samples)
    len = diff(samples(i).Pos);
    %[ml,mli] = max(len);
    %if ml >= minlen
    %samples(i).Pos = samples(i).Pos(:,mli);
    %else
    %    samples(i).Pos = [];
    %end
    
    samples(i).Pos = samples(i).Pos(:,len >= minlen);
    if isempty(samples(i).Pos)
        toremove(i) = true;
    end
end

fprintf('Removing speakers with less than all vowels ...\n');

us = unique(speakers(~toremove));

for i = 1:length(us)
    sp = us{i};
    %strcmpi(speakers,sp);
    mask = strcmpi(speakers,sp);
    coveredclasses = unique(cl(mask));
    if length(coveredclasses) ~= length(uc)
        fprintf('   Removing speaker %s. Only %i vowels covered: ',sp,length(coveredclasses));
        for c = 1:length(coveredclasses)
            fprintf('%s,',coveredclasses{c});
        end
        fprintf('\n');
        toremove = toremove | mask;
    end
end
newlen = length(unique(speakers(~toremove)));
fprintf('Number of final speakers: %i of %i, Number of samples: %i\n',newlen, length(us),length(samples(~toremove)));

samples = samples(~toremove);

return;
us = unique(speakers(~toremove));
numutt = zeros(length(us),length(uc));
for i = 1:length(us)
    masksp = strcmp(us{i},speakers);
    for j = 1:length(uc)
    numutt(i,j) = sum(masksp & strcmp(uc{j},cl));
    end
end


%min(numutt,[],2)



end

