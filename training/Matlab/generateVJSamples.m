function [ samples] = generateVJSamples( corpusdir)
%UNTITLED Summary of this function goes here
%   Detailed explanation goes here


samples = struct('Pos',{},'File',{},'Classlabel',{},'Speaker',{});


%Generate filelist
fprintf('Generating file list ...');
[samples, filenamelist] = readFiles(fullfile(corpusdir,'vowels'), samples,{});
fprintf(' %i files found.\n', length(samples));


fprintf('Reading Info file and remove problematic ...');
fid = fopen(fullfile(corpusdir,'doc','sndFileInfo.txt'));
info = textscan(fid,'%s%s%s','Delimiter','\t','HeaderLines',9);
info = strtrim(info);
fclose(fid);

accmask = strcmp('acceptable',info{2});
info{1} = info{1}(accmask);
info{2} = info{2}(accmask);
info{3} = info{3}(accmask);
mask = ismember(filenamelist,info{1});
samples = samples(mask);
fprintf(' %i files acceptable.\n Classes:\n',length(samples));

cl = {samples.Classlabel};
uc = unique(cl);
speakers = {samples.Speaker};
us = unique(speakers);
disp(uc);

fprintf('Number of speakers: %i\n',length(us));

end

function [ classlabel,speaker ] = parseVJ(filename)
[~,filename] = fileparts(filename);
b = regexp(filename, '_');
classlabel = filename(b(2)+1:b(3)-1);
speaker = filename(1:b(1)-1);
len = filename(b(3)+1:b(4)-1); %Length of vowel production (l - long; s - short; n - nudge)
inton = filename(b(4)+1:b(5)-1); %Intonation of vowel production (l - level; f - falling; r - rising)
amp = filename(b(5)+1:end-4);%Amplitude of vowel production (l - loud; n- normal; q - quiet; lq - loud to quiet; ql - quiet to loud)
%if len == 'n'
%    disp(filename);
%end
if ~isempty(regexp(classlabel, '-', 'match'))   % don't use dipthongs for the beginning
    classlabel = '';
end

end

function [samples,filenamelist] = readFiles(path, samples, filenamelist)

files = dir(fullfile(path,'*'));
%fprintf('%s\n',path);
for i = 1:length(files)
    if ~files(i).isdir || (~strcmp(files(i).name,'.') && ~strcmp(files(i).name, '..'))
        fn = fullfile(path,files(i).name);
        if files(i).isdir
            [samples,filenamelist] = readFiles(fn, samples, filenamelist);
        else
            [~,~,ext] = fileparts(files(i).name);
            %fprintf('%s\n',ext);
            %fprintf('%s: %i\n',files(i).name, ismember(files(i).name,info{1}));
            if strcmpi(ext,'.wav')
                %fprintf('%s\n',fn);
                [cl,spkr] = parseVJ(fn);
                if ~isempty(cl)
                    seg_v = [0;Inf];
                    ts = f0.signal.TimeseriesEx.load(sprintf('%s.f0ex',fn));
                    seg_v = ts.getSegments('F0');
                    %seg_v = seg_v(diff(seg_v,1,2) >= 0.05,:);
                    if ~isempty(seg_v)
                        ind = length(samples)+1;
                        samples(ind).File = fn;
                        samples(ind).Classlabel = cl;
                        
                        samples(ind).Pos =  seg_v.';
                        %samples(ind).TS = ts;
                        %samples(ind).F0 = ts.getDimension('F0');
                        %samples(ind).Pos =  [0;Inf];
                        %samples(ind).Pos
                        samples(ind).Speaker = spkr;
                        filenamelist{ind} = files(i).name;
                    end
                end
            end
        end
    end
end
end