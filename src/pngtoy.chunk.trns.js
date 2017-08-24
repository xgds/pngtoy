/*
	Parse tRNS

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._tRNS = function(host) {

	var buffer = host.buffer,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "tRNS"),
		plte = PngToy._PLTE(host),
		ihdr = PngToy._IHDR(host),
		trans;

	if (!chunk) return null;

	if (!allowInvalid) {
		//if (!plte)
		//	return {error: "PLTE chunk is missing."};

		if (ihdr.type === 2 && (chunk.length % 6))
			return {error: "Invalid tRNS length."};
	}

	switch(ihdr.type) {

		case 0:
			trans = {
				alphas: new Uint16Array(buffer.slice(chunk.offset, chunk.offset + chunk.length)),
				length: chunk.length>>1
			};
			break;

		case 2:
			trans = {
				alphas: new Uint16Array(buffer.slice(chunk.offset, chunk.offset + chunk.length)),
				length: chunk.length / 6
			};
			break;

		case 3:
			trans = {
				alphas: new Uint8Array(buffer, chunk.offset, chunk.length),
				length: chunk.length
			};
			break;

		default:
			return allowInvalid ? {alphas: null, length: 0} : {error: "tRNS chunk is not valid for this color type."};
	}

	if (!allowInvalid && plte && trans.length > plte.length)
		return {error: "tRNS chunk contains more entries than palette entries."};

	return trans
};