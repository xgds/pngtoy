/*
	Parse sTER

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._sTER = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "sTER"),
		pos, result = {};

	if (!chunk) return null;

	pos = chunk.offset;

	result.mode = view.getUint8(pos);
	result.desc = ["Cross-fuse layout", "Diverging-fuse layout"][result.mode];

	if (!allowInvalid) {
		if (result.mode < 0 || result.mode > 1)
			return {error: "Invalid mode for sTER chunk."}
	}

	return result
};