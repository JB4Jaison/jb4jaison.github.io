---
layout: page
title: NaPaM
description: A Napari plugin to run macros (Python scripts) on images within Napari
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

---

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

---

<a href="https://github.com/JB4Jaison/napam">GitHub</a> | <a href="https://napari-hub.org/plugins/napam">napari hub</a> | <a href="https://pypi.org/project/napam/">PyPI</a>

If you encounter any issues, please [file a GitHub issue](https://github.com/JB4Jaison/napam/issues) with a detailed description.
