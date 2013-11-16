$( document ).ready(function() {
    //get tapewormContainer element;
    var $container = $("#tapewormContainer");
    
    //transform it to SVG element
    var height = $container.attr("height");
    var width = $container.attr("width");
    var svgString ='<svg id="tapewormSVG" xmlns="http://www.w3.org/2000/svg" version="1.1" height=' + height + ' width=' + width + ' font-size=' + height + '></svg>';
    $container.html(svgString);
    //$svg = $("#tapewormSVG");
    
    //create IPA chart in that element
    renderTo("tapewormSVG");
    setWormTarget("tapewormSVG", "tapeworm")
    //simulate  //uncomment to simulate data input
    
    //setWormTarget($svg);
    
    
    
    //set worm target svg to tapeworm svg
});