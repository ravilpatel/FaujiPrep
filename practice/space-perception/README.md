# Paper Folding Aptitude Test Generator

This is a self-contained, dependency-free implementation of a paper folding aptitude test generator. It uses SVG rendering and a procedural geometry engine to generate folds, simulate punches, and create multiple-choice unfold options.

## Run

Open `practice/space-perception/index.html` in a browser.

## Features

- 10+ unique questions per test
- Seeded RNG for reproducibility
- SVG-based fold/holes rendering
- JSON import/export
- Print-friendly layout for PDF export

## Notes

- Fold logic uses half-plane clipping and reflection-based unfolding.
- No build tooling is required.
