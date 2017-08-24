/*
	Parse zTXt

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._zTXt = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunkLst = PngToy._findChunks(chunks, "zTXt"),
		warn = false,
		abort = false,
		lst = [], pos, o;

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

		// compression type
		if (view.getUint8(pos++) && !allowInvalid) {
			result = {error: "Invalid compression type."};
		}
		else {
			// convert compressed byte-buffer to string
			try {
				result.text = ezlib.inflate(
					new Uint8Array(view.buffer, pos, chunk.length - (pos - chunk.offset)), {to: "string"}
				)
			}
			catch(err) {
				if (allowInvalid) {
					result.text = "";
				}
				else {
					result = {error: err}
				}
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