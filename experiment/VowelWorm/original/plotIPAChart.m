function plotIPAChart(linewidth,hax)
if nargin < 1
    linewidth = 1;
end
        if nargin < 2
            hax = gca;
        end
        
        %washold = ishold(hax);
        cla(hax)
        hold on
        coord_l = vowel2Coord({'ii','ee','ae','ah','aa','oo','uu','iu','ii'});
        vowels = {'ii','ee','ae','ah','aa','oo','uu','iu','ax'};
        coord = vowel2Coord(vowels);
        
        plot(hax,coord_l(:,1),coord_l(:,2),'Color','black','LineWidth',linewidth);
        plot(hax,[2;3],[3;0],'Color','black','LineWidth',linewidth);
        plot(hax,[2/3;4],[2;2],'Color','black','LineWidth',linewidth);
        plot(hax,[1+1/3;4],[1;1],'Color','black','LineWidth',linewidth);
        
        for ii = 1:size(coord,1)
           % fprintf('  [%s]: (%f, %f)\n',vowels{ii},coord(ii,1),coord(ii,2));
            scatter(hax,coord(ii,1),coord(ii,2),20,'Marker','o','DisplayName',vowels{ii},'MarkerFaceColor','black','MarkerEdgeColor','black','LineWidth',linewidth);
            text(coord(ii,1),coord(ii,2),vowels{ii});
        end
        
        %if ~washold
            hold off;
        %end
        
        xlabel('Backness');
        ylabel('Height');
        
    end