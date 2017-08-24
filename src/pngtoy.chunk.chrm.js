/*
	Parse cHRM

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._cHRM = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "cHRM"),
		result, pos;

	if (!chunk) return null;

	pos = chunk.offset;

	result = {
		whiteX: view.getUint32(pos) / 100000,
		whiteY: view.getUint32(pos + 4) / 100000,
		redX  : view.getUint32(pos + 8) / 100000,
		redY  : view.getUint32(pos + 12) / 100000,
		greenX: view.getUint32(pos + 16) / 100000,
		greenY: view.getUint32(pos + 20) / 100000,
		blueX : view.getUint32(pos + 24) / 100000,
		blueY : view.getUint32(pos + 28) / 100000
	};

	if (!allowInvalid) {
		// todo check some range??
	}

	return result
};