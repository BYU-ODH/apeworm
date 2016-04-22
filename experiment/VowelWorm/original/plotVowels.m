function plotVowels(t, vowel_backness, vowel_height)

plotIPAChart();
 hold on
 scatter3(vowel_backness, vowel_height,t);
%  plot3(vowel_backness, vowel_height,t);
 xlabel('Backness');
 ylabel('Height');
 zlabel('Time');
view(0,90);
hold off
end