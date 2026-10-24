# Introduction to Information Geometry — lecture slide collection

Christopher Lee

Twenty 16:9 Beamer lectures, two for each week of the course. The slides
correspond to the ten-chapter *Calculus of Probability Distributions* text and
the [Introduction to Information Geometry course](https://bobovski66.github.io/IntroInfoGeom/).

## The lectures

| Week | Lecture 1 | Lecture 2 |
| --- | --- | --- |
| 1 | Population Proportions and Replicator Dynamics | Frequency-Dependent Fitness and Stability |
| 2 | Payoff Matrices and Expected Fitness | Stability, Parameters, and Inference |
| 3 | Three Strategies and the Simplex | Cyclic Motion and Invasion |
| 4 | Probability Laws, Means, and Variances | Curves of Distributions and Sampling |
| 5 | Surprisal and Shannon Entropy | Log-Odds and Exponential Updating |
| 6 | Relative Entropy and Prediction | Relative Entropy as a Lyapunov Function |
| 7 | Fisher Information and Scores | Fisher Length and Replicator Speed |
| 8 | Square-Root Coordinates and the Sphere | Geodesics and Statistical Midpoints |
| 9 | Natural Gradients and Replicator Flows | Potentials, Stability, and KL Flows |
| 10 | Gaussian Scores and the Hyperbolic Metric | Gaussian Geodesics and Statistical Distance |

Each lecture has a self-contained `weekNN_lectureMM.tex` source and an
identically named PDF. Files use the same `course_beamer_style.tex` preamble.
Week 1 Lecture 2 also uses `coexistence_trajectories.csv` for its plotted
example. Keep these supporting files next to the TeX sources.

## Recording with a tablet whiteboard

Mathematical activities appear on **two consecutive full slides with the same
title**. The first presents the question or empty phase line. Pause that page,
switch to the tablet and work through the calculation. On returning to the
slide deck, advance exactly one page for the completed expression, result, or
arrows. Explanatory slides remain separate from these reveal pairs.

The files do not use animation overlays, so the sequence works in ordinary
PDF presentation mode, screen recordings, or uploaded PDF viewers. There are
no visible stage directions or whiteboard notification panels.

One lecture can be a roughly 35–50 minute video depending on how long the
whiteboard discussions, plots, and exercises take. The slides intentionally
leave derivations to be performed live instead of presenting every algebraic
step on-screen.

## Editing and compiling

Compile from the directory containing the `.tex` files:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error \
  -outdir=build week09_lecture01.tex
```

Copy the finished `build/week09_lecture01.pdf` to the delivery folder if
needed. A local TeX distribution with Beamer, TikZ, PGFPlots, Palatino, and
the AMS packages is required. To modify the palette, typography, footer, or
common diagrams, edit `course_beamer_style.tex` and rebuild the slides.

## Pedagogical arc

The first three weeks establish dynamics on intervals and simplices. Weeks 4
and 5 introduce probability and information as the quantities carried by those
states. Relative entropy and Fisher information provide the measurements in
Weeks 6 and 7. Weeks 8–10 express those measurements geometrically, moving
from spherical Fisher distance to natural-gradient flows and finally Gaussian
hyperbolic geometry.
