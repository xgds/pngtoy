/*!
	pngtoy version 0.6.1 ALPHA
	(c) 2015-2017 Epistemex.com
	License: CC BY-NC-SA 4.0
*/

/**
 * Creates a new PngToy object which is used to load a PNG image off the
 * network as raw file. It provides methods to extract chunks as parsed
 * objects as well as decompressing, decoding and filtering the bitmap.
 * @param {object} options - options
 * @param {boolean} [options.doCRC=true] - enable/disable CRC-32 check for chunks (useful for repairing PNG files)
 * @param {boolean} [options.allowInvalid=false] - less strict passing allowing invalid data/chunks (useful for repairing PNG files)
 * @param {function} [options.beforeSend] - callback allowing setting headers before making xhr request.
 * @constructor
 */
function PngToy(options) {

	// for 0.7 -
	//todo interlace mode!
	//todo add progress callback
	//todo remove debug info?
	//todo add webworker example (?)
	//todo use time-based async blocks instead of size

	this.doCRC = true;
	this.allowInvalid = false;
	this.beforeSend = noop;

	// initialize options
	Object.assign(this, options);

	function noop(){}

	/**
	 * The URL that has been fetched.
	 * @type {*}
	 */
	this.url = null;

	/**
	 * The fetched buffer (the raw file bytes).
	 * @type {ArrayBuffer}
	 */
	this.buffer = null;							// raw file

	/**
	 * The view used for the file buffer.
	 * @type {DataView}
	 */
	this.view = null;

	/**
	 * Array holding all the chunks objects. These can be used to manually
	 * parse the file.
	 * @type {Array}
	 */
	this.chunks = [];

	/**
	 * todo remove this when out of beta
	 * @private
	 */
	this.debug = {};
}

PngToy.prototype = {

	/**
	 * Start loading a PNG image from an URL or an ArrayBuffer or typed array.
	 * For URL the CORS restrictions apply.
	 *
	 * It will call the resolve function with a bitmap representing the
	 * raw unfiltered bitmap. Pass this bitmap object to decode() to get
	 * a raw filtered bitmap, and further to convert() to get a RGBA
	 * bitmap.
	 *
	 * @param {*} src - url to PNG image (URL, Data-URI, Object-URL), or ArrayBuffer, typed array view holding the raw preloaded PNG bytes
	 * @returns {Promise}
	 */
	fetch: function(src) {

		var me = this;
		me.url = src;
		me.buffer =
		me.chunks =
		me.view = null;
		me._pos = 0;

		return new Promise(function(resolve, reject) {

			if (typeof src === "string") {
				try {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", src, true);
					xhr.responseType = "arraybuffer";
					me.beforeSend(xhr);

					xhr.onerror = function(e) {reject("Network error. " + e.message)};
					xhr.onload = function() {
						if (xhr.status === 200)
							checkBuffer(xhr.response);
						else
							reject("Loading error:" + xhr.statusText);
					};
					xhr.send();
				}
				catch(err) {reject(err.message)}
			}
			// todo Here we currently assume url to be ArrayBuffer or a view if not a string. Implement better checking.
			else {
				checkBuffer(ArrayBuffer.isView(src) ? src.buffer : src)
			}

			function checkBuffer(buffer) {

				var view, result;

				try {
					view = new DataView(buffer);

					if (buffer.byteLength > 66 && view.getUint32(0) === 0x89504E47 && view.getUint32(4) === 0x0D0A1A0A) {

						result = PngToy._getChunks(buffer, view, me.doCRC, me.allowInvalid);
						me.buffer = buffer;
						me.view = view;
						me.chunks = result.chunks || [];

						if (me.chunks || me.allowInvalid)
							resolve();
						else
							reject(result.error);
					}
					else reject("Not a PNG file.");
				}
				catch(err) {reject(err.message)}
			}

		});	// end of promise
	},

	/**
	 * Get a parsed version of the named chunk. An object is returned
	 * with properties representing the specifics of this chunk. If no
	 * chunks are present null will be returned.
	 * @returns {*|null}
	 */
	getChunk: function(chunkName) {
		var chunks = [
			"IHDR", "IDAT", "PLTE", "sPLT", "tRNS", "iTXt", "tEXt", "zTXt",
			"iCCP", "gAMA", "cHRM", "sRGB", "hIST", "sBIT", "pHYs", "bKGD",
			"tIME", "oFFs", "sTER", "sCAL", "pCAL", "IEND"];

		if (chunks.indexOf(chunkName) > -1) {
			return chunkName === "IEND" ?
				   !!PngToy._findChunk(this.chunks, "IEND") : PngToy["_" + chunkName](this);
		}
		else {
			return PngToy._findChunk(this.chunks, chunkName)
		}
	},

	/*
		Conversion and misc
	 */

	/**
	 * Returns a Blob containing a minimal stripped down PNG version of the original
	 * file (header and data only). The method does not alter any bitmap data to
	 * reduce data size itself - it simply recompile the chunks.
	 *
	 * @param {boolean} [forDownload=false] - if true returns Blob set to mime-type application/octet-stream, otherwise image/png
	 * @returns {*}
	 */
	toMinimal: function(forDownload) {

		if (this.chunks.length) {

			// chunk parts
			var chunkTypes = ["IHDR", "IDAT", "IEND", "PLTE", "tRNS", "gAMA"];
			var parts = [new Uint32Array([0x474E5089, 0x0A1A0A0D])];

			// add only needed chunks
			this.chunks.forEach(function(chunk) {
				if (chunkTypes.indexOf(chunk.name) > -1) parts.push(chunk.getRaw(true))
			});

			// return new PNG file as Blob
			return new Blob(parts, {type: forDownload ? "application/octet-stream" : "image/png"})
		}
		else throw "No file loaded (see fetch())."
	},

	/**
	 * Creates a look-up table (LUT) for the provided file gamma, and
	 * optionally display and user gamma. Display gamma is usually either
	 * 2.2 (Windows, Linux) or 1.8 (older Mac). It is used internally but
	 * is provided if you want to apply gamma to the bitmap manually.
	 *
	 * NOTE that this LUT table is only producing 8-bit values.
	 *
	 * @param {number} [fileGamma=1]
	 * @param {number} [dispGamma=2.2]
	 * @param {number} [userGamma=1]
	 * @returns {Uint8Array}
	 */
	getGammaLUT: function(fileGamma, dispGamma, userGamma) {

		for(
			var buffer = new Uint8Array(256),
				gamma = 1 / ((fileGamma || 1) * (dispGamma || 2.2) * (userGamma || 1)),
				i = 0;

			i < 256; i++) buffer[i] = Math.round(Math.pow(i / 255, gamma) * 255);

		return buffer
	},

	/**
	 * Guess the display gamma on this system, usually 2.2 (Windows, Linux)
	 * or 1.8 (Mac). If unable to detect system a default of 2.2 will be used.
	 * This is used when a raw bitmap is converted to a RGBA bitmap and
	 * gamma is enabled.
	 * @returns {number}
	 */
	guessDisplayGamma: function() {
		return navigator.userAgent.indexOf("Mac OS") > -1 ? 1.8 : 2.2
	}
};

PngToy._blockSize = 1<<21;
PngToy._delay = 7;

// Rough Node.js support for now (ArrayBuffer/view only for fetch()).
if (typeof exports !== "undefined") exports.PngToy = PngToy;
