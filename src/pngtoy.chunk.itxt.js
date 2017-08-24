/*
	Parse iTXt

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._iTXt = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunkLst = PngToy._findChunks(chunks, "iTXt"),
		pos, txtBuff, o, i, warn = false,
		abort = false,
		lst = [];

	if (!chunkLst.length) return null;

	chunkLst.forEach(function(chunk) {

		if (abort) return;

		var result = {};

		pos = chunk.offset;

		// keyword
		o = PngToy._getStr(view, pos, 80);
		result.keyword = o.text;
		pos = o.offset;
		if (o.warn) warn = true;

		// compression
		result.hasCompression = view.getUint8(pos);
		result.compression = view.getUint8(pos+1);
		pos += 2;

		// language
		o = PngToy._getStr(view, pos, 20);
		result.language = o.text.toLowerCase();
		pos = o.offset;
		if (o.warn) warn = true;

		// translated keyword
		o = PngToy._getStr(view, pos, 80);
		result.keywordLang = o.text;
		pos = o.offset;
		if (o.warn) warn = true;

		// text
		txtBuff = new Uint8Array(view.buffer, pos, chunk.length - (pos - chunk.offset));

		if (result.hasCompression === 1) {

			if (!allowInvalid && !result.compression) {
				result = {error: "Invalid compression type for iTXt."};
			}
			else {
				try {
					result.text = ezlib.inflate(txtBuff, {to: "string"});
				}
				catch (err) {
					if (allowInvalid) {
						result.text = "";
					}
					else {
						result = {error: err};
					}
				}
			}

		}
		else if (!result.hasCompression) {
			// convert byte-buffer to string
			o = "";
			for(i = 0; i < txtBuff.length; i++) o += String.fromCharCode(txtBuff[i]);
			result.text = o;
		}
		else {
			if (allowInvalid) {
				result.text = "";
			}
			else {
				result = {error: "Invalid compression flag."}
			}
		}

		if (!allowInvalid && warn) {
			abort = true;
			return {error: "One or more field contains illegal chars."}
		}

		lst.push(result);
	});

	return lst;
};