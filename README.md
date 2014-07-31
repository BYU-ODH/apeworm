VowelWorm
=============

[![Travis Builds][build-status-image]][build-status-url]

VowelWorm is based off the work done at the [Department of Computational Perception at Johannes Kepler Universität Linz](http://www.cp.jku.at/projects/realtime/vowelworm.html), and uses the same name. The goal is to produce real-time vocal analysis in the browser.

Development
-----------
* JavaScript files should be annotated using JSDoc and Google Closure Compiler's standards for improved compilation

### Tools ###

Many of our algorithms are based off Python scripts. If you would like to test the Hanning Window functionality to compare it to an LPC analysis and an FFT analysis, use the `windowing.py` script, coupled with WaveSurfer export files, as such

```
$ python windowing.py --fft=./path/to/fft-spectrum.txt --lpc=./path/to/lpc-spectrum.txt
```

Sample data is used if `python windowing.py` is called without both the FFT and LPC arguments.

[build-status-image]: https://travis-ci.org/BYU-ODH/apeworm.svg
[build-status-url]: https://travis-ci.org/BYU-ODH/apeworm
