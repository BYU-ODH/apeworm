var $svg;
var svgID;
var vertexGroup;
var symbolGroup;

var opacity = .7;

var id1 = 0;
var id2 = 0;
var id3 = 0;

function refresh(){
    $svg = $("#" + svgID);
    $svg.html($svg.html());  //refreshes svg
};

function addLine(x1, y1, x2, y2){
    //x1="5%" y1="5%" x2="95%" y2="5%"
    var id = "line_" + id2;
    id2++;
    
    var line = document.createElementNS("http://www.w3.org/2000/svg","line");
    $(line).attr({id:id, fill:"black", x1:x1, y1:y1, x2:x2, y2:y2, opacity: opacity, class:"line"});
    $("#" + svgID).append(line);
}
    
function addCircle(cx, cy){
    var r ="1%";
    var id = "vertex_" + id1;
    id1++;
    var cir = document.createElementNS("http://www.w3.org/2000/svg","circle");
    $(cir).attr({id:id, fill:"black", cx:cx, cy:cy, r:r, opacity: opacity});
    $("#" + svgID).append(cir);
}
    
function addSymbol(x, y, val){
    var id = "vertex_" + id3;
    id3++;
    var text = document.createElementNS("http://www.w3.org/2000/svg","text");
    $(text).attr({id:id, fill:"black", x:x, y:y, opacity: opacity, class:"ipaText"});
    var textNode = document.createTextNode(String.fromCharCode(val));
    text.appendChild(textNode);
    $("#" + svgID).append(text);
     
    
}


function renderTo(svgId){
    svgID = svgId;
    $svg = $("#" + svgID);
    //addGroups();
    
    addCircle("5%", "5%");
addCircle("50%", "5%");
addCircle("95%", "5%");

addCircle("20%", "35%");
addCircle("57.5%", "35%");
addCircle("95%", "35%");

addCircle("35%", "65%");
addCircle("65%", "65%");
addCircle("95%", "65%");

addCircle("50%", "95%");
addCircle("72.5%", "95%");
addCircle("95%", "95%");



addLine("5%", "5%", "95%", "5%");
addLine("5%", "5%", "50%", "95%");
addLine("50%", "95%", "95%", "95%");
addLine("95%", "95%", "95%", "5%");
addLine("50%", "5%", "72.5%", "95%");
addLine("20%", "35%", "95%", "35%");
addLine("35%", "65%", "95%", "65%");



addSymbol("0.5%", "6.5%", 105);
addSymbol("6.5%", "6.5%", 121);

addSymbol("45.5%", "6.5%", 616);
addSymbol("51.5%", "6.5%", 649);

addSymbol("90.5%", "6.5%", 623);
addSymbol("96.5%", "6.5%", 117);

addSymbol("20%", "22%", 618);
addSymbol("25%", "22%", 655);

addSymbol("83.5%", "22%", 650);

addSymbol("15.5%", "36.5%", 101);
addSymbol("21.5%", "36.5%", 248);
addSymbol("53%", "36.5%", 600);
addSymbol("59%", "36.5%", 629);
addSymbol("90.5%", "36.5%", 612);
addSymbol("96.5%", "36.5%", 111);

addSymbol("59%", "50%", 601);

addSymbol("30.5%", "66.5%", 603);
addSymbol("36.5%", "66.5%", 339);
addSymbol("60.5%", "66.5%", 604);
addSymbol("66.5%", "66.5%", 606);
addSymbol("90.5%", "66.5%", 652);
addSymbol("96.5%", "66.5%", 596);

addSymbol("39%", "81%", 230);
addSymbol("67%", "81%", 592);

addSymbol("45.5%", "96.5%", 97);
addSymbol("51.5%", "96.5%", 630);
addSymbol("90.5%", "96.5%", 593);
addSymbol("96.5%", "96.5%", 594);
    //refresh();

 //refreshes svg
}

/*
 
 
 <rect width="800" height="600" stroke="red" stroke-width="3" fill="#FFFFFF" />
					
<line x1="5%" y1="5%" x2="95%" y2="5%" class="line" />
<line x1="5%" y1="5%" x2="50%" y2="95%" class="line"/>
<line x1="50%" y1="95%" x2="95%" y2="95%" class="line"/>
<line x1="95%" y1="95%" x2="95%" y2="5%" class="line"/>
<line x1="50%" y1="5%" x2="72.5%" y2="95%" class="line"/>
<line x1="20%" y1="35%" x2="95%" y2="35%" class="line"/>
<line x1="35%" y1="65%" x2="95%" y2="65%" class="line"/>


<g class="ipaSymbol">
        <text x="0.5%" y="6.5%">&#105;</text>
        <text x="6.5%" y="6.5%">&#121;</text>

        <text x="45.5%" y="6.5%">&#616;</text>
        <text x="51.5%" y="6.5%">&#649;</text>

        <text x="90.5%" y="6.5%">&#623;</text>
        <text x="96.5%" y="6.5%">&#117;</text>

        <text x="20%" y="22%">&#618;</text>
        <text x="25%" y="22%">&#655;</text>

        <text x="83.5%" y="22%">&#650;</text>

        <text x="15.5%" y="36.5%">&#101;</text>
        <text x="21.5%" y="36.5%">&#248;</text>
        <text x="53%" y="36.5%">&#600;</text>
        <text x="59%" y="36.5%">&#629;</text>
        <text x="90.5%" y="36.5%">&#612;</text>
        <text x="96.5%" y="36.5%">&#111;</text>

        <text x="59%" y="50%">&#601;</text>

        <text x="30.5%" y="66.5%">&#603;</text>
        <text x="36.5%" y="66.5%">&#339;</text>
        <text x="60.5%" y="66.5%">&#604;</text>
        <text x="66.5%" y="66.5%">&#606;</text>
        <text x="90.5%" y="66.5%">&#652;</text>
        <text x="96.5%" y="66.5%">&#596;</text>

        <text x="39%" y="81%">&#230;</text>
        <text x="67%" y="81%">&#592;</text>

        <text x="45.5%" y="96.5%">&#97;</text>
        <text x="51.5%" y="96.5%">&#630;</text>
        <text x="90.5%" y="96.5%">&#593;</text>
        <text x="96.5%" y="96.5%">&#594;</text>

</g>
 
 **/