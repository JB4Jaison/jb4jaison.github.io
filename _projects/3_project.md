---
layout: page
title: Snakemake: Connecting Cellprofiler and Python
description: A Snakemake workflow that stitches CellProfiler pipelines and Python scripts into a scalable, HPC-friendly image-analysis pipeline
img: /assets/img/Snakemake_logo.png
importance: 1
category: work
---

Scientific analysis rarely lives inside a single tool. A typical pipeline might start in a GUI-first application like [CellProfiler](https://cellprofiler.org/), hand its outputs off to a couple of Python scripts for post-analysis. Wiring all of that together by hand -- with Bash scripts, manual bookkeeping, and "did I remember to re-run step 2?" -- is where most of the pain lives.

**Snakemake** is the glue that makes this kind of multi-tool pipeline tractable. In this writeup I want to walk through *what* Snakemake is, *how* a Snakefile is structured, and *how* a Snakemake workflow actually executes -- so that by the end it's clear how it turns a handful of unrelated scripts into a parallelizable, dependency-aware pipeline.

To keep things concrete, I'll use a real project of mine as the running example: [**radial-intensity-analysis**](https://github.com/stjude/radial-intensity-analysis) -- a Snakemake workflow I built that stitches a CellProfiler pipeline together with two Python scripts (a maximum intensity projection step and a radial distribution plotter) and fans the work out across an HPC cluster or even your multi-threaded personal computer.

---

## What is Snakemake?

[Snakemake](https://snakemake.readthedocs.io/) is a **workflow management system** written in Python, inspired by GNU Make, and designed for scientific data analysis. You describe your analysis as a collection of **rules** -- each rule declares which files it consumes (`input`) and which files it produces (`output`) -- and Snakemake figures out the rest: the order to run things in, which steps can run in parallel, which steps are already done and can be skipped, and how to distribute work across cores, containers, or HPC job schedulers.

The mental model is simple (but you'd need to get used to it):

- You don't write a *procedure* ("first do A, then B, then C").
- You write a set of *rules* ("to make a plot, I need the CellProfiler outputs; to make those, I need a maximum intensity projection; to make that, I need the raw TIFFs").
- Snakemake builds a **Directed Acyclic Graph (DAG)** of file dependencies from those rules and walks it backwards from whatever final output you asked for.

This has a few very nice properties:

- **Reproducibility** -- the same inputs always produce the same DAG, and Snakemake only re-runs what has actually changed.
- **Parallelism for free** -- any two rule executions that don't depend on each other can run concurrently. On an HPC cluster, each job can be submitted to the scheduler as a separate SLURM/LSF task.
- **Tool-agnostic** -- a rule's body can be a shell command, a Python `run:` block, an R script, a Jupyter notebook, or a containerized command. This is exactly what lets us connect CellProfiler and arbitrary Python scripts in the same workflow.

---

## Parts of a Snakefile

A `Snakefile` is just a Python file with some extra Snakemake-specific syntax layered on top. Below I break down the [`Snakefile`](https://github.com/stjude/radial-intensity-analysis/blob/main/workflow/Snakefile) of this project section by section.

### 1. Imports and path setup

```python
import pathlib, os

root   = pathlib.Path("..")                 #  points one level up no matter OS
DATA   = root/"data"
RESULT = root/"results"
LOGS   = root/"logs"
BENCH  = root/"benchmarks"
RESRC  = root/"resources"
```

Because a `Snakefile` *is* Python, I can use any standard library module. Here I use `pathlib` to build portable, cross-platform paths to the top-level `data/`, `results/`, `logs/`, `benchmarks/`, and `resources/` directories. Defining these once at the top means the rules below never hardcode a string path.

### 2. Helpers and wildcards

```python
def mkdir(dirpath):
    """Portable directory creation (no '-p', no race)."""
    pathlib.Path(dirpath).mkdir(parents=True, exist_ok=True)

files = glob_wildcards(f"{DATA}/{{experiment_name}}/{{sample}}.tif")
```

Two things happen here:

- `mkdir()` is a small portable replacement for the POSIX-only `mkdir -p` idiom -- useful because the workflow is expected to run on both Linux HPC nodes and a developer's Windows laptop.
- `glob_wildcards()` is a Snakemake built-in. It scans the filesystem and extracts wildcard values from any paths that match the given pattern. Here, every subfolder inside `data/` becomes an `experiment_name`, and every `.tif` inside becomes a `sample`. This is how the workflow **discovers its own inputs** -- I don't have to enumerate experiments manually.

### 3. The `all` rule -- defining the final targets

```python
rule all:
    input:
        directory(expand(RESULT/"{experiment}"/"plots", experiment=files.experiment_name)),
        directory(expand(RESULT/"{experiment}"/"cellprofiler_outputs", experiment=files.experiment_name)),
        directory(expand(RESULT/"{experiment}"/"mip", experiment=files.experiment_name))
```

By convention, the **first rule** in a Snakefile is the default target. `rule all` doesn't produce any outputs of its own -- it only has `input:` entries, which act as the "please make sure these exist" list. `expand()` takes a pattern with a placeholder and a list of values, and generates one path per experiment. So if `data/` contains three experiments, `rule all` effectively asks Snakemake to produce three `plots/`, three `cellprofiler_outputs/`, and three `mip/` directories.

This is the entry point of the DAG -- everything else is derived by Snakemake working backwards from these targets.

### 4. Rule `mip` -- Maximum Intensity Projection

```python
rule mip:
    input:
        in_dir = directory(DATA/"{experiment}"),
        script = pathlib.Path("scripts") / "mip.py"
    output:
        out_dir = directory(RESULT/"{experiment}"/"mip")
    params:
        channels = 4,
        colors   = "m,r,o,g"
    log:
        LOGS/"{experiment}"/"mip.log"
    threads:
        int(workflow.cores * 0.20)
    run:
        mkdir(output.out_dir)

        in_dir  = os.path.normpath(str(input.in_dir))
        out_dir = os.path.normpath(str(output.out_dir))
        log     = os.path.normpath(str(log))
        script  = os.path.normpath(str(input.script))

        shell(
            "python {script} "
            "-i {in_dir} "
            "-o {out_dir} "
            "--channels {params.channels} "
            "--lut {params.colors} "
            "--log {log} "
        )
```

This is where the *anatomy of a rule* really shows itself. A rule is a small block of YAML-like declarations followed by an execution body. The fields fall naturally into two groups: the ones that define **what the rule does**, and the ones that tune **how Snakemake runs it**.

#### The core fields: `input`, `output`, and `run`

These three fields are the minimum you need to write a working rule — they describe what goes in, what comes out, and what happens in between.

- **`input:`** -- the files/directories this rule reads. Note the `{experiment}` wildcard: Snakemake sees this, looks at what outputs are being requested downstream, and substitutes in the appropriate experiment name automatically. `mip.py` is also declared as an input so that if the script itself changes, Snakemake knows to re-run.
- **`output:`** -- the files/directories this rule produces. Declaring outputs is what enables dependency tracking; Snakemake compares timestamps on these files against the inputs to decide whether the rule is up-to-date. Crucially, the `output:` of one rule matching the `input:` of another is what **implicitly defines the DAG edges** -- there is no explicit "this rule depends on that rule" anywhere.
- **`run:`** -- the execution body. `run:` takes a Python block, so I can do pre-flight work (path normalization, `mkdir`) in pure Python *before* dispatching the external command via `shell(...)`. For simpler rules you can replace `run:` with `shell:` directly (just a command string), or with `script:` / `notebook:` to point at a standalone script or notebook.

#### Additional fields: `params`, `log`, `threads`

The remaining fields are optional annotations Snakemake uses to run the rule more cleanly and more efficiently. They're not required for correctness, but in practice you almost always want them.

- **`params:`** -- constants that get injected into the command (channel count, LUT colors, regex, etc.). Kept separate from `input:` so that changing a parameter doesn't invalidate a file dependency in a misleading way. They're referenced inside the command string as `{params.channels}` and `{params.colors}`.
- **`log:`** -- standard location for per-rule logs. Having this as a first-class field means Snakemake (and any HPC scheduler you're running under) knows exactly where to look for output, even when a job fails. In the `run:` block I redirect the underlying script's logging into this path.
- **`threads:`** -- how many CPU threads this rule is allowed to use. `workflow.cores * 0.20` means "20% of however many cores the user gave the workflow with `--cores N`". This is Snakemake's built-in knob for **resource-aware scheduling** -- it will never schedule more concurrent jobs than the core budget allows, so the machine is never oversubscribed.

Other optional fields you'll see in the wild (not used here but worth knowing) include `resources:` for memory/GPU accounting, `benchmark:` for timing a rule, `conda:` / `container:` for per-rule environments, and `wildcard_constraints:` for narrowing what a wildcard is allowed to match.

### 5. Rule `cellprofiler` -- Segmentation via CellProfiler

```python
rule cellprofiler:
    input:
        in_dir     = directory(RESULT / "{experiment}" / "mip"),
        pipeline   = RESRC / "rdf.cppipe",
        plugin_dir = RESRC / "plugins"
    output:
        out_dir = directory(RESULT / "{experiment}" / "cellprofiler_outputs")
    log:
        LOGS / "{experiment}" / "cellprofiler_run.log"
    threads:
        int(workflow.cores * 0.50)
    run:
        in_dir     = os.path.normpath(str(input.in_dir))
        pipeline   = os.path.normpath(str(input.pipeline))
        plugin_dir = os.path.normpath(str(input.plugin_dir))
        out_dir    = os.path.normpath(str(output.out_dir))
        log        = os.path.normpath(str(log))

        mkdir(output.out_dir)
        shell(
            "cellprofiler -c -r "
            "-p {pipeline} "
            "-i {in_dir} "
            "-o {out_dir} "
            "--plugins-directory {plugin_dir} "
            " > {log} 2>&1"
        )
```

The critical detail: this rule's `input.in_dir` is the *same path* as the `output.out_dir` of `rule mip`. That single fact is how Snakemake infers that `cellprofiler` depends on `mip` -- there's **no explicit `depends_on` or ordering anywhere in the file**. The filenames *are* the dependency graph.

Other things worth calling out:

- `threads` is bumped to 50% of available cores because CellProfiler is the heavy step.
- The pipeline file (`rdf.cppipe`) and the plugin directory are declared as inputs, so editing either will correctly trigger a re-run.
- Notice how the invocation is just a plain `cellprofiler -c -r ...` headless command -- this is how Snakemake "wraps" any external tool without needing a custom adapter.

### 6. Rule `plot` -- Radial Distribution Plotting

```python
rule plot:
    input:
        input_dir = directory(RESULT / "{experiment}" / "cellprofiler_outputs"),
        script = pathlib.Path("scripts") / "rdf.py"
    output:
        out_dir = directory(RESULT / "{experiment}" / "plots")
    params:
        regex = "t(?P<time>\d+)_(?P<treatment>[^_]+)[\w]*.tif"
    log:
        LOGS / "{experiment}" / "rdf.log"
    threads:
        int(workflow.cores * 0.20)
    run:
        mkdir(output.out_dir)

        in_dir  = os.path.normpath(str(input.input_dir))
        out_dir = os.path.normpath(str(output.out_dir))
        log     = os.path.normpath(str(log))
        script  = os.path.normpath(str(input.script))

        shell('''
            python {script} \
            --output-dir {out_dir} \
            --input-dir {in_dir} \
            --log-file {log} \
            --regex "{params.regex}"
            '''
        )
```

Same shape as before, but notice the `params.regex` -- a named capture-group pattern that the downstream script uses to extract timepoint and treatment labels from the filenames. By pushing this into `params:` rather than hardcoding it inside `rdf.py`, the workflow is easier to adapt to new naming conventions without touching the script.

---

## How the workflow actually flows

Once the Snakefile above is written, a single command kicks it off:

```bash
snakemake --cores 16
```

Here's what happens under the hood:

1. **Target discovery.** Snakemake reads `rule all` and expands the wildcards using the experiments it discovered via `glob_wildcards`. Say there are two experiments, `expA` and `expB` -- it now has six target directories to produce.
2. **DAG construction.** Working backwards, Snakemake asks: *who produces `results/expA/plots`?* → `rule plot`. *What does `plot` need?* → `results/expA/cellprofiler_outputs`. *Who produces that?* → `rule cellprofiler`. *What does it need?* → `results/expA/mip`. *Who produces that?* → `rule mip`. The same chain is built for `expB`. The result is a DAG with three stages per experiment.
3. **Up-to-date check.** For each planned job, Snakemake compares file timestamps. If `results/expA/mip` already exists and is newer than all its inputs, the `mip` step for `expA` is skipped. This is what makes iterative development cheap.
4. **Scheduling.** Snakemake looks at `threads:` declarations and `--cores`, and schedules as many jobs concurrently as the machine will allow. Because `expA` and `expB` are fully independent branches of the DAG, their `mip` jobs can run at the same time. On an HPC, each job is submitted as a separate scheduler job -- so two experiments become two SLURM jobs, not one big one.
5. **Execution.** Each job runs its `run:` / `shell:` body, writing to the declared log file. If a job fails, Snakemake marks its outputs as incomplete and stops scheduling anything downstream of it -- but other independent branches keep going.
6. **Resumability.** If the run is interrupted, re-running `snakemake --cores 16` picks up exactly where it left off. No manual bookkeeping.

The DAG for a two-experiment run looks roughly like this:

```
          ┌────────────┐        ┌────────────────────┐        ┌────────────┐
 expA ──> │ rule mip   │ ─────> │ rule cellprofiler  │ ─────> │ rule plot  │
          └────────────┘        └────────────────────┘        └────────────┘
          ┌────────────┐        ┌────────────────────┐        ┌────────────┐
 expB ──> │ rule mip   │ ─────> │ rule cellprofiler  │ ─────> │ rule plot  │
          └────────────┘        └────────────────────┘        └────────────┘
              ↑ these two rows run in parallel, end-to-end, with no extra code
```

This is the payoff of describing the workflow declaratively: **adding a tenth experiment requires no changes to the Snakefile** -- you just drop a new folder into `data/`, and Snakemake fans out a tenth parallel branch automatically.

---

## Why this matters for multi-tool pipelines

The biggest practical win from Snakemake isn't any one feature -- it's the fact that *every tool looks the same from the outside*. CellProfiler, a Python script, an R analysis, a Bash one-liner, a containerized binary -- once wrapped in a rule with declared inputs and outputs, they all plug into the same DAG, the same caching, the same HPC scheduling, and the same logging conventions. You can swap a tool out for a different one without your downstream steps knowing or caring, as long as it produces the same output contract.

That's the trick I wanted to highlight with this project: Snakemake let me treat a proprietary GUI-first tool (CellProfiler) as a peer of my own Python scripts, and run the whole thing on an HPC cluster without writing a single line of scheduler-specific code.

---

<a href="https://github.com/stjude/radial-intensity-analysis">GitHub Repository</a> | <a href="https://snakemake.readthedocs.io/">Snakemake Docs</a> | <a href="https://cellprofiler.org/">CellProfiler</a>
