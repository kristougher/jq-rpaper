(function ($) {
  var palette = {},
  tempObject, tempCurve = {},
  i = 0,
  current_attributes = {"stroke-width": 2},
  bbox = {},
  drupal_draw_drawing = {},
  elements = {},
  objectsArray = {},
  background_list = {};
  var paper, contents = {}, undo = {};
  var temp;
  var bg;
  var editor = {
    currentObjectID: "",
  setBackground: function(backgrounds, bg_id, nosave) {
    $.each(backgrounds, function(index, item){
      item.hide();
    });
    backgrounds[bg_id].show();
    bg = backgrounds[bg_id];
    if (typeof nosave != "undefined" && !nosave) {
      elements['background'] = bg_id;
      editor.saveLocal();
    }
  },
  // Attributes for dragging instances
  start: function () {
    if (this.type == "circle") {
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");
    }
    else {
      this.ox = this.attr("x");
      this.oy = this.attr("y");
    }
    bbox.ox = bbox.rect.attr("x");
    bbox.oy = bbox.rect.attr("y");
    // Store the transform object.
    bbox.transform_storage = this.transform();
    bbox.set.transform(this.transform());

    editor.bbox_hide();
    bbox.move = {};

    // storing original coordinates
    this.oop = this.attr("opacity");
  },
  move: function (dx, dy) {
    bbox.set.transform(bbox.transform_storage + "T" + (dx) + "," + (dy));
    bbox.move = {x: dx, y: dy};
  },
  up_trash: function () {
      
      objectsArray[editor.currentObjectID].transform(bbox.transform_storage + "t" + bbox.move.x + "," + bbox.move.y); // bbox.set.transform());

      objectsArray[editor.currentObjectID].attr({opacity: this.oop});

      elements[editor.currentObjectID] = objectsArray[editor.currentObjectID].attr();
      editor.saveLocal();
  },
  up: function () {
      if (editor.isset(bbox.move.x)) {
        this.transform(bbox.transform_storage + "T" + bbox.move.x + "," + bbox.move.y); // bbox.set.transform());
      }
      bbox.move = {};
      this.attr({opacity: this.oop});
      elements[this.attr("title")] = this.attr();
      editor.saveLocal();
  },
  // Make a line active
  activate_line: function() {
    if (editor.currentObjectID.length > 0) {
      editor.deactivate_object($("body").data("active"));
    }
    $("body").data("active", this.attr("title"));

    for(var key in objectsArray[this.attr("title")]) {
      objectsArray[this.attr("title")][key].show().attr("opacity", 1);
    }
    editor.currentObjectID = this.attr("title");
  },
  deactivate_object: function(objKey) {
    if (objKey.length > 0 && objKey.indexOf("vector") > -1) {
      delete tempCurve[0];
      for(var j in tempCurve) {
        tempCurve[j].remove();
        delete tempCurve[j];
      }
      tempCurve = {};
    }
    else if (typeof objectsArray[objKey] != "undefined") {
      objectsArray[objKey].attr({opacity: 1}).undrag();
    }
    if (editor.isset(bbox.set)) {
      bbox.set.exclude(objectsArray[objKey]);
      bbox.set.hide();
      bbox.set.transform("");
    }
    editor.currentObjectID = "";
  },
  // Make an object active
  activate_object: function(objTitle) {
    editor.deactivate_object(editor.currentObjectID);
    undo = {
      id: objTitle,
      newObject: false,
      attr: objectsArray[objTitle].attr()
    }
    editor.currentObjectID = objTitle;

    if (objTitle.indexOf("vector") === -1){
      objectsArray[objTitle].undrag();
      // If the bounding box object is not yet set, create it.
      if (!editor.isset(bbox.rect)) {
        editor.bbox_create();
      }
      editor.bbox_enable(objectsArray[objTitle]); 

      objectsArray[objTitle].drag(editor.move, editor.start, editor.up); 
    }
    else {
      editor.vectorPoints(objTitle);
    }
  },
  bbox_create: function() {
    paper.setStart();
    bbox.rect = paper.rect(0,0,1,1).attr({opacity: .3,"stroke-dasharray": "-", opacity: 0.1});
    bbox.rotate = paper.circle(0,0,10).attr({fill: "#efefef"});
    bbox.resize = paper.rect(-15, -15, 15, 15).attr({fill: "#efefef"});
    bbox.set = paper.setFinish();
    bbox.set.hide();
    bbox.resize.drag(editor.bbox_resize_move, editor.bbox_resize_start, editor.bbox_resize_end);
    bbox.rotate.drag(editor.bbox_rotate_move, editor.bbox_rotate_start, editor.bbox_rotate_end);
  },
  bbox_hide: function() {
 /*   bbox.set.hide();
    
    bbox.rect.hide();
    bbox.rotate.hide();
    bbox.resize.hide();
*/
  },
  bbox_show: function() {
    bbox.set.show();
    /*
    bbox.rect.show();
    bbox.rotate.show();
    bbox.resize.show();
    */
  },
  // When an object is selected, adjust the settings of the bounding box.
  bbox_enable: function($object) {
    bbox.coords = $object.getBBox();
    bbox.set.attr({x: bbox.coords.x, y: bbox.coords.y}).toFront(); //, transform: $object.transform()});
    bbox.set.push($object);
    
    bbox.rect.attr({width: bbox.coords.width, height: bbox.coords.height});
    bbox.rotate.attr({cx: (bbox.coords.x + bbox.coords.width), cy: (bbox.coords.y + bbox.coords.height)});
    bbox.set.show();
  },
  bbox_resize_start: function() {
    bbox.drag = {
      x: Math.round(bbox.rect.attr("x")),
      y: Math.round(bbox.rect.attr("y")),
      x2: Math.round(bbox.rect.attr("x") + bbox.rect.attr("width")),
      y2: Math.round(bbox.rect.attr("y") + bbox.rect.attr("height"))
    };
    var sqx = Math.pow(bbox.drag.x - bbox.drag.x2, 2), sqy = Math.pow(bbox.drag.y - bbox.drag.y2, 2);
    bbox.drag.original_size = Math.sqrt(sqx + sqy);

    bbox.transform_storage = objectsArray[editor.currentObjectID][0].transform();

    editor.bbox_hide();
  },
  /**
   * Action when dragging the resize object.
   */
  bbox_resize_move: function(dx, dy) {
    var newsqx = Math.pow((bbox.drag.x + dx) - bbox.drag.x2, 2);
    var newsqy = Math.pow((bbox.drag.y + dy) - bbox.drag.y2, 2);
    bbox.drag.new_size = Math.sqrt(newsqx + newsqy);
    objectsArray[editor.currentObjectID].transform(bbox.transform_storage + "s" + (bbox.drag.new_size/bbox.drag.original_size));
    bbox.move = {scale: (bbox.drag.new_size/bbox.drag.original_size)};
  },
  /**
   * Action when finishing resizing action. 
   */
  bbox_resize_end: function() {
    objectsArray[editor.currentObjectID].transform(bbox.transform_storage + "s" + bbox.move.scale);
    
    elements[editor.currentObjectID] = objectsArray[editor.currentObjectID][0].attr();
    editor.saveLocal();
    editor.activate_object(editor.currentObjectID);
  },
  bbox_rotate_start: function() {
    bbox.drag = {
      x: Math.round(bbox.rect.attr("x")),
      x2: Math.round(bbox.rect.attr("x") + bbox.rect.attr("width")),
    };
    bbox.transform_storage = objectsArray[editor.currentObjectID][0].transform();
    editor.bbox_hide();
  },
  bbox_rotate_move: function(dx, dy) {
    // 'Convert' to a 90dg triangle. Get the lengths of the sides.
    var base =  (bbox.drag.x2 + dx) - bbox.drag.x;
    var c = Math.sqrt(Math.pow(dy, 2) + Math.pow(base, 2));
    var a = Math.abs(dy);

    // Use cosinus relation to get the angle.
    var acos =  (((base * base) + (c * c)) - (a * a)) / (base * c * 2);

    // Finish cosinus relation and convert from radians to degrees.
    var angle = Math.acos(acos) * 360 / (Math.PI * 2);

    // Invert the angle if the mouse is moved up.
    if (dy < 0) {
      angle *= -1;
    }
    objectsArray[editor.currentObjectID].transform(bbox.transform_storage + "r" + angle);
    bbox.move = {rotate: angle};
  },
  bbox_rotate_end: function() {
    objectsArray[editor.currentObjectID].transform(bbox.transform_storage + "r" + bbox.move.rotate);
    
    elements[editor.currentObjectID] = objectsArray[editor.currentObjectID][0].attr();
    editor.saveLocal();
    editor.activate_object(editor.currentObjectID);
  },
  point_add: function(path_object, x, y) {
    var new_path = path_object.attr("path") + " " + x + " " + y;
    path_object.attr({path: new_path});

    return path_object;
  },
  addImage: function(attr) {
    attr.type = "image";
    tempObject = paper.image(attr.src, attr.x, attr.y, attr.width, attr.height);
    editor.finishElement(tempObject);
  },
  text_start: function(e) {
    $("body").append('<div id="draw-text-input"><input type="text" /></div>');
    $("#draw-text-input").css({position: "absolute", top: e.pageY, left: e.pageX});
    $("#draw-text-input input").keyup(function(k){ 
      if (k.keyCode == 13) {
        tempObject = paper.text(e.layerX, e.layerY, $(this).val()).attr(current_attributes).attr({"font-size":"20px", type: "text"});
        editor.finishElement(tempObject);

        tempObject.remove();
        tempObject = {};

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
    editor.finishElement(tempObject);
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
      if (editor.isset(attr.items)) {
        attr = attr[0].attrs;
      }

      elements[tempCurve[0]] = attr;
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

    editor.finishElement(tempObject);
  },
  /*********
  * Draw curved line. Requires an attributes-object
  *********/
  vector_start: function(mx, my, event) {
    var canvas_offset = $("#draw-diagram").offset();
    var x = event.pageX - canvas_offset.left;
    var y = event.pageY - canvas_offset.top;
    // The object has not been created yet.

      tempObject = paper.path().attr(current_attributes);
      tempObject.key = "vector_" + i;
      i++;
      tempObject.coord = {x:x,y:y};
      tempObject.coord_old = {x:x,y:y};

      tempObject.attr({path: "M" + x + "," + y, title: tempObject.key});
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
    bg.undrag();
    
    var key = 'vector_' + i;
    i++;
    var attr = tempObject.attr();
    var no_var;

    editor.drawObject('vector', key, attr, no_var, function(objKey) {
      editor.activate_object(objKey);
    });

    tempObject.remove();
    tempObject = {};
  },
  vectorPoints: function(key){
    // We need pData a lot, so it is abbreviated
    var p = objectsArray[key].attr("path");
  
    // Odd difference between newly created and loaded curves.
    if (editor.isset(p.items) && p[0]["attrs"]["path"][1][0] == "C") {
      // Existing.
      var x = p[0]["attrs"]["path"][1][1];
      var y = p[0]["attrs"]["path"][1][2];
      var x1 = p[0]["attrs"]["path"][1][3];
      var y1 = p[0]["attrs"]["path"][1][4];
      var x2 = p[0]["attrs"]["path"][1][5];
      var y2 = p[0]["attrs"]["path"][1][6];
    }
    else {
      // Newly created lines.
      var x = p[0]["attrs"]["path"][0][1];
      var y = p[0]["attrs"]["path"][0][2];
      var x1 = p[0]["attrs"]["path"][1][1];
      var y1 = p[0]["attrs"]["path"][1][2];
      var x2 = p[0]["attrs"]["path"][2][1];
      var y2 = p[0]["attrs"]["path"][2][2];
    }
  
    tempCurve[0] = key
    tempCurve[1] = paper.circle(x,y, 7);
    tempCurve[1].attr({"title": key, "fill": "#F00"});
    tempCurve[1].drag(editor.pointMoveCurve,editor.pointStart,editor.pointUp);
  
    tempCurve[2] = paper.circle(x1,y1, 7);
    tempCurve[2].attr({"title": key, "fill": "#FFF"});
    tempCurve[2].drag(editor.pointMoveCurve,editor.pointStart,editor.pointUp);
  
    tempCurve[3] = paper.circle(x2,y2, 7);
    tempCurve[3].attr({"title": key, "fill": "#FFF"});
    tempCurve[3].drag(editor.pointMoveCurve,editor.pointStart,editor.pointUp);
  },
  drawObject: function (type, key, attr, callback) {
    if (type == "freehand" || type == "vector") {
      type = "path";
    }
    attr.type = type;
    if (typeof nosave == 'undefined') {
      objectsArray[key] = paper.add([attr]);
      objectsArray[key].attr({title: key});

      objectsArray[key].click(function() {
        editor.activate_object(this.attr("title")) 
      });
      return attr;
    }
    else {
      paper.add([attr]);
    }
    callback(key);
  },
  drawFromJSON: function (key, jsonstr, nosave){
    var info = key.split("_");

    var objTemp = jsonstr, temp;
    temp = editor.drawObject(info[0], info[1], objTemp, nosave);

    if (typeof nosave == 'undefined') { 
      elements[key] = temp;
      i++;
    }
  },
  // Save newly created elements.
  finishElement: function(element) {
    var key = element.type + "_" + i;
    i++;
    var attr = element.attrs;
    var no_var;
    undo = {
      id: key,
      newObject: true 
    }
    editor.drawObject(element.type, key, attr, function(objkey) {
      editor.activate_object(objkey);
    });
    // This slightly 
    element.remove();
    element = {};
//    bg.hide();
  },
  saveLocal: function (callback){
    // Undo option
    /*
    if(typeof localStorage !=="undefined") {
      var lastIndex = false;
      for (lastIndex in objects_array);

      var attr = elements[lastIndex];
      attr.id = lastIndex;
      localStorage.undo = JSON.stringify(attr);

    }
    */
    contents = {};
    $("#draw-diagram svg a").each(function(){
      var tempAttr = {};
      $.each($(this).children()[0].attributes, function(index, attr) {
        tempAttr[attr.nodeName] = attr.value;
      });
      tempAttr.type = $(this).children()[0].tagName;
      contents[$(this).attr("title")] = tempAttr;
    });
    if (editor.isset(callback)) {
      callback(contents);
    }
    $(".draw-input-wrapper textarea").val(JSON.stringify(contents)); //objects_array));
  },
  isset: function (variable) {
      return (typeof variable != "undefined");
    }
};

  /**
   * The function initiating the paper.
   */
  $.fn.raphaelPaper = function(options) {
    var image_path = (editor.isset(options) && editor.isset(options.image_path)) ? options.image_path : "images";
    var settings = $.extend({
      canvas_width: 400,
      canvas_height: 640,
      backgrounds: {},
      background_image: {},
      image_palette: {},
      // Tools regarding the attributes of the drawn object.
      attr_tools: {
        "stroke-dasharray": {
          "none": image_path + "/pathicon0.png",
          "-": image_path + "/pathicon1.png",
          "--": image_path + "/pathicon2.png"
        },
        "stroke-width": {
          2: image_path + "/stroke-narrow.png",
          4: image_path + "/stroke-medium.png",
          6: image_path + "/stroke-wide.png"
        },
        "arrow-end": {
          "diamond-wide-long": image_path + "/arrow-arrow.png",
          "oval-wide-long": image_path + "/arrow-ball.png",
          "none": image_path + "/arrow-none.png"
        }
      },
      stroke: [
        "#77F", "#F33", "#000", "#3F3", "#FFF", "#777"
      ],
      fill: [
        "#77F", "#F33", "#000", "#3F3", "#FFF", "#777"
      ],
      tools: {
        texttool: { 
          icon_url: image_path + "/type.png",
          action: function() {
            bg.click(function(e) {
              editor.text_start(e);

              clear_element_events(this);
            }).attr({cursor: "text"});
          }
        },
        vector: {
          icon_url: image_path + "/vector.png",
          action: function(){

            bg.drag(editor.vector_move, editor.vector_start, function(e) {
              editor.vector_end(e);
              bg.undrag();
            });
          }
        },
        circle: {
          icon_url: image_path + "/circle.png",
          action: function(){
            bg.drag(editor.circle_draw, editor.circle_start, editor.freehand_end).attr({cursor: "crosshair"});
          }
        },
        freehand: {
          icon_url: image_path + "/pencil.png",
          action: function(){
            bg.drag(editor.freehand_draw, editor.freehand_start, editor.freehand_end).attr({cursor: "crosshair"});
          }
        },
        rect: {
          icon_url: image_path + "/rectangle.png",
          action: function(){
            bg.drag(editor.rectangle_draw, editor.rectangle_start, editor.freehand_end).attr({cursor: "crosshair"});
          }
        },
      },
      // Functions to apply only on existing selected objects.
      onActiveObject: {
        toFront: {
          icon_url: image_path + "/shape_move_front.png",
          action: function(objTitle) {
            if ($("body").data("active").indexOf("vector") > -1) {
              objectsArray[objTitle][0].toFront();
            }
            else  {
              objectsArray[objTitle].toFront();
            }
          }
        },
        // Send object to the back of the stack.
        toBack: {
          icon_url: image_path + "/shape_move_back.png",
          action: function(objTitle) {
            if ($("body").data("active").indexOf("vector") > -1) {
              objectsArray[objTitle][0].toBack();
            }
            else  {
              objectsArray[objTitle].toBack();
            }
            bg.toBack();
          }
        },
        trash: {
          icon_url: image_path + "/trash.png",
          action: function(objTitle){
            // Lines are actually 3 objects. They all need to be removed.
            if($("body").data("active").indexOf("vector") > -1) {
              for (var j in objectsArray[$("body").data("active")]) {
                objectsArray[$("body").data("active")][j].remove();
              }
            }
            else {
              // Other objects.
              objectsArray[editor.currentObjectID].remove();
            }
            // Delete the data of the object.
            delete objectsArray[editor.currentObjectID];
            delete elements[editor.currentObjectID];
            editor.currentObjectID = "";
            bbox.set.hide();
          }
        }
      },
      general : {
        save: {
          action: function() {
            editor.saveLocal();
          },
          icon_url: image_path + "/disk.png"
        }
        /*
        undo: {
          action: function () {
            if (undo.newObject) {
              objectsArray[undo.id].remove();
              delete objectsArray[undo.id];
            }
            else {
              objectsArray[undo.id].attr(undo.attr.attr());
            }
            console.log(undo);
          },
          icon_url: image_path + "/arrow_undo.png"
        }
        */
      }
    /*
    palette['undo'] = paper.image(image_path + "/undo.png", 450, 230, 30, 27);
    palette['undo'].attr({"title":"undo"});
    */
    }, options);
    // Setting up the required markup around the widget.
    this.wrap('<div class="draw-widget-diagram"></div>');
    this.wrap('<div class="draw-input-wrapper"></div>');
    this.closest(".draw-widget-diagram").prepend('<div class="draw-view-source">View source</div>');
    this.closest(".draw-widget-diagram").prepend('<div id="draw-tools-palette"></div>');
    $("#draw-tools-palette").prepend('<div id="draw-image-palette"></div>');
    this.closest(".draw-widget-diagram").prepend('<div id="draw-diagram"></div>');

    // Toggle source view.
    $(".draw-view-source").click(function(){
      $(this).siblings(".draw-input-wrapper").toggle();
    });
    
    // Where it all happens. Initiating the paper.
    paper = Raphael(document.getElementById("draw-diagram"), settings.canvas_width, settings.canvas_height);
    var palette = {tools: []}, width = settings.canvas_width;

    // Setting up the toolboxes. 
    // First the images to be used.
    $.each(settings.image_palette, function(index, item) {
      $("#draw-image-palette").append('<div data-img_id="' + index + '" class="draw-clipart draw-tool-icon" id="draw-' + index + '" style="background-image: url(' + item.src + ');"></div>');
    });
    $(".draw-clipart").click(function(){
        // Add the 
        settings.image_palette[$(this).data("img_id")].x = (settings.canvas_width / 2);
        settings.image_palette[$(this).data("img_id")].y = (settings.canvas_height / 2);

        editor.addImage(settings.image_palette[$(this).data("img_id")]);
    });

    // Drawing tools.
    $("#draw-tools-palette").append('<div class="draw-tool-section draw-tools" data-attr="type"></div>');
    $.each(settings.tools, function(index, item) {
      $(".draw-tools").append('<div class="draw-tool-icon ' + index + '" style="background-image: url(' + item.icon_url + ');">' + index + '</div>');
      $(".draw-tools ." + index).click(function(){
        item.action();
        $(this).parent().find(".draw-tool-icon").css("opacity", "0.5");
        $(this).css("opacity", 1);
        clear_element_events(bg);
      });
    });

    // Tools on existing objects.
    $("#draw-tools-palette").append('<div class="draw-tool-section draw-tools-existing" data-attr="type"></div>');
    $.each(settings.onActiveObject, function(index, item) {
      $(".draw-tools-existing").append('<div class="draw-tool-icon ' + index + '" style="background-image: url(' + item.icon_url + ');">' + index + '</div>');
      $(".draw-tools-existing ." + index).click(function(){
        if (("undefined" == typeof editor.currentObjectID) || (editor.currentObjectID == "") || !editor.currentObjectID) {
          return false;
        }
        item.action(editor.currentObjectID);
      });
    });
    // Tools on existing objects.
    $("#draw-tools-palette").append('<div class="draw-tool-section draw-tools-general" data-attr="type"></div>');
    $.each(settings.general, function(index, item) {
      $(".draw-tools-general").append('<div class="draw-tool-icon ' + index + '" style="background-image: url(' + item.icon_url + ');">' + index + '</div>');
      $(".draw-tools-general ." + index).click(function(){
        item.action();
      });
    });

    var this_section;
    // Attribute tools
    $.each(settings.attr_tools, function(index, item) {
      this_section = '<div class="draw-tool-section draw-' + index + '" data-attr="' + index + '">';
      $.each(item, function(attr_value, icon_url) {
        this_section += '<div class="draw-tool-icon" style="background-image: url(' + icon_url + ');">' + attr_value + '</div>'; 
      });

      this_section += '</div>';
      $("#draw-tools-palette").append(this_section);
    });

    // Assign stroke palette.
    this_section = '<div class="draw-tool-section draw-stroke" data-attr="stroke">';
    $.each(settings.stroke, function(index, item) {
      this_section += '<div class="draw-tool-icon" style="border: 2px solid ' + item + '">' + item + '</div>';
    });
    this_section += '<div class="draw-tool-icon none">none</div>';
    $("#draw-tools-palette").append(this_section);

    // Fill palette
    this_section = '<div class="draw-tool-section draw-fill" data-attr="fill">';
    $.each(settings.stroke, function(index, item) {
      this_section += '<div class="draw-tool-icon" style="background: ' + item + '">' + item + '</div>';
    });
    this_section += '<div class="draw-tool-icon none">none</div>';
    $("#draw-tools-palette").append(this_section);
    delete this_section;
    
    // Generic behavior for all attribute tool buttons.
    $("#draw-tools-palette .draw-tool-icon").bind("click", function(){
      current_attributes[$(this).parent().data("attr")] = $(this).text();
      $(this).siblings().css('opacity', 0.5);
      $(this).css('opacity', 1);
      // If there is an active object, assign the attribute to it.
      if (editor.currentObjectID.length > 0) {
        objectsArray[editor.currentObjectID].attr($(this).parent().data("attr"), $(this).text());
        elements[editor.currentObjectID] = objectsArray[editor.currentObjectID][0].attr();
      }
    });
    /*************************************************
     * Set up the backgrounds and background selector.
     *************************************************/
    var background_object, background_list = {}, background_index = 0;
    if (typeof settings.backgrounds != 'undefined' && settings.backgrounds.length > 0) {
      $("#draw-tools-palette").prepend('<div class="draw-tool-section"><span>Select background: </span>'
      + '<select class="draw-background-select" id="draw-background"></select><div>');
      // Iterate through backgrounds.
      for (var background_id in settings.backgrounds) {
        paper.setStart();
        paper.rect(0,0,settings.canvas_width, settings.canvas_height).attr({"fill": "#fefefe"});

        background_object = settings.backgrounds[background_id];
        $(".draw-background-select").append('<option value="' + background_id + '">' + background_object.title + '</option>');

        for(var index in background_object.content) {
          var item = background_object.content[index];
          editor.drawFromJSON(index, item, true);
        }

        background_list[background_id] = paper.setFinish();
        background_list[background_id].hide();

        if (background_index === 0) {
          bg = background_list[background_id];
          background_index++;
          background_list[background_id].show();
        }
      }
      $(".draw-background-select").change(function() { editor.setBackground(background_list, $(this).val()) });
    }
    else if (editor.isset(settings.background_image.src)) {
      bg = paper.image(settings.background_image.src, 0, 0, settings.background_image.width, settings.background_image.height);
    }
    else {
      paper.setStart();
      paper.rect(0,0, settings.canvas_width, settings.canvas_height).attr({"fill": "#FFF", stroke: "#666"});
      bg = paper.setFinish();
    }
    bg.click(function(){
      if (editor.currentObjectID.length > 0) {
        editor.deactivate_object(editor.currentObjectID);
      }
    });
    
    function clear_element_events(element) {
      if (typeof element.events == "undefined") {
        return false;
      }
      while(element.events.length){          
                var e = element.events.pop();
                e.unbind();
            }
    }

    var saved_drawing;
    if (this.val().length > 2) {
      saved_drawing = JSON.parse($(".draw-diagram-input").val());
      if (typeof saved_drawing.background != "undefined") {
        editor.setBackground(background_list, saved_drawing.background, true);
        $(".draw-background-select").find("[value='" + saved_drawing.background + "']").attr("selected", "selected");
        delete saved_drawing.background;
      }
    }
    else {
      saved_drawing = {};
    }
    if (typeof saved_drawing != "undefined") {
      for(var element_title in saved_drawing) {
        editor.drawFromJSON(element_title, saved_drawing[element_title]);
      }
    }

    $("body").data("active", "");
  };
  /*
  $(document).ready(function(){
    $(".draw-diagram-input").raphaelPaper({backgrounds: Drupal.settings.draw_settings.backgrounds });
  });
*/
})(jQuery);