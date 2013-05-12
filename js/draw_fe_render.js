
(function ($, Drupal, window, document, undefined) {
  Drupal.behaviors.draw_render= {
    attach: function() {
      var drawings = {}, resize_factor = 1;

      $(".draw-canvas").each(function(){
        var image_path = "/" + $("#draw-diagram").attr("data-image_path");
        var form_element_name = $("#draw-diagram").attr("data-target_element");
        var saved_drawing;
        var nid = $(this).data("nid");
        /*** Draw the court and background ***/
        paper = Raphael(document.getElementById("draw-diagram-" + nid), Drupal.settings.draw_settings.canvas_width, Drupal.settings.draw_settings.canvas_height);

        // var i = 0;
        paper.setStart();
        paper.rect(0,0,Drupal.settings.draw_settings.canvas_width, Drupal.settings.draw_settings.canvas_height, 5).attr({"fill": "#dedede"});

        var background_content = {};
        if (typeof Drupal.settings.draw["drawing-" + nid] != "undefined") {
          if (typeof Drupal.settings.draw["drawing-" + nid].background != "undefined") {
            var background_id = Drupal.settings.draw["drawing-" + nid].background;
            background_object = Drupal.settings.draw_settings.backgrounds[background_id];
            delete Drupal.settings.draw["drawing-" + nid].background;
          }
          else if (typeof Drupal.settings.draw_settings.backgrounds != 'undefined') {
            for (var background_id in Drupal.settings.draw_settings.backgrounds) {
              background_object = Drupal.settings.draw_settings.backgrounds[background_id];
              break;
            }
          }
          for(var index in background_object.content) {
            var item = background_object.content[index];
            drawFromJSON(index, item);
          }

          saved_drawing = Drupal.settings.draw["drawing-" + nid];
        }
        else {
          saved_drawing = {};
        }
        if (typeof saved_drawing != "undefined") {
          for(var element_title in saved_drawing) {
            drawFromJSON(element_title, saved_drawing[element_title]);
          }
        }
        drawings[nid] = paper.setFinish();
      });
    }
  }
})(jQuery, Drupal, this, this.document);