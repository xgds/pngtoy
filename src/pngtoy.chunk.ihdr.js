/*
	Parse IHDR

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */

PngToy._IHDR = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,

		chunk = PngToy._findChunk(chunks, "IHDR"),
		pos, result;

	if (!chunk) return {error: "Critical - IHDR chunk is missing."};

	pos = chunk.offset;

	result = {
		width      : view.getUint32(pos),
		height     : view.getUint32(pos + 4),
		depth      : view.getUint8(pos + 8),
		type       : view.getUint8(pos + 9),
		compression: view.getUint8(pos + 10),
		filter     : view.getUint8(pos + 11),
		interlaced : view.getUint8(pos + 12)
	};

	if (!allowInvalid) {

		if ([0,2,3,4,6].indexOf(result.type) < 0)
			return {error: "Invalid color type."};

		// color depth
		switch(result.type) {
			case 0:
				if ([1,2,4,8,16].indexOf(result.depth) < 0)
					return {error: "Invalid color depth."};
				break;
			case 3:
				if ([1,2,4,8].indexOf(result.depth) < 0)
					return {error: "Invalid color depth."};
				break;
			default:
				if ([8,16].indexOf(result.depth) < 0)
					return {error: "Invalid color depth."};
		}

		// dimension
		if (!result.width || !result.height)
			return {error: "Invalid dimension."};

		// compression
		if (result.compression)
			return {error: "Invalid compression type."};

		// filter
		if (result.filter)
			return {error: "Invalid filter type."};

		// interlace mode
		if (result.interlaced < 0 || result.interlaced > 1)
			return {error: "Invalid interlace mode " + result.interlaced};
	}

	return result
};