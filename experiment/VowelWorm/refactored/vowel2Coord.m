function [ coord ] = vowel2Coord(vowel)

%UNTITLED2 Summary of this function goes here
%   Detailed explanation goes here

%Coord = [backness, height, rounded (0=unrounded,1=rounded,2=none)]
if iscell(vowel)
    coord = zeros(length(vowel),3);
    for i = 1:length(vowel)
        coord(i,:) = vowel2Coord(vowel{i});
    end
else
    %{
    switch vowel
        case 'ii'
            coord = [0, 1, 0];
        case 'ee'
            coord = [0, 4/6, 0];
        case 'ae'
            coord = [0, 1/6, 0];
        case 'ah'
            coord = [0, 0, 0];
        case 'iu'
            coord = [0.5, 1, 0];
        case 'ax'
            coord = [0.5, 3/6, 2];
        case 'aa'
            coord = [1, 0, 0];
        case 'uu'
            coord = [1, 1, 1];
        case 'oo'
            coord = [1, 4/6, 1];
        otherwise
            error('Unknown vowel ''%s''',vowel);
    end
    coord = sqCoord2ChartCoord(coord);
    %}
    switch vowel
        case 'ii'
            coord = [0, 3, 0];
        case 'ee'
            coord = [2/3, 2, 0];
        case 'ae'
            coord = [5/3, 0.5, 0];
        case 'ah'
            coord = [2, 0, 0];
        case 'iu'
            coord = [2, 3, 0];
        case 'ax'
            coord = [2.5, 1.5, 2];
        case 'aa'
            coord = [4, 0, 0];
        case 'uu'
            coord = [4, 3, 1];
        case 'oo'
            coord = [4, 2, 1];
        otherwise
            error('Unknown vowel ''%s''',vowel);
    end
    
    
end

end
