
(function ($) {
  var draw_methods = {

    drawLine: function(objType,no,pData) {
      // Constructs an object ID
      var objKey = objType + "_" + no;

      objectsArray[objKey] = new Array();

      // We need pData a lot, so it is abbreviated
      var p = pData;

      // Constructs the first part of the SVG path-string p[0] is the starting coordinates.
      // The following 'C' is then shifted from array
      var path = "M"+p[0][1]+" "+p[0][2]+p[1].shift();

      //var firstLineNo = p[1].shift();
      // Adds the first coordinate.
      path = path+ p[1].shift(); //firstLineNo;

      for(var n in p[1]){
        path = path+" "+p[1][n];
      }
      var x = p[0][1];
      var y = p[0][2];
      var y2 = pData[1].pop();
      var x2 = pData[1].pop();

      objectsArray[objKey][0] = paper.path(path);
      objectsArray[objKey][0].attr(eval("attributes."+objType)).attr(current_attributes);
      if ($(".draw-diagram-input").length > 0) {
        objectsArray[objKey][1] = paper.circle(x,y, 7);
        objectsArray[objKey][1].attr("title",objKey).attr("fill","#F00").click(activate_line);

        objectsArray[objKey][3] = paper.circle(x2,y2, 7);
        var y1 = pData[1].pop();
        var x1 = pData[1].pop();

        objectsArray[objKey][2] = paper.circle(x1,y1, 7);
        objectsArray[objKey][3].attr("title",objKey).attr("fill","#FFF");
        objectsArray[objKey][3].drag(pointMoveCurve,pointStart,pointUp);
        objectsArray[objKey][1].drag(pointMoveCurve,pointStart,pointUp);
        objectsArray[objKey][2].drag(pointMoveCurve,pointStart,pointUp);
        objectsArray[objKey][2].attr("opacity",0).hide();
        objectsArray[objKey][3].attr("opacity",0).hide();

        objectsArray[objKey][2].attr("title",objKey).attr("fill","#FFF");
      }
      return objectsArray[objKey][0].attr("path");
    },
    /**********
    * Draw figure from graphics file
    ***********/
    drawFigure: function (type, no, attr) {
      var key = type + "_" + no;
        objectsArray[key] = paper.image(attr.src,attr.x,attr.y,attr.width,attr.height);
        objectsArray[key].drag(move, start, up);
        objectsArray[key].attr("title", key);
        if($("body").data("imagesrc")){
              objectsArray[key].attr({src:$("body").data("imagesrc")});
          $("body").data("imagesrc","");
        }

        return objectsArray[key].attr();
    },
    /**
     * Draw generic.
     */
    drawObject: function(type, key, attr) {
      key = type + "_" + key;
      if (type == "coach" || type == "player") {
        type = "image";
      }
      if (type == "freehand") {
        type = "path";
      }
      objectsArray[key] = eval("paper." + type + "({})");
      objectsArray[key].attr(attr).drag(move, start, up);
      objectsArray[key].click(function () {
        $("body").data("active", this.attr("title"));
      });

      return attr;
    },
    /***************
    * Get saved data
    ****************/
    travLocal: function(existing_data) {
      for(var key in existing_data){
        drawFromJSON(key,existing_data[key]);
      }
    },
    drawFromJSON: function(key,jsonstr) {
      var info = key.split("_");

      var objTemp = jsonstr, temp;
      if(info[0].indexOf("Line") > -1){
        temp = drawLine(info[0], info[1], objTemp);
      }
      else {
        temp = drawObject(info[0], info[1], objTemp, false); // drawFigure(info[0], info[1], objTemp, false);
      }
      elements[key] = temp;
      saveLocal(elements, key);
      i++;
    }
  };

  Drupal.behaviors.draw = {
    attach : function(context, settings) {
      console.log(Drupal.settings.draw.drawing);
      travLocal(Drupal.settings.draw.drawing);
    }
  }
});