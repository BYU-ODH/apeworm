//Converts an integer representing a color to an integer representing a color 90 degrees away
var getNextColor = function(old_color){
  if(typeof old_color == 'number'){
	old_color = old_color.toString(16);
	//Pad with 0's if necessary
	while(old_color.length<6){
      old_color = "0" + old_color;
	}
  }

  old_color = tinycolor(old_color);
  new_color = old_color.spin(45).toHex();
  new_color = parseInt(new_color,16);
  return new_color;
};