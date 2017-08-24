/*
	Parse sBIT

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._sBIT = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "sBIT"),
		ihdr = PngToy._IHDR(host),
		pos, depth,
		hasError = false,
		result = {grey: null, alpha: null, red: null, green: null, blue: null};

	if (!chunk) return null;

	pos = chunk.offset;
	depth = ihdr.type === 3 ? 8 :ihdr.depth;

	switch(ihdr.type) {

		case 0:
			result.grey = view.getUint8(pos);
			break;

		case 2:
		case 3:
			result.red = view.getUint8(pos++);
			result.green = view.getUint8(pos++);
			result.blue = view.getUint8(pos);
			break;

		case 4:
			result.grey = view.getUint8(pos++);
			result.alpha = view.getUint8(pos);
			break;

		case 6:
			result.red = view.getUint8(pos++);
			result.green = view.getUint8(pos++);
			result.blue = view.getUint8(pos++);
			result.alpha = view.getUint8(pos);
			break;
	}

	if (!allowInvalid) {
		// todo check: alpha MAY not be correctly checked here...
		if (null !== result.red) if (result.red > depth || result.red === 0) hasError = true;
		if (null !== result.green) if (result.green > depth || result.green === 0) hasError = true;
		if (null !== result.blue) if (result.blue > depth || result.blue === 0) hasError = true;
		if (null !== result.grey) if (result.grey > depth || result.grey === 0) hasError = true;
		if (null !== result.alpha) if (result.alpha > depth || result.alpha === 0) hasError = true;
		if (hasError) return {error: "Invalid sBIT chunk."};
	}

	return result
};