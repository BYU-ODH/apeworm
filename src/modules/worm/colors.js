var getNextColor = function(old_color){
  old_color = tinycolor(old_color);
  new_color = old_color.spin(45).toHex();
  return new_color;
};