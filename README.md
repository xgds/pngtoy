pngtoy
======

Low-level implementation of PNG file parser/reader/decoder using JavaScript
on client size.

*Why this when browsers already parses PNG files?*

The browser will simply load and convert any PNG type into RGBA bitmaps.
It may also apply ICC and gamma correction to the image resulting in
different pixel values than in the original bitmap. We won't have access
to the internals such as chunks and meta-data, or the raw bitmap.

**pngtoy** is for special case scenarios where you need to work with the
original bitmap as-is and you need the original pixel values and format
(i.e. no gamma, no ICC, indexed, 16-bit, grayscale etc.). This will also 
keep the bitmap values consistent across browsers as some browser support 
ICC, gamma, others don't. There is also the risk that using a canvas can
alter the bitmap values slightly due to rounding errors in the 
pre-multiplying process (`getImageData()`, `putImageData()`).

**pngtoy** can be used to analyse PNG files, extract special information
such as header, chunks, texts and other data, or to reduce file size, or 
as a tool to in an attempt to repair a PNG file, add or remove chunks, 
and so forth.

**pngtoy** attempts to read all formats specified by the W3C standard.

**pngtoy** can be used to analyse and to clean up PNG files by stripping 
unnecessary chunks and rebuild a file you can save as new. Comes with a 
built-in method to produce a new minimal PNG version of the original file.

**pngtoy** let you just parse the chunks without decompressing and decoding
any data.


Features
--------

- Supports 8-bit, 16-bit, indexed, bit-planes, grayscale, rgb, rgba, transparency and (interlaced).
- Strict parsing conforming to the standard (can be turned off for error correction purposes)
- CRC-32 checking for each chunk (can be turned off for error correction purposes)
- Using typed arrays for best performance
- Fast gzip implementation
- Non UI-blocking asynchronous block based decoding and format converting
- Access to chunks without the need to decompress or decode bitmaps
- Access to all stages (raw unfiltered buffer, filtered original format, converted to RGBA)
- Apply gamma to converted bitmap (file, display and optional user gamma)
- Handles aspect ratio correctly (pHYs chunk) (can be disabled)
- Parses compressed ancillary chunks and fields
- Parses extended chunks such as oFFs, sCAL, pCAL, sTER
- Uses promises (use Promise polyfill for IE)
- Can produce a minimal version of the original PNG (`toMinimal()`).
- Can be used in attempt to rescue corrupted PNG files
- Can load PNG files from URL, Data-URI, Object-URL, ArrayBuffer and typed array views

Run the PNG test suit from the tests directory to see current status/rendering (must run
from localhost in some browsers due to CORS restrictions). See known issues below.


Install
-------

**pngtoy** can be installed in various ways:

- Git using HTTPS: `git clone https://gitlab.com/epistemex/pngtoy.git`
- Git using SSH: `git clone git@gitlab.com:epistemex/pngtoy.git`
- Download [zip archive](https://gitlab.com/epistemex/pngtoy/repository/archive.zip?ref=master) and extract.
- Download [tar ball](https://gitlab.com/epistemex/pngtoy/repository/archive.tar.gz?ref=master) and extract.
- Bower: `bower install pngtoy`


Usage
-----

Create a new and reusable instance of pngtoy parser:

    var pngtoy = new PngToy([options]);

Invoke asynchronous fetching of file returning a promise:

    pngtoy.fetch("http://url.to/png.file").then( ... );

or

    pngtoy.fetch(arraybuffer).then( ... );

Now you can extract the information you like from the current PNG file:

    // get and parse chunks
    var chunks = pngtoy.chunks;		        	   // chunk list - does not decode any data

    // parse individual chunks to object (all official chunks are supported)
    var ihdr = pngtoy.getChunk("IHDR");        	   // return object for parsed IHDR chunk
    var raw = pngtoy.getChunk("IDAT");         	   // get unfiltered but uncompressed bitmap data
    var palette = pngtoy.getChunk("PLTE");         // get parsed palette if exists, or null
    var texts = pngtoy.getChunk("zTXt");           // get array with parsed and uncompressed zTXt objects
    var stereo = pngtoy.getChunk("sTER");          // get stereo mode if stereo image
    ...

    // you can also obtain private chunks but will have to parse them manually

    // decode
    pngtoy.decode(options).then(...);              // get decoded bitmap in original depth and type
    pngtoy.bitmapToCanvas(bmp, options).then(...); // convert to canvas and apply optional gamma

See also the `PngImage` object which wraps the basic steps up for convenience (see docs for usage).

NOTE: ALPHA version - API may change, see tests for current examples.


Known issues (alpha)
--------------------

- Interlace (Adam7) mode is currently not implemented


License
-------

[Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[![License](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[Contact us](mailto:github@epistemex.com) if you need a commercial license.

*&copy; 2015-2017 Epistemex*

![Epistemex](http://i.imgur.com/GP6Q3v8.png)
