# Information Geometry textbook sources

This directory contains the LaTeX source of *The Calculus of Probability
Distributions: An Undergraduate Introduction* and ten standalone chapters.

- `information_geometry.tex`: complete textbook source, including its
  diagrams, exercises, selected solutions, and bibliography.
- `chapters/chapter_01.tex` through `chapters/chapter_10.tex`: individually
  compilable chapter sources.
- `build_standalones.py`: regenerates the standalone chapter sources from
  the complete manuscript.

Compile with a recent TeX Live installation:

```bash
latexmk -pdf -interaction=nonstopmode information_geometry.tex
latexmk -pdf -interaction=nonstopmode chapters/chapter_01.tex
```

The published, ready-to-read PDFs are in the repository's `pdf/` directory.
The web readings in `readings/` cover the same weekly topics and include
additional interactive figures.
