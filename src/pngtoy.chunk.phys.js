/*
	Parse pHYs

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._pHYs = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "pHYs"),
		pos, result = {};

	if (!chunk) return null;

	pos = chunk.offset;

	result.ppuX = view.getUint32(pos);
	result.ppuY = view.getUint32(pos+4);
	result.unit = view.getUint8(pos+8);

	if (result.unit === 1) {
		result.desc = "Meters"
	}
	else {
		// todo calc ratio
		result.desc = "ratio"
	}


	if (!allowInvalid) {
		if (result.ppuX > 2147483647 || result.ppuY > 2147483647)
			return {error: "Invalid unit lengths."};

		if (result.unit < 0 || result.unit > 1)
			return {error: "Invalid unit for pHYs chunk."}
	}
	else {
		result.ppuX &= 0x7fffffff;
		result.ppuY &= 0x7fffffff;
		result.unit &= 1;
	}

	return result
};