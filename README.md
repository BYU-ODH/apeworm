VowelWorm
=============

[![Travis Builds][build-status-image]][build-status-url]

VowelWorm is based off the work done at the [Department of Computational Perception at Johannes Kepler Universität Linz](http://www.cp.jku.at/projects/realtime/vowelworm.html), and uses the same name. The goal is to produce real-time vocal analysis in the browser.

[Read the docs.][docs-url]

Examples
----------

### Multiple Audio Sources
VowelWorm can plot vocalizations against the IPA vowel chart in real time, for
multiple audio sources at a time. Videos, audio files, and microphone input
all work. Data comes from MFCC extraction. [See demo][sources-url]

[![Several audio sources being plotted][multiple-image]][sources-url]

```javascript
var graphs_element = document.getElementById("graphs"),
    game = new window.VowelWorm.Game({element: graphs_element});

navigator.getUserMedia({audio: true}, function success(){
  var worm = new window.VowelWorm.instance(stream);
  game.addWorm(worm);
});
```

### Formant Drawing
In addition to extracting MFCCs, VowelWorm also supports applying a Hanning
window or Savitzky-Golay filter to FFT data to attempt to extract formants.
Using the `draw` module, this data can be plotted. [See demo][draw-url]

[![Plotted Data][chart-image]][draw-url]

```javascript
var worm = new VowelWorm.instance(document.getElementById('media')),
    el = worm.draw.create(800, 500, 0xFFFFFF);

worm.draw.drawAxes();
document.getElementById('graphs').appendChild(el);

function draw(){
  worm.draw.drawDataLines();
  window.requestAnimationFrame(draw);
}
window.requestAnimationFrame(draw);
```

### MFCCs
VowelWorm can extract MFCCs from any audio or video source.

```javascript
var worm = new VowelWorm.instance(audio);
var mfccs = worm.getMFCCs({
  minFreq: 300,
  maxFreq: 8000,
  filterBanks: 20
});
```
### Curve Smoothing
VowelWorm can smooth data using either a Hanning window or a Savitzky-Golay
filter.

```javascript
var data = [...], // or data = new Float32Array(...)
    window_size = 55,
    order = 1;

// NOTE: savitzkyGolay requires numericJS to be loaded
var smooth1 = VowelWorm.savitzkyGolay(data, window_size, order);

smooth2 = VowelWorm.hann(data, window_size); // not all window sizes supported (yet!)
```

### Formant Extraction
VowelWorm can attempt to extract formants. NOTE: this is very much a work in
progress.

```javascript
var worm = new VowelWorm.instance(audio_source);
var formants = worm.getFormants();
```

### Normalization
VowelWorm has methods for normalizing data, like the Bark Scale.

```javascript
var f1 = 300,
    f2 = 950;

var f1_bark = VowelWorm.Normalization.barkScale(f1);
var f2_bark = VowelWorm.Normalization.barkScale(f2);
```

Development
-----------
### Code Organization ###

* VowelWorm base code: `src/vowelworm.js`
* Library Files: `src/lib/`
* Modules attached to individual `VowelWorm.instance` objects: `src/modules/worm`
* Additions to VowelWorm object: `src/modules/core`
* Test assets: `test/assets`

JavaScript files should be annotated using JSDoc and Google Closure Compiler's standards for improved compilation

### Tools ###

Many of our algorithms are based off Python scripts. If you would like to test the Hanning Window functionality to compare it to an LPC analysis and an FFT analysis, use the `windowing.py` script, coupled with WaveSurfer export files, as such

```
$ python windowing.py --fft=./path/to/fft-spectrum.txt --lpc=./path/to/lpc-spectrum.txt
```

Sample data is used if `python windowing.py` is called without both the FFT and LPC arguments.

[build-status-image]: https://travis-ci.org/BYU-ODH/apeworm.svg
[build-status-url]: https://travis-ci.org/BYU-ODH/apeworm
[sources-url]: https://byu-odh.github.io/apeworm/examples/sources.html
[draw-url]: https://byu-odh.github.io/apeworm/examples/chart.html
[chart-image]: examples/img/draw.png?raw=true
[multiple-image]: examples/img/multiple.png?raw=true
[docs-url]: https://byu-odh.github.io/apeworm/docs
