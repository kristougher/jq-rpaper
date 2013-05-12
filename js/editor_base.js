var palette = new Array(),
tempObject, tempCurve = {},
i = 0,
current_attributes = {"stroke-width": 2},
bounding_box = {},
drupal_draw_drawing = {};
(function ($) {
$(document).ready(function(){
  $(".draw-view-source").click(function(){
    $(this).closest(".field-widget-diagram").find(".draw-input-wrapper").toggle();
  });
var image_path = "/" + $("#draw-diagram").attr("data-image_path");
var form_element_name = $("#draw-diagram").attr("data-target_element");
editor_mode = (jQuery(".draw-diagram-input").length > 0);
/*** Draw the court and background ***/
paper = Raphael(document.getElementById("draw-diagram"), (Drupal.settings.draw_settings.canvas_width + 100), Drupal.settings.draw_settings.canvas_height);

// Set up the backgrounds and background selector.
var background_object, background_list = {}, background_index = 0, bg;
if (typeof Drupal.settings.draw_settings.backgrounds != 'undefined') {
  for (var background_id in Drupal.settings.draw_settings.backgrounds) {
    paper.setStart();
    paper.rect(0,0,Drupal.settings.draw_settings.canvas_width, Drupal.settings.draw_settings.canvas_height).attr({"fill": "#eee"});

    background_object = Drupal.settings.draw_settings.backgrounds[background_id];
    $(".draw-background-select").append('<option value="' + background_id + '">' + background_object.title + '</option>');

    for(var index in background_object.content) {
      var item = background_object.content[index];
      drawFromJSON(index, item, true);
    }

    background_list[background_id] = paper.setFinish();
    background_list[background_id].hide();

    if (background_index === 0) {
      bg = background_list[background_id];
      background_index++;
      background_list[background_id].show();
    }
  }
}
else {
  paper.setStart();
  paper.rect(0,0,Drupal.settings.draw_settings.canvas_width, Drupal.settings.draw_settings.canvas_height).attr({"fill": "#eee"});
/*
  var court = paper.rect(50,20,300,600);
  court.attr({"fill": "#aaa", "stroke-width": 3});
  court.attr("stroke", "#FFF");
  var lines = paper.set();
  lines.push(
  	paper.path("M50 320L350 320"),
  	paper.path("M50 220L350 220"),
  	paper.path("M50 420L350 420")
  );
  lines.attr({"stroke":"#FFF", "stroke-width": 3});
*/
  bg = paper.setFinish();
}

/*
for (var b_id in background_list) {
  bg = background_list[b_id];
  break;
}
*/
$(".draw-background-select").change(function(){
  bg = background_list[$(this).val()];
  /*
  $.each(background_list, function(index, item){
    item.hide();
  });
  background_list[$(this).val()].show();
  */
  drupal_draw_drawing.editor.setBackground($(this).val());
  elements['background'] = $(this).val();
  saveLocal(elements, 'background');
});

/***
Attributes for the objects in the palette
***/
var attributes = {
	coach: function(no){
		var src;
		$.get(imagePath, {op:"image",image:"coach", no:no},function(data){
			src = data;

		});
			JSON.stringify(src)
			return src;
		},
	player: function(no){
			var src;
		$.get(imagePath, {op:"image",image:"player", no:no},function(data){
			src = {src:data};

		});
			return src;

		}
}


if ($(".draw-diagram-input").length > 0) {
  /*
  if (typeof Drupal.settings.draw_clipart != undefined) {
    $.each(Drupal.settings.draw_clipart, function(index, image) {
      palette[index] = paper.image(image.imagepath, 450, 30, 25, 29);
      palette[index].attr("title","image");
    })
  }
  */
  var width = Math.round(Drupal.settings.draw_settings.canvas_width);
  palette['player'] = paper.image(image_path + "/player.png", (width + 50), 30, 25, 29);
  palette['player'].attr("title","player");

  palette['coach'] = paper.image(image_path + "/coach.png", (width + 10), 30, 25, 29);
  palette['coach'].attr("title","coach");

  palette['tools'] = [];
  palette['tools']['text'] = paper.image(image_path + "/type.png", (width + 10), 70, 29, 28);
  palette['tools']['text'].attr({"title":"text", opacity: "0.7"});

  palette['tools']['vector'] = paper.image(image_path + "/vector.png", (width + 10), 110, 29, 28);
  palette['tools']['vector'].attr({"title":"path", opacity: "0.7"});

  palette['tools']['circle'] = paper.image(image_path + "/circle.png", (width + 50), 110, 29, 28);
  palette['tools']['circle'].attr({"title":"circle", opacity: "0.7"});

  palette['tools']['freehand'] = paper.image(image_path + "/pencil.png", (width + 10), 150, 30, 27);
  palette['tools']['freehand'].attr({"title":"path", opacity: "0.7"});

  palette['tools']['rect'] = paper.image(image_path + "/rectangle.png", (width + 50), 150, 30, 27);
  palette['tools']['rect'].attr({"title":"rect", opacity: "0.7"});


/*
  palette['undo'] = paper.image(image_path + "/undo.png", 450, 230, 30, 27);
  palette['undo'].attr({"title":"undo"});
*/
  palette['trash'] = paper.image(image_path + "/trash.png", (width + 50), 190, 30, 27);
  palette['trash'].attr({"title":"trash"});

/**** Path dashes ****/
  palette['dashes'] = [];
  palette['dashes']['dash'] = paper.image(image_path + "/pathicon0.png", width + 10, 270, 29, 28).attr({"stroke-dasharray": ""});
  palette['dashes']['dash-'] = paper.image(image_path + "/pathicon1.png", width + 40, 270, 29, 28).attr({"stroke-dasharray": "-", opacity: "0.7"});
  palette['dashes']['dash--'] = paper.image(image_path + "/pathicon2.png", width + 70, 270, 30, 27).attr({"stroke-dasharray": "--", opacity: "0.7"});

  for (var dash in palette["dashes"]) {
    palette["dashes"][dash].click(function() {

      current_attributes["stroke-dasharray"] = this.attr("stroke-dasharray");
      
      for (var dash_type in palette["dashes"]) {
        palette["dashes"][dash_type].attr({opacity: "0.7"});
      };
      this.attr({opacity: 1});
    });
  }

  /***** Line width ***/
  palette['stroke-width'] = [];
  palette['stroke-width']['2'] = paper.image(image_path + "/stroke-narrow.png", (width + 10), 310, 29, 28).attr({"stroke-width": 2});
  palette['stroke-width']['4'] = paper.image(image_path + "/stroke-medium.png", (width + 40), 310, 29, 28).attr({"stroke-width": 4});
  palette['stroke-width']['6'] = paper.image(image_path + "/stroke-wide.png", (width + 70), 310, 29, 28).attr({"stroke-width": 6});

  for (var s_width in palette["stroke-width"]) {
    palette["stroke-width"][s_width].click(function() {

      current_attributes["stroke-width"] = this.attr("stroke-width");
      
      for (var stroke_icon in palette["stroke-width"]) {
        palette["stroke-width"][stroke_icon].attr({opacity: "0.7"});
      };
      this.attr({opacity: 1});
    });
  }

  /***** Arrows ***/
  palette['arrow-end'] = [];
  palette['arrow-end']["arrow"] = paper.image(image_path + "/arrow-arrow.png", (width + 10), 350, 29, 28).attr({"arrow-end": "diamond-wide-long"});
  palette['arrow-end']["oval"] = paper.image(image_path + "/arrow-ball.png", (width + 40), 350, 29, 28).attr({"arrow-end": "oval-wide-long"});
  palette['arrow-end']["none"] = paper.image(image_path + "/arrow-none.png", (width + 70), 350, 29, 28).attr({"arrow-end": "none"});

  for (var arrow in palette["arrow-end"]) {
    palette["arrow-end"][arrow].click(function() {

      current_attributes["arrow-end"] = this.attr("arrow-end");
      
      for (var arrow_icon in palette["arrow-end"]) {
        palette["arrow-end"][arrow_icon].attr({opacity: "0.7"});
      };
      this.attr({opacity: 1});
    });
  }

/**** Colors ****/
  palette['colors'] = {
    blue: paper.rect((width + 9), 400, 25, 25).attr({fill : "#77F", stroke: "#000", "stroke-width": 2}),
    red: paper.rect((width + 42), 400, 25, 25).attr({fill : "#F33", stroke: "#000", "stroke-width": 2}),
    black: paper.rect((width + 75), 400, 25, 25).attr({fill : "#000", stroke: "#000", "stroke-width": 2}),
    green: paper.rect((width + 9), 440, 25, 25).attr({fill : "#3F3", stroke: "#000", "stroke-width": 2}),
    white: paper.rect((width + 42), 440, 25, 25).attr({fill : "#FFF", stroke: "#000", "stroke-width": 2}),
    grey: paper.rect((width + 75), 440, 25, 25).attr({fill : "#777", stroke: "#000", "stroke-width": 2}),
  };

  for (var col in palette["colors"]) {
    palette["colors"][col].click(function() {
      current_attributes.stroke = this.attr("fill");

      for (var color in palette["colors"]) {
        palette["colors"][color].attr({stroke: "#000"})
      }
      this.attr({stroke: this.attr("fill")});
    })
  }

  var toolbox = paper.set();
  toolbox.push(palette['coach'],palette['player']);

// Palette functions.
//palette['ballLine'].drag(drupal_draw_drawing.editor.move, drupal_draw_drawing.editor.start, drupal_draw_drawing.editor.upOrigLine).attr({cursor: "pointer"});
function palette_tools_select(selected, background){
  palette_tools_deselect();
  selected.attr({opacity: 1});
  clear_element_events(background);
}
function palette_tools_deselect() {
  for (var tool in palette["tools"]) {
    palette["tools"][tool].attr({opacity: "0.6"});
  }
}
palette["tools"]['vector'].click(function(){
  palette_tools_select(this, bg);
  bg.drag(drupal_draw_drawing.editor.vector_move, drupal_draw_drawing.editor.vector_start, function(e) {
    drupal_draw_drawing.editor.vector_end(e);
    bg.undrag();
    palette_tools_deselect();
  }); //click(drupal_draw_drawing.editor.vector_start).attr({cursor: "crosshair"});
  /*
  bg.dblclick(function(e) {
    bg.unclick();
    drupal_draw_drawing.editor.vector_end(e);
    bg.undblclick();
    clear_element_events(this);
  }).attr({cursor: "auto"});
  */
}).attr({cursor: "pointer"});

palette["tools"]['text'].click(function(){
  palette_tools_select(this, bg);
  bg.click(function(e) {
    drupal_draw_drawing.editor.text_start(e);

    clear_element_events(this);
  }).attr({cursor: "text"});
}).attr({cursor: "pointer"});

palette["tools"]['circle'].click(function(){
  palette_tools_select(this, bg);
  bg.drag(drupal_draw_drawing.editor.circle_draw, drupal_draw_drawing.editor.circle_start, drupal_draw_drawing.editor.freehand_end).attr({cursor: "crosshair"});
}).attr({cursor: "pointer"});

palette["tools"]['freehand'].click(function(){
  palette_tools_select(this, bg);
  bg.drag(drupal_draw_drawing.editor.freehand_draw, drupal_draw_drawing.editor.freehand_start, drupal_draw_drawing.editor.freehand_end).attr({cursor: "crosshair"});
}).attr({cursor: "pointer"});

palette["tools"]['rect'].click(function(){
  palette_tools_select(this, bg);
  bg.drag(drupal_draw_drawing.editor.rectangle_draw, drupal_draw_drawing.editor.rectangle_start, drupal_draw_drawing.editor.freehand_end).attr({cursor: "crosshair"});
}).attr({cursor: "pointer"});

function isset(variable) {
  return (typeof variable != "undefined");
}
// The temp var. Frequently used below
var temp;
drupal_draw_drawing.editor = {
  setBackground: function(bg_id) {
    $.each(background_list, function(index, item){
      item.hide();
    });
    $(".draw-background-select").find("option[value='" + bg_id + "']").attr("selected", "selected");
    background_list[bg_id].show();
    bg = background_list[bg_id];
  },
  // Attributes for dragging instances
  start: function () {
      // storing original coordinates
      this.ox = this.attr("x");
      this.oy = this.attr("y");
      this.oop = this.attr("opacity");
      this.attr({opacity: .5});
  },
  move: function (dx, dy) {
      // move will be called with dx and dy
      this.attr({x: (Math.round(this.ox) + dx), y: (Math.round(this.oy) + dy)});
  },
  up: function () {
      // restoring state
      this.attr({opacity: this.oop});
      elements[this.attr("title")] = this.attr();
      saveLocal(elements, this.attr("title"));
      this.attr({opacity: 1});
  },
  // Make a line active
  activate_line: function() {
    if ($("body").data("active").length > 0) {
      drupal_draw_drawing.editor.deactivate_object($("body").data("active"));
    }
    $("body").data("active", this.attr("title"));

    for(var key in objectsArray[this.attr("title")]) {
      objectsArray[this.attr("title")][key].show().attr("opacity", 1);
    }
    $("body").data("active", this.attr("title"));
  },
  deactivate_object: function(objKey) {
    tempCurve = {};

    if (typeof objKey != "undefined" && objKey.indexOf("vector") > -1) {
      delete tempCurve[0];
      for(var j in tempCurve) {
        tempCurve[j].remove();
        delete tempCurve[j];
      }
    }
    else if (typeof objectsArray[objKey] != "undefined") {
      objectsArray[objKey].attr({opacity: 1}).undrag();
    }
  },
  // Make an object active
  activate_object: function(objTitle) {
    drupal_draw_drawing.editor.deactivate_object($("body").data("active"));
    $("body").data("active", objTitle);

    if (objTitle.indexOf("vector") === -1){
      objectsArray[objTitle].attr({opacity: "0.4"}).undrag();
      objectsArray[objTitle].drag(drupal_draw_drawing.editor.move, drupal_draw_drawing.editor.start, drupal_draw_drawing.editor.up); 
    }
    else {
      drupal_draw_drawing.editor.vectorPoints(objTitle); //objTitle);
    }
  },
  point_add: function(path_object, x, y) {
    var new_path = path_object.attr("path") + " " + x + " " + y;
    path_object.attr({path: new_path});

    return path_object;
  },
  text_start: function(e) {
    $("body").append('<div id="draw-text-input"><input type="text" /></div>');
    $("#draw-text-input").css({position: "absolute", top: e.pageY, left: e.pageX});
    $("#draw-text-input input").keyup(function(k){ 
      if (k.keyCode == 13) {
        tempObject = paper.text(e.layerX, e.layerY, $(this).val()).attr(current_attributes).attr({"font-size":"20px", type: "text"});
        tempObject.key = "text_" + i;

        objectsArray[tempObject.key] = tempObject;
        objectsArray[tempObject.key].attr({title: tempObject.key})
        objectsArray[tempObject.key].click(function(){ drupal_draw_drawing.editor.activate_object(this.attr("title")) });
        elements["text_" + i] = tempObject.attr();
        i++;
        saveLocal(elements);
        $("#draw-text-input").remove();
        bg.unclick().attr({cursor: "auto"});
      } 

    }).focus();
  },
  circle_start: function(x, y) {
    var canvas_offset = $("#draw-diagram").offset();

    tempObject = paper.circle((x - canvas_offset.left), (y - canvas_offset.top), 5);
    tempObject.attr({type: "circle", title: "circle_" + i}).attr(current_attributes);
    tempObject.key = "circle_" + i;
  },
  circle_draw: function(dx, dy, x, y) {
    tempObject.attr({r: Math.sqrt((dx * dx) + (dy * dy))});
  },
  circle_end: function() {
    bg.undrag().attr({cursor: "default"});
    elements["circle_" + i] = tempObject.attr();
    i++;
    saveLocal(elements);
  },
  vector_start: function(mx, my, event) {
    var canvas_offset = $("#draw-diagram").offset();
    var x = event.pageX - canvas_offset.left;
    var y = event.pageY - canvas_offset.top;
    // The object has not been created yet.
   // if (typeof tempObject == "undefined" || tempObject.type != "path") {
      tempObject = paper.path().attr(current_attributes);
      tempObject.key = "vector_" + i;
      i++;
      tempObject.coord = {x:x,y:y};
      tempObject.coord_old = {x:x,y:y};
   //   tempObject.attr({path: "M" + x + " " + y + " C" + x + " " + y + " " + x + " " + y, title: tempObject.key});
      tempObject.attr({path: "M" + x + "," + y, title: tempObject.key});

  /*  }
    else {
      drupal_draw_drawing.editor.vector_point_add(event);
    /*  var new_path = tempObject.attr("path") + " " + x + " " + y;
      tempObject.attr({path: new_path});
    
    }
  */
  },
  vector_move: function(dx, dy, x, y, event) {
    dx += tempObject.coord.x;
    dy += tempObject.coord.y;

    var middle_x = (dx + tempObject.coord.x) / 2,
    middle_y = (dy + tempObject.coord.y) / 2;

    var new_path = "M" + tempObject.coord.x + "," + tempObject.coord.y + "L " + middle_x + "," + middle_y + " " + dx + "," + dy;
    tempObject.attr({path: new_path});
  },
  vector_point_add: function(event) {
    var canvas_offset = $("#draw-diagram").offset();
    var x = event.pageX - canvas_offset.left;
    var y = event.pageY - canvas_offset.top;
    

    var new_path = tempObject.attr("path") + "L" + x + "," + y; //+ tempObject.coord.x + "," + tempObject.coord.y + " " + x + "," + y;
    tempObject.attr({path: new_path});
    tempObject.coord_old = tempObject.coord;
    tempObject.coord = {x:x,y:y}
  },
  vector_end: function(event) {
    tempObject.attr();

    elements[tempObject.key] = tempObject.attr();
    objectsArray[tempObject.key] = tempObject;
    objectsArray[tempObject.key].click(function(){ drupal_draw_drawing.editor.activate_object(this.attr("title")) });

    saveLocal(elements);
  },
  freehand_start: function(x, y) {
    tempObject = paper.path().attr(current_attributes);
    var canvas_offset = $("#draw-diagram").offset();
    tempObject.ox = x - canvas_offset.left;
    tempObject.oy = y - canvas_offset.top;
    tempObject.key = "path_" + i;
    i++;

    tempObject.attr({path: "M" + tempObject.ox + " " + tempObject.oy + " C" + tempObject.ox + " " + tempObject.oy});
  },
  freehand_draw: function(dx, dy, x, y) {
    dx += tempObject.ox;
    dy += tempObject.oy;

    var new_path = tempObject.attr("path") + " " + dx + " " + dy;
    tempObject.attr({path: new_path});
  },
  freehand_end: function() {
    bg.undrag().attr({cursor: "default"});
    objectsArray[tempObject.key] = tempObject;
    objectsArray[tempObject.key].attr("title", tempObject.key);
    elements[tempObject.key] = tempObject.attr();
    
    objectsArray[tempObject.key].click(function(){ drupal_draw_drawing.editor.activate_object(this.attr("title")) });

    saveLocal(elements);
  },
  // Attributes for manipulating lines
  pointStart: function () {
      // storing original coordinates
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");
      this.oop = this.attr("opacity");
      this.attr({opacity: .5});
  },
  pointMove: function (dx, dy) {
      // move will be called with dx and dy
      this.attr({cx: (Math.round(this.ox) + dx), cy: (Math.round(this.oy) + dy)});

      //gonna use the title quite a bit
  	var t = this.attr("title");

      objectsArray[t].attr("path","M"+tempCurve[1].attr("cx")+" "+ tempCurve[1].attr("cy")+"L"+objectsArray[t][2].attr("cx")+" "+objectsArray[t][2].attr("cy"));
  },
  pointMoveCurve: function (dx, dy) {
      // move will be called with dx and dy
      this.attr({cx: (Math.round(this.ox) + dx), cy: (Math.round(this.oy) + dy)});

      //gonna use the title quite a bit
      var t = this.attr("title");

       objectsArray[t].attr("path","M"
        +tempCurve[1].attr("cx")+" "+tempCurve[1].attr("cy")
        +"C"+tempCurve[1].attr("cx")+" "+tempCurve[1].attr("cy")
        +" "+tempCurve[2].attr("cx")+" "+tempCurve[2].attr("cy")
        +" "+tempCurve[3].attr("cx")+" "+tempCurve[3].attr("cy"));
  },
  pointUp: function () {
      // restoring state
      this.attr({opacity: this.oop});
      var attr = objectsArray[tempCurve[0]].attr();;
      // Odd difference between loaded and newly created curves.
      if (isset(attr.items)) {
        attr = attr[0].attrs;
      }

      elements[tempCurve[0]] = attr;
      saveLocal(elements);
  },
  rectangle_start: function(x, y) {
    var canvas_offset = $("#draw-diagram").offset();

    tempObject = paper.rect((x - canvas_offset.left), (y - canvas_offset.top), 5, 5);
    tempObject.attr({title: "rect_" + i}).attr(current_attributes);
    tempObject.key = "rect_" + i;
  },
  rectangle_draw: function(dx, dy, x, y) {
    tempObject.attr({width: Math.sqrt(dx * dx), height: Math.sqrt(dy * dy)});
  },
  rectangle_end: function() {
    bg.undrag().attr({cursor: "default"});
    /*
    elements["rect_" + i] = tempObject.attr();

    i++;
    saveLocal(elements);
    */
    drupal_draw_drawing.editor.finishElement(tempObject);
  },
  // Attributes for dragging prototypes
  startOrig: function () {
  	temp = this.clone();
  		var label = i;
  		i++;
  //	     }
  	$("body").data("imagelabel",label);
  	 // storing original coordinates
  	temp.ox = temp.attr("x");
  	temp.oy = temp.attr("y");
  	temp.attr({opacity: 0.5});
  },
  moveOrig: function (dx, dy) {
      // move will be called with dx and dy
      temp.attr({x: temp.ox + dx, y: temp.oy + dy});
  },
  upOrig: function () {
    // restoring state
    temp.attr({opacity: 1});
    temp.undrag();
    elements[this.attr("title") + "_" + i] = drawObject(this.attr("title"), i, temp.attr());
    i++;
    $("body").data("imagelabel","");
    temp.remove();
    saveLocal(elements);
    $("body").data("active", this.attr("title") + "_" + i);
  },
  upOrigLine: function(){
  	var lineArray = current_attributes;
    lineArray.path = [];
  	lineArray.path[0]=["M",this.attr("x"),this.attr("y")];

  	lineArray.path[1]=["C",this.attr("x"),this.attr("y"),(this.attr("x")+30),(this.attr("y")+40),(this.attr("x")+60),(this.attr("y")+60)];

  	var templine = drawLine(this.attr("title"),i, lineArray);

    elements[this.attr("title") + "_" + i] = templine;
    saveLocal(elements);
  	this.attr({x: this.ox, y: this.oy, opacity: 1});
    $("body").data("active", this.attr("title") + "_" + i);
    i++;
  },
  finishElement: function(element) {
    var key = element.type + "_" + i;
    i++;
    objectsArray[key] = element;
    objectsArray[key].attr("title", key);
    elements[key] = element.attr();
    
    objectsArray[key].click(function(){ drupal_draw_drawing.editor.activate_object(this.attr("title")) });
    element = {};
    saveLocal(elements);
  },
  /*********
  * Draw curved line. Requires an attributes-object
  *********/
vectorPoints: function(key){
  // We need pData a lot, so it is abbreviated
  var p = objectsArray[key].attr("path");

  // Odd difference between newly created and loaded curves.
  if (isset(p.items)) {

    var x = p[0]["attrs"]["path"][1][1];
    var y = p[0]["attrs"]["path"][1][2];
    var x1 = p[0]["attrs"]["path"][1][3];
    var y1 = p[0]["attrs"]["path"][1][4];
    var x2 = p[0]["attrs"]["path"][1][5];
    var y2 = p[0]["attrs"]["path"][1][6];
  }
  else {
    var x = p[0][1];
    var y = p[0][2];
    var y1 = p[1][2];
    var x1 = p[1][1];
    var y2 = p[2][2];
    var x2 = p[2][1];
  }

  tempCurve[0] = key
  tempCurve[1] = paper.circle(x,y, 7);
  tempCurve[1].attr({"title": key, "fill": "#F00"});
  tempCurve[1].drag(drupal_draw_drawing.editor.pointMoveCurve,drupal_draw_drawing.editor.pointStart,drupal_draw_drawing.editor.pointUp);

  tempCurve[2] = paper.circle(x1,y1, 7);
  tempCurve[2].attr({"title": key, "fill": "#FFF"});
  tempCurve[2].drag(drupal_draw_drawing.editor.pointMoveCurve,drupal_draw_drawing.editor.pointStart,drupal_draw_drawing.editor.pointUp);

  tempCurve[3] = paper.circle(x2,y2, 7);
  tempCurve[3].attr({"title": key, "fill": "#FFF"});
  tempCurve[3].drag(drupal_draw_drawing.editor.pointMoveCurve,drupal_draw_drawing.editor.pointStart,drupal_draw_drawing.editor.pointUp);
  
  }
};

toolbox.drag(drupal_draw_drawing.editor.moveOrig, drupal_draw_drawing.editor.startOrig, drupal_draw_drawing.editor.upOrig).attr({cursor: "pointer"});

function clear_element_events(element) {
  if (typeof element.events == "undefined") {
    return false;
  }
  while(element.events.length){          
            var e = element.events.pop();
            e.unbind();
        }
}

palette['trash'].click(function(){
  // Lines are actually 3 objects. They all need to be removed.
  if($("body").data("active").indexOf("Line") > -1) {
    for (var j in objectsArray[$("body").data("active")]) {
      objectsArray[$("body").data("active")][j].remove();
    }
  }
  else {
    // Other objects.
    objectsArray[$("body").data("active")].remove();
  }
  // Delete the data of the object.
  delete objectsArray[$("body").data("active")];
  delete elements[$("body").data("active")];
  saveLocal(elements);
  $("body").data("active", "");
});

}

var saved_drawing;
if ($(".draw-diagram-input").length && $(".draw-diagram-input").val().length > 2) {
  saved_drawing = JSON.parse($(".draw-diagram-input").val());
  if (typeof saved_drawing.background != "undefined") {
    drupal_draw_drawing.editor.setBackground(saved_drawing.background);
    delete saved_drawing.background;
  }
}
else {
  saved_drawing = {}; //JSON.parse(Drupal.settings.draw.drawing);
}
if (typeof saved_drawing != "undefined") {
  for(var element_title in saved_drawing) {
    drawFromJSON(element_title, saved_drawing[element_title]);
  }
}
$("body").data("active", "");
});
})(jQuery);