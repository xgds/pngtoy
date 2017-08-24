/*
	Parse bKGD

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._bKGD = function(host) {

	var	view = host.view,
		chunks = host.chunks,
		chunk = PngToy._findChunk(chunks, "bKGD"),
		ihdr = PngToy._IHDR(host);

	if (!chunk) return null;

	switch(ihdr.type) {
		case 0:
		case 4:
			return {background: [view.getUint16(chunk.offset)]};
		case 2:
		case 6:
			return {background: new Uint16Array(view.buffer, chunk.offset, 6)};
		default:	// type 3
			return {index: view.getUint8(chunk.offset)};
	}
};
