---
layout: page
title: NaPaM
description: A napari plugin to run macros (Python scripts) on images for any kind of image processing
img: https://raw.githubusercontent.com/JB4Jaison/napam/main/assets/napam_execution_demo.gif
importance: 1
category: work
---

**NaPaM** (Napari Macro Tool) is a [napari](https://napari.org/) plugin that allows you to run macros — i.e. Python scripts — on images for any kind of image processing. It provides a flexible widget-based interface within napari to write and execute custom processing scripts directly on your loaded images.

<a href="https://github.com/JB4Jaison/napam">GitHub</a> | <a href="https://napari-hub.org/plugins/napam">napari hub</a> | <a href="https://pypi.org/project/napam/">PyPI</a>

---

## Features

- Execute custom Python scripts directly on images within napari
- Widget-based interface for writing and running macros
- Supports any kind of image processing workflow
- Built on top of numpy, matplotlib, magicgui, qtpy, and QScintilla

---

## Installation

You can install NaPaM via pip:

```bash
pip install napam
```

---

## Demo

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="https://raw.githubusercontent.com/JB4Jaison/napam/main/assets/napam_execution_demo.gif" title="NaPaM execution demo" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    NaPaM plugin in action — running a macro on an image within napari.
</div>

---

If you encounter any issues, please [file a GitHub issue](https://github.com/JB4Jaison/napam/issues) with a detailed description.
