/*
	Parse PLTE

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._PLTE = function(host) {

	var buffer = host.buffer,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "PLTE"),
		palette;

	if (!chunk) return null;

	palette = new Uint8Array(buffer, chunk.offset, chunk.length);

	if (!allowInvalid) {
		if (palette.length % 3)
			return {error: "Invalid palette size."};

		if (palette.length < 3 || palette.length > 3 * 256)
			return {error: "Invalid number of palette entries."};

	}

	return {
		palette: palette,
		length: palette.length / 3
	}
};
