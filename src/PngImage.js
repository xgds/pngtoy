/*
	PngImage() object for easy-loading raw PNGs

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
/**
 * Emulates the Image object but will load a PNG image without applying
 * gamma, ICC etc. The main purpose is to function as a wrapper for the
 * various steps needed to load a PNG via low-level pngtoy.
 *
 * NOTE: An important distinction is that you need to pass in
 * `img.bitmap` to canvas instead of just `img`.
 *
 * @property {*} image - canvas holding the decoded image (use this to insert into DOM or for drawing)
 * @property {*} src - URL, Data-URI, Object-URL, ArrayBuffer or typed array view
 * @property {*} onload - callback for when image loaded successfully
 * @property {*} onerror - callback for errors
 * @property {*} onabort - callback for abort (not used in this object - provided for compatibility)
 * @property {number} width - width of image in pixels when loaded (read-only)
 * @property {number} height - height of image in pixels when loaded (read-only)
 * @property {number} naturalWidth - width of image in pixels when loaded (read-only)
 * @property {number} naturalHeight - height of image in pixels when loaded (read-only)
 * @property {PngToy} pngtoy - the PngToy instance handling this object
 * @property {boolean} complete - for IE compatibility, true when loaded
 * @constructor
 */
function PngImage() {

	var url = "",
		me = this,
		//crossOrigin = null,
		png = new PngToy(),
		bmp, canvas,
		w = 0, h = 0, complete = false;

	this.onload = null;
	this.onerror = null;
	this.onabort = null;

	Object.defineProperty(this, "src", {
		get: function() {return url},
		set: function(v) {
			url = v;
			start()
		}
	});

	/*Object.defineProperty(this, "crossOrigin", {
		get: function() {return crossOrigin},
		set: function(co) {
			if (co !== "anonymous" || co !== "use-credentials") co = "anonymous";
			crossOrigin = co;
		}
	});*/

	Object.defineProperty(this, "width", {get: function() {return w}});
	Object.defineProperty(this, "height", {get: function() {return h}});
	Object.defineProperty(this, "naturalWidth", {get: function() {return w}});
	Object.defineProperty(this, "naturalHeight", {get: function() {return h}});
	Object.defineProperty(this, "image", {get: function() {return canvas}});
	Object.defineProperty(this, "pngtoy", {get: function() {return png}});
	Object.defineProperty(this, "complete", {get: function() {return complete}});

	function start() {png.fetch(url).then(decode, error)}
	function decode(bmpO) {png.decode(bmpO).then(convert, error)}

	function convert(bmpO) {
		bmp = bmpO;
		w = bmpO.width;
		h = bmpO.height;

		png.convertToCanvas(bmpO, {
			ignoreAspectRatio: false,
			useGamma         : false
		}).then(success.bind(me), error.bind(me));
	}

	function success(canvasO) {
		canvas = canvasO;
		complete = true;
		if (me.onload) me.onload({
			timeStamp: Date.now()
		})
	}

	function error(msg) {
		if (me.onerror) me.onerror({
			message: msg,
			timeStamp: Date.now()
		})
	}
}