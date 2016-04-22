classdef TimeseriesEx < handle
    properties(Access='private')
        dimensions;
        endptr;
        len;
    end
    properties(SetAccess='private')
        IsSorted;
    end
    properties(Access='private')
        INITIALSIZE = 2000;
        DEFAULT_F0DIM = 'F0';
    end
    
    properties(SetAccess='private',Dependent)
        Dimensions;
        Time;
        NSamples;
    end
    
    properties(SetAccess='private')
        StartTime;
        EndTime;
    end
    
    properties
        Name = '';
    end
    
    
    methods
        function clear(obj)
            obj.len = 0;
            obj.endptr = 0;
            obj.StartTime = NaN;
            obj.EndTime = NaN;
            obj.IsSorted = true;
        end
        
        function obj = TimeseriesEx(varargin)
            
            obj.len = 0;
            obj.StartTime = NaN;
            obj.EndTime = NaN;
            obj.IsSorted = false;
            
            justfieldnames = true;
            lastdim = '';
            timefound = false;
            %iscelldim = false;
            
            for k = 1:size(varargin,2)
                if isnumeric(varargin{k}) || iscell(varargin{k})
                    if mod(k,2) ~= 0
                        error('Invalid parameters. Call constructor with (''Dimensionname'',[values],''Dimensionname'',[values], ...) or (''Dimensionname'',''Dimensionname'',''Dimensionname'',...)');
                    end
                    
                    justfieldnames = false;
                    
                    if obj.len == 0
                        obj.len = size(varargin{k},1);
                    elseif obj.len ~= size(varargin{k},1)
                        error('All the dimesions must have to same number of values.');
                    end
                    
                    if strcmp(lastdim,'Time')
                        obj.StartTime = min(varargin{k});
                        obj.EndTime = max(varargin{k});
                    end
                    obj.dimensions.(lastdim) = varargin{k};
                elseif ischar(varargin{k})
                    if ~justfieldnames && mod(k,2) ~= 1
                        error('Invalid parameters. Call constructor with (''Dimensionname'',[values],''Dimensionname'',[values], ...) or (''Dimensionname'',''Dimensionname'',''Dimensionname'',...)');
                    end
                    
                    if strcmp(varargin{k},'Time')
                        timefound = true;
                    end
                    lastdim = varargin{k};
                    if lastdim(1) == '{' && lastdim(end) == '}'
                        lastdim = lastdim(2:end-1);
                        obj.dimensions.(lastdim) = {};
                    else
                        obj.dimensions.(lastdim) = [];
                    end
                   
                else
                    error('Invalid parameters. Call constructor with (''Dimensionname'',[values],''Dimensionname'',[values], ...) or (''Dimensionname'',''Dimensionname'',''Dimensionname'',...)');
                end
            end
            
            if ~timefound
                error('At least one dimension must have the name ''Time''.');
            end
            
            obj.endptr = obj.len;
            
            obj.sort();
        end
        
        function addDimension(obj, dim, val)
            celldim = false;
            if dim(1) == '{' && dim(end) == '}'
                dim = dim(2:end-1);
                celldim = true;
            end
            
            if nargin < 3
                if celldim
                    val = cell(0,1);
                else
                    val = zeros(0,1);
                end
            end
            
            if iscell(val)
                celldim = true;
            end
            
            if size(val,1) ~= obj.NSamples
                error('The number of values must fit to the samples already in the series.');
            end
            
            if isfield(obj.dimensions,dim)
                error(sprintf('Dimension ''%s'' already exists.',dim));
            end
            
            
            
            if celldim
                obj.dimensions.(dim) = cell(obj.len,size(val,2));
            else
                obj.dimensions.(dim) = zeros(obj.len,size(val,2));
            end
            obj.dimensions.(dim)(1:size(val,1)) = val;
        end
        
        function val = get.NSamples(obj)
            val = obj.endptr;
        end
        
        function val = hasDimension(obj,dim)
            val = any(strcmp(dim,obj.Dimensions));
        end
        
        function ndel = deleteSamples(obj,timepoints)
            
            indices = ismember(obj.Time,timepoints);
            
            fn = obj.Dimensions;
            
            for k = 1:length(fn)
                %if ~strcmp(fn{k},'Time')
                obj.dimensions.(fn{k})(indices) = [];
                %end
            end
            
            
            ndel = sum(indices);
            obj.endptr = obj.endptr - ndel;
            obj.len = obj.len - ndel;
            obj.EndTime = max(obj.Time);
            obj.StartTime = min(obj.Time);
        end
        
        function setSamples(obj,varargin)
            if mod(size(varargin,2),2) ~= 0
                error('Invalid parameters. Call setSamples with (''Dimensionname'',[values],''Dimensionname'',[values], ...).');
            end
            
            
            nval = -1;
            fn = obj.Dimensions';
            
            
            for k = 1:2:size(varargin,2)
                fnind = strcmp(varargin{k},fn);
                if ~any(fnind)
                    error('Dimension ''%s'' does not exist in this timeseries.',varargin{k});
                end
                
                
                if nval == -1
                    nval = size(varargin{k+1},1);
                elseif nval ~= size(varargin{k+1},1)
                    error('All the dimesions must have to same number of values.');
                end
                
                
                if strcmp(varargin{k},'Time')
                    timepoints = varargin{k+1};
                end
            end
            
            indices = ismember(obj.Time,timepoints);
            
            for k = 1:2:size(varargin,2)
                
                if ~strcmp(varargin{k},'Time')
                    obj.dimensions.(varargin{k})(indices) = varargin{k+1};
                end
                
            end
            
            
        end
        
        function save(obj,file)
            obj.sort();
            data.Format = 'ts';
            fn = obj.Dimensions;
            for i = 1:length(fn)
                data.(fn{i}) = obj.getDimension(fn{i});
            end
            
            data.F0(data.F0==0) = NaN;
            data.Name = obj.Name;
      
            save('-mat',file,'-struct','data');
        end
        
        function addSamples(obj, varargin)
            if mod(size(varargin,2),2) ~= 0
                error('Invalid parameters. Call addsamples with (''Dimensionname'',[values],''Dimensionname'',[values], ...).');
            end
            
            
            
            nval = -1;
            %fn = obj.Dimensions';
            fn = fieldnames(obj.dimensions);
            
            fncheck = false(length(fn),1);
            newlen = obj.len;
            %celldim = false;
            for k = 1:2:size(varargin,2)
                fnind = strcmp(varargin{k},fn);
                if ~any(fnind)
                    error('Dimension ''%s'' does not exist in this timeseries.',varargin{k});
                end
                
                fncheck = fncheck | fnind;
                
                if nval == -1
                    nval = size(varargin{k+1},1);
                elseif nval ~= size(varargin{k+1},1)
                    %varargin{k}
                    %varargin{k+1}
                    error('All the dimesions must have to same number of values.');
                end
                
                newendptr = obj.endptr + nval;
                dlen = size(obj.dimensions.(varargin{k}),1);
                celldim = iscell(obj.dimensions.(varargin{k}));
                
                if newendptr > dlen
                    newlen = max([obj.INITIALSIZE,ceil(dlen*1.5),newendptr]);
                    
                    if celldim
                        obj.dimensions.(varargin{k})(newlen,:) = cell(1,size(varargin{k+1},2));
                    else
                        
                        obj.dimensions.(varargin{k})(newlen,:) = zeros(1,size(varargin{k+1},2),class(varargin{k+1}));
                    end
                end
                
                if strcmp(varargin{k},'Time')
                    if obj.IsSorted && (isnan(obj.EndTime) || varargin{k+1}(1) >= obj.EndTime) && issorted(varargin{k+1})
                        obj.IsSorted = true;
                        if obj.NSamples == 0
                            obj.StartTime = varargin{k+1}(1);
                        end
                        obj.EndTime = varargin{k+1}(end);
                    else
                        obj.StartTime = min(obj.StartTime,min(varargin{k+1}));
                        obj.EndTime = max(obj.EndTime,max(varargin{k+1}));
                        obj.IsSorted = false;
                    end
                    
                end
                
                
                obj.dimensions.(varargin{k})(obj.endptr+1:newendptr,:) = varargin{k+1};
            end
            
            if ~all(fncheck)
                error('Every dimension must be set during one call of addsamples.');
            end
            
            obj.len = newlen;
            
            obj.endptr = obj.endptr + nval;
        end
        
        function val = get.Dimensions(obj)
            val = fieldnames(obj.dimensions)';
        end
        
        function val = get.Time(obj)
            val = obj.getDimension('Time');
        end
        
        function val = getDimension(obj,dim)
            val = obj.dimensions.(dim)(1:obj.endptr,:);
        end
        
        %         function val = getLastSample(obj,dim)
        %             warning('TimeseriesEx:norecomm','The use of ''getLastSample'' is not recommended.');
        %             val = obj.dimensions.(dim)(obj.endptr,:);
        %         end
        
        function addObject(obj, object)
            %             if isempty(object)
            %                 return;
            %             end
            %fn = obj.Dimensions;
            fn = fieldnames(obj.dimensions);
            
            args = cell(length(fn)*2,1);
            
            
            for i = 1:length(fn)
                args{i*2-1} = fn{i};
                if iscell(obj.dimensions.(fn{i}))
                    args{i*2} = {object.(fn{i})};
                else
                    args{i*2} = object.(fn{i});
                end
            end
            
            obj.addSamples(args{:})
        end
        
        function [seg_v,seg_uv] = getSegments(obj,dim)
            if nargin < 2
                dim = f0.signal.TimeseriesEx.DEFAULT_F0DIM;
            end
            
            obj.sort();
            
            time = obj.Time;
            
            if isempty(time)
                return;
            end
            
            f = obj.getDimension(dim);
            
            %d = diff([false;~isnan(f);false]);
            
            %v_start = find(diff([false;~isnan(f);false]) == 1);
            %v_end = find(diff([~isnan(f);false]) == -1);
            
            seg_v = [time(diff([false;~isnan(f);false]) == 1) time(diff([~isnan(f);false]) == -1)];
            seg_uv = [time(diff([false;isnan(f);false]) == 1) time(diff([isnan(f);false]) == -1)];
            
            seg_v(diff(seg_v,1,2) <= 0,:) = [];
            seg_uv(diff(seg_uv,1,2) <= 0,:) = [];
        end
        %         function [seg_v,seg_uv] = getSegments(obj,dim)
        %             if nargin < 2
        %                 dim = TimeseriesEx.DEFAULT_F0DIM;
        %             end
        %
        %             seg_v = zeros(0,2);
        %             seg_uv = zeros(0,2);
        %
        %             obj.sort();
        %
        %             time = obj.Time;
        %
        %             if isempty(time)
        %                 return;
        %             end
        %
        %
        %             f0 = obj.getDimension(dim);
        %
        %
        %             seg_start = time(1);
        %             seg_voiced = ~isnan(f0(1));
        %
        %             ind = 1;
        %             while true
        %                 if seg_voiced
        %                     ind2 = find(isnan(f0(ind:end)),1,'first');
        %                 else
        %                     ind2 = find(~isnan(f0(ind:end)),1,'first');
        %                 end
        %
        %                 if isempty(ind2)
        %                     break;
        %                 end
        %
        %                 start_newseg = ind+ind2-1;
        %
        %                 seg_end = (time(start_newseg-1)+time(start_newseg))/2;
        %                 if seg_voiced
        %                     seg_v(end+1,:) = [seg_start seg_end];
        %                 else
        %                     seg_uv(end+1,:) = [seg_start seg_end];
        %                 end
        %
        %                 seg_voiced = ~seg_voiced;
        %                 seg_start = seg_end;
        %                 ind = start_newseg;
        %             end
        %
        %             if seg_voiced
        %                 seg_v(end+1,:) = [seg_start time(end)];
        %             else
        %                 seg_uv(end+1,:) = [seg_start time(end)];
        %             end
        %         end
        
        
        function val = interpolate(obj, t, dim)
            if nargin < 3
                dim = f0.signal.TimeseriesEx.DEFAULT_F0DIM;
            end
            
            val = nan(size(t));
            
            [seg_v] = obj.getSegments(dim);
            
            for i = 1:size(seg_v,1)
                ind = find(t >= seg_v(i,1) & t <= seg_v(i,2));
                if ~isempty(ind)
                    ts = obj.getTimeInterval(seg_v(i,1),seg_v(i,2));
                    time = ts.Time;
                    if length(time) < 2
                        val(ind) = time(1);
                    else
                        val(ind) = interp1(time,ts.getDimension(dim),t(ind),'cubic','extrap');
                    end
                end
            end
        end
        
        function mat = toMIDIMatrix(obj,f0dim, loudnessdim)
            
            if nargin < 2
                f0dim = f0.signal.TimeseriesEx.DEFAULT_F0DIM;
            end
            
            obj.sort();
            time = obj.Time;
            
            notes = round(f0.misc.freq2midinote(obj.getDimension(f0dim)));
            notes(isnan(notes)) = -1;
            
            if nargin > 2
                loud = obj.getDimension(loudnessdim) * 127;
            else
                loud = repmat(127, obj.NSamples,1);
            end
            
            mat = zeros(0,4);
            
            if isempty(notes)
                return;
            end
            
            lastNote = notes(1);
            
            ind = 1;
            
            
            while (true)
                
                ind2 = find(notes(ind:end) ~= lastNote,1,'first');
                
                ind2 = ind2 + ind-1;
                
                if ind == 1
                    startTime = 0;
                else
                    startTime = mean(time(ind-1:ind));
                end
                
                if isempty(ind2)
                    ind2 = length(time)+1;
                end
                
                if ind2 == length(time)+1
                    endTime = time(end);
                    
                elseif ind2 == 1
                    endTime =  time(1)/2;
                else
                    endTime = mean(time(ind2-1:ind2));
                end
                
                
                if lastNote ~= -1
                    mat(end+1,:) = [lastNote, loud(ind), startTime,endTime];
                end
                
                
                if ind2 > length(time)
                    break;
                end
                
                ind = ind2;
                lastNote = notes(ind2);
                
                
                
            end
            %mat(mat(:,1)==-1,1) = NaN;
            %mat(mat(:,1)==-1,:) = [];
        end
        
        %         function setSize()
        %             if obj.NSamples > 0
        %                 error('The size can only be set if no samples are added.');
        %             end
        %
        %             fn = obj.Dimensions;
        %
        %             for i = 1:length(fn)
        %             end
        %         end
        
        function data = getAllDimensionData(obj)
            fn = obj.Dimensions;
            data = cell(length(fn)*2,1);
            for i = 1:length(fn)
                data{i*2-1} = fn{i};
                data{i*2} = obj.dimensions.(fn{i})(1:obj.endptr,:);
            end
        end
        
        function varargout = getTimeInterval(obj,starttime, endtime, dims)
            if nargin < 3 || isempty(endtime)
                endtime = Inf;
            end
            if nargin < 4
                fn = obj.Dimensions;
            else
                if ~iscell(dims)
                    fn = {dims};
                else
                    fn = dims;
                end
            end

            time = obj.Time;
            
            if obj.IsSorted && endtime >= obj.EndTime %Just a speedup for online estimation
                ind = f0.misc.reversefind(time,starttime):obj.endptr;
            else
                if isinf(endtime)
                    ind = time >= starttime;
                else
                    ind = time >= starttime & time <= endtime;
                end
            end
            
            if nargin < 4
                args = cell(length(fn)*2,1);
                for i = 1:length(fn)
                    args{i*2-1} = fn{i};
                    args{i*2} = obj.dimensions.(fn{i})(ind,:);
                end
                varargout{1} = f0.signal.TimeseriesEx(args{:});
            else
                %varargout = cell(length(fn),1);
                for i = 1:length(fn)
                    varargout{i} = obj.dimensions.(fn{i})(ind,:);
                end
                
            end
        end
        
        function sort(obj)
            if ~obj.IsSorted
                [obj.dimensions.Time(1:obj.endptr),ix] = sort(obj.Time);
               
                fn = obj.Dimensions;
                for i = 1:length(fn)
                    if strcmp(fn{i},'Time') == 0
                        obj.dimensions.(fn{i})(1:obj.endptr,:) = obj.dimensions.(fn{i})(ix,:);
                    end
                end
                obj.IsSorted = true;
            end
        end
    end
    
    methods(Static)
        function ts = load(filename)
            
            data = load('-mat',filename);
            
            ts = [];
            name = '';
            if isfield(data,'Format')
                switch data.Format
                    case 'ts'
                        data.F0(data.F0==0) = NaN;
                        args = {};
                        fn = fieldnames(data);
                        f0stfound = false;
                        for i = 1:length(fn)
                            if strcmp(fn{i},'Format')
                            elseif strcmp(fn{i},'Name')
                                name = data.Name;
                            else
                                args{end+1} = fn{i};
                                args{end+1} = data.(fn{i});
                            end
                            if strcmp(fn{i},'F0Semitones')
                                f0stfound = true;
                            end
                        end
                        if ~f0stfound
                            args{end+1} = 'F0Semitones';
                            args{end+1} = f0.misc.freq2midinote(data.F0(:));
                        end
                        
                     
                        ts = f0.signal.TimeseriesEx(args{:});
                        ts.Name = name;
                    otherwise
                        error('Unknown F0 Contour file format');
                end
            else
                error('Unknown F0 Contour file format');
            end
        end
    end
end