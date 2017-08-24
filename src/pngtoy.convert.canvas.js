/*
	Convert to canvas

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */

/**
 * Convert a bitmap from decode() to a canvas element. After the conversion
 * the canvas element is handed to the callback in the promise as sole
 * argument.
 *
 * @param {*} bmp - bitmap object returned from `decode()`
 * @param {*} [options] - options are handed to `convertToRGBA()` see that method for details.
 * @returns {Promise}
 */
PngToy.prototype.convertToCanvas = function(bmp, options) {

	var me = this;

	options = options || {};

	return new Promise(function(resolve, reject) {

		me.convertToRGBA(bmp, options)
			.then(function(bmp) {

				try {
					var canvas = document.createElement("canvas"),
						ctx = canvas.getContext("2d");

					canvas.width = bmp.width;
					canvas.height = bmp.height;

					var idata = ctx.createImageData(bmp.width, bmp.height);
					idata.data.set(bmp.bitmap);
					ctx.putImageData(idata, 0, 0);

					// ratio support
					if ((bmp.ratioY !== 1 || bmp.ratioX !== 1) && !options.ignoreAspectRatio) {

						var tcanvas = document.createElement("canvas"),
							tctx = tcanvas.getContext("2d"), w, h;

						if (bmp.ratioY >= 1) {
							w = canvas.width;
							h = (canvas.height * bmp.ratioY)|0;
						}
						else if (bmp.ratioY < 1) {
							w  = (canvas.width * bmp.ratioX)|0;
							h = canvas.height;
						}

						tcanvas.width = w;
						tcanvas.height = h;
						tctx.drawImage(canvas, 0, 0, w, h);
						canvas = tcanvas;
					}

					resolve(canvas);
				}
				catch(err) {reject(err)}
			},
			reject)
		}
	)
};
