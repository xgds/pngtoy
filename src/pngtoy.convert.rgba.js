/*
	ConvertToRGBA()

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */

/**
 * Convert the raw bitmap from decode() to a browser compatible RGBA bitmap.
 *
 * @param {*} bmp - bitmap object returned from `decode()`
 * @param {*} [options] - conversion options
 * @param {boolean} [options.ignoreAspectRatio=false] - ignores the pHYs chunk if present and won't scale bitmap depending on the aspect ratio described in that chunk.
 * @param {boolean} [options.useGamma=false] - use embedded gamma value from the gAMA chunk (if present) in the conversion
 * @returns {Promise} - passes a new bitmap object holding the RGBA bitmap, width and height as well as aspect ratio
 */
PngToy.prototype.convertToRGBA = function(bmp, options) {

	// todo HQ option for converting 16-bit to 8-bit
	// todo implement error handling for reject (for rare conditions such as memory issues etc.)

	var me = this;

	options = options || {};

	return new Promise(function(resolve) {

		// if no conversion is needed, return right away:
		if (bmp.type === 6 && bmp.depth === 8 && !options.useGamma) {
			var tmp = options.ignoreAspectRatio ? null : me.getChunk("pHYs"),
				ratioX = tmp ? tmp.ppuY / (tmp.ppuX || 1) : 1,
				ratioY = tmp ? tmp.ppuX / (tmp.ppuY || 1) : 1;

			if (options.ignoreAspectRatio || (!options.ignoreAspectRatio && ratioX === 1 && ratioY === 1)) {
				resolve({
					bitmap: bmp.bitmap,
					width: bmp.width,
					height: bmp.height,
					ratioX: ratioX,
					ratioY: ratioY
				});
			}
			return
		}

		var	plte, trns, phys, gamma,
			palette, alphas,

			w = bmp.width,
			h = bmp.height,
			type = bmp.type,
			depth = bmp.depth,
			byteWidth = depth / 8,
			pixelWidth = [1,0,3,1,2,0,4][type],
			getPixel = getPixelFunc(type, depth),
			src = bmp.bitmap,
			dst = new Uint8Array(w * h * 4),
			sPos = 0, dPos = 0,
			len = src.byteLength, px, lut;

		// if indexed, initialize palette and transparency
		if (bmp.type === 3) {
			plte = me.getChunk("PLTE");
			palette = plte ? plte.palette : [];
		}

		trns = me.getChunk("tRNS");
		alphas = trns && trns.alphas ? trns.alphas : [];

		phys = me.getChunk("pHYs");
		gamma = me.getChunk("gAMA");

		gamma = gamma ? gamma.gamma : 1;	// ♪ gamma, ghaaaameleoooon ♬ ♪  todo .gamma -> value?

		(function convert() {

			var block = PngToy._blockSize,
				lineLen = w * byteWidth * pixelWidth,
				lineEnd = sPos + lineLen;

			if (options.useGamma) {
				lut = lut ? lut : me.getGammaLUT(gamma, options.gamma || 1);
				while(sPos < len && block > 0) {
					if (sPos >= lineEnd) {
						sPos = Math.ceil(sPos);
						lineEnd = sPos + lineLen;
					}
					px = getPixel();
					dst[dPos++] = lut[px[0]];
					dst[dPos++] = lut[px[1]];
					dst[dPos++] = lut[px[2]];
					dst[dPos++] = px[3];
					block--;
				}
			}
			else {
				while(sPos < len && block > 0) {
					if (sPos >= lineEnd) {
						sPos = Math.ceil(sPos);
						lineEnd = sPos + lineLen;
					}
					px = getPixel();
					dst[dPos++] = px[0];
					dst[dPos++] = px[1];
					dst[dPos++] = px[2];
					dst[dPos++] = px[3];
					block--;
				}
			}

			if (sPos < len) {
				setTimeout(convert, PngToy._delay);
			}
			else {
				resolve({
					bitmap: dst,
					width: w,
					height: h,
					ratioX: phys ? phys.ppuY / (phys.ppuX || 1) : 1,
					ratioY: phys ? phys.ppuX / (phys.ppuY || 1) : 1
				});
			}
		})();

		function getPixelG1() {
			var b = src[sPos|0],
				bitIndex = (sPos - (sPos|0)) / byteWidth,
				g = (b & (0x80>>bitIndex)) ? 255 : 0,
				a = alphas.length ? ((alphas[0]>>>8) & (0x80>>bitIndex) === g ? 0 : 255) : 255;

			sPos += byteWidth;
			return [g, g, g, a]
		}

		function getPixelG2() {
			var b = src[sPos|0],
				bitIndex = ((sPos - (sPos|0)) / byteWidth)<<1,
				g = (((b>>>bitIndex) & 3) * 85) & 0xff,
				a = alphas.length ? ((((alphas[0]>>>8) & 3) * 85) & 0xff === g ? 0 : 255) : 255;

			sPos += byteWidth;
			return [g, g, g, a]
		}

		function getPixelG4() {
			var b = src[sPos|0],
				bitIndex = ((sPos - (sPos|0)) / byteWidth),
				g = bitIndex ? (b & 0xf)<<4 : b & 0xf0,
				a = alphas.length ? (((alphas[0] & 0xf00) >>> 4) === g ? 0 : 255) : 255;

			sPos += byteWidth;
			return [g, g, g, a]
		}

		function getPixelC1() {
			var b = src[sPos|0],
				bitIndex = (sPos - (sPos|0)) / byteWidth,
				i = (b & (0x80>>>bitIndex)) ? 1 : 0,
				pi = i * 3;
			sPos += byteWidth;
			return [palette[pi], palette[pi+1], palette[pi+2], 255]
		}

		function getPixelC2() {
			var b = src[sPos|0],
				bitIndex = ((sPos - (sPos|0)) / byteWidth)<<1,
				i = ((b<<bitIndex) & 0xc0)>>>6,
				pi = i * 3,
				a = i < alphas.length ? alphas[i] : 255;

			sPos += byteWidth;
			return [palette[pi], palette[pi+1], palette[pi+2], a]
		}

		function getPixelC4() {
			var b = src[sPos|0],
				bitIndex = ((sPos - (sPos|0)) / byteWidth),
				i = bitIndex ? b & 0xf : (b & 0xf0)>>>4,
				pi = i * 3,
				a = i < alphas.length ? alphas[i] : 255;
			sPos += byteWidth;
			return [palette[pi], palette[pi+1], palette[pi+2], a]
		}

		function getPixelG() {
			var g = src[sPos++],
				a = alphas.length && g === (alphas[0] >>> 8) ? 0 : 255;

			g &= 0xff;

			return [g, g, g, a]
		}

		function getPixelG16() {
			var g = src[sPos++],
				a = alphas.length && alphas[0] === g ? 0 : 255;

			g &= 0xff;

			return [g, g, g, a]
		}

		function getPixelRGB() {
			var r = src[sPos++], g = src[sPos++], b = src[sPos++],
				ar, ag, ab, a = 255;

			if (alphas.length) {
				ar = alphas[0] >>> 8;
				ag = alphas[1] >>> 8;
				ab = alphas[2] >>> 8;
				if (ar === r && ag === g && ab === b) a = 0;
			}

			return [
				r & 0xff,
				g & 0xff,
				b & 0xff,
				a
			]
		}

		function getPixelRGBA() {
			return [src[sPos++], src[sPos++], src[sPos++], src[sPos++]]
		}

		function getPixelRGB16() {
			var r = src[sPos++], g = src[sPos++], b = src[sPos++],
				a = alphas.length && alphas[0] === r && alphas[1] === g && alphas[2] === b ? 0 : 255;

			return [
				r & 0xff, // * 0.0038910505836575876 + 0.5)|0,
				g & 0xff, // * 0.0038910505836575876 + 0.5)|0,
				b & 0xff, // * 0.0038910505836575876 + 0.5)|0,
				a
			]
		}

		function getPixelGA() {
			var g = src[sPos++];
			return [g, g, g, src[sPos++]]
		}

		function getPixelGA16() {
			var g = src[sPos++] & 0xff;
			return [g, g, g, src[sPos++] & 0xff]
		}

		function getPixelIndexed() {
			var tIndex = src[sPos++],
				pIndex = tIndex * 3;

			return [
				palette[pIndex], palette[pIndex+1], palette[pIndex+2],
				tIndex < alphas.length ? alphas[tIndex] : 255
			]
		}

		function getPixelRGBA16() {
			return [
				src[sPos++] & 0xff,
				src[sPos++] & 0xff,
				src[sPos++] & 0xff,
				src[sPos++] & 0xff
			]
		}

		function getPixelFunc(type, depth) {
			if (depth === 16) {
				return [getPixelG16, 0, getPixelRGB16, getPixelIndexed, getPixelGA16, 0, getPixelRGBA16][type]
			}
			else if (depth < 8) {
				switch(depth) {
					case 1: return type ? getPixelC1 : getPixelG1;
					case 2: return type ? getPixelC2 : getPixelG2;
					case 4: return type ? getPixelC4 : getPixelG4;
				}
			}
			else {
				return [getPixelG, 0, getPixelRGB, getPixelIndexed, getPixelGA, 0, getPixelRGBA][type]
			}
		}
	})

};
