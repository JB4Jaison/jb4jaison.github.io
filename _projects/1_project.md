---
layout: page
title: NaPaM
description: A plugin to run macros on images within Napari
img: https://raw.githubusercontent.com/JB4Jaison/napam/main/assets/napam_execution_demo.gif
importance: 1
category: work
---

**NaPaM** (Napari Macro Tool) is a [Napari](https://napari.org/) plugin that allows you to run macros — i.e. Python scripts — on images for any kind of image processing. It provides a flexible widget-based interface within napari to write and execute custom processing scripts directly on your loaded images.

This allows you to visualize the results of your script live. People who've tried workarounds for viewing higher-than-two dimensional images in jupyter notebooks and elsewhere can understand the necessity.

This plugin directly works with your environment and so it can access all the libraries installed within that environment

People who use Napari already might wonder why one can't use the already exisiting console. Well, you know how painful it is to edit and re-excecute scripts in the console editor!

---

## Features

- Execute custom Python scripts directly on images within napari
- Allows for execution of code specific to ROI regions in the images
- Supports 2D, 3D and n-dim image processing
- Allows for referencing existing code variable within the editor
- Auto-highlights script keywords


## Demos

Here's a demo on how one can perform thresholding on the loaded labels using basic numpy within Napari using NaPaM.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="https://raw.githubusercontent.com/JB4Jaison/napam/main/assets/napam_execution_demo.gif" title="NaPaM execution demo" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    NaPaM plugin in action — running a macro on an image within napari.
</div>

### Running code on ROIs alone

NaPaM also lets you run script execution to specific regions of interest (ROIs) rather than the entire image. This is handy when you want to prototype or apply processing to just a cropped area without altering the rest of the image.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include video.liquid path="assets/video/napam-roi-demo-2X.mp4" class="img-fluid rounded z-depth-1" controls=true autoplay=true loop=true muted=true %}
    </div>
</div>
<div class="caption">
    Executing a macro scoped to a selected ROI within napari using NaPaM (2× speed).
</div>


## Editor Features

The macro editor is built on top of `QsciScintilla` and ships with a handful of quality-of-life features aimed at making script iteration feel closer to a real IDE than a console:

- **Python syntax highlighting** — keywords, comments, and strings are colored via `QsciLexerPython` so long scripts stay readable.
- **Autocomplete** — case-insensitive, document-scoped suggestions that kick in after a single character.

<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/napam_autofill_example.png" title="NaPaM autocomplete example" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Document-scoped autocomplete suggestions appearing as you type in the NaPaM editor.
</div>

- **Variable referencing** — the selected layer is exposed to your script as an `image` variable, and whatever you assign to `result` is pushed into napari as the output layer.
- **Line numbering & caret highlighting** — a dedicated line-number margin plus a highlighted current line and red caret make it easy to track where you are in longer macros.
- **Word wrapping** — wrapped lines mean you don't have to scroll horizontally to read a long expression.
- **Execution feedback** — execution time is recorded after each run, and any exception is caught and shown in the terminal with a full traceback inline instead of crashing napari.

---

<a href="https://github.com/JB4Jaison/napam">GitHub</a> | <a href="https://napari-hub.org/plugins/napam">napari hub</a> | <a href="https://pypi.org/project/napam/">PyPI</a>

If you encounter any issues, please [file a GitHub issue](https://github.com/JB4Jaison/napam/issues) with a detailed description.
