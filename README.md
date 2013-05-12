jq-rpaper
=========

jQuery RaphaelPaper
jQuery implementation of a RaphaelJS-based graphics editor.
Lightweight SVG/WML-editor.

As the name implies, it relies heavily on jQuery and RaphaelJS, so these needs to be included as well.
Can be downloaded from http://raphaeljs.com and http://jquery.com

Turns a textarea into a drawing pad. The main goal is to make it possible to have generic looking user-supplied drawings.

You simply call $(YOUR_TEXTAREA).raphaelPaper(options); to create the drawing board.

The drawing will be saved as a stringified JSON object in the textarea.

There is also a 'frontend only' script. It is kind of working, but surely needs more work.

Use at your own risk, keep away from fire and no guarantees whatsoever and all that jazz ;)
