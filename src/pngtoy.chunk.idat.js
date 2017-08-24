/*
	Parse IDAT

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._IDAT = function(host) {

	var buffer = host.buffer,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		i = 0, chunk,
		isEnd = false,
		inflate = new ezlib.Inflate(),
		hasIDAT = false;

	// find first IDAT chunk
	while(chunk = chunks[i++]) {
		if (chunk.name === "IDAT") {
			hasIDAT = true;
			break;
		}
	}

	while(chunk) {
		isEnd = chunk.name === "IEND";

		if (chunk.name === "IDAT")
			inflate.push(new Uint8Array(buffer, chunk.offset, chunk.length), isEnd);

		chunk = chunks[i++];
	}

	// wo IEND the inflate won't flush - can be redesigned to do a check pass first, then push() pass
	// since data can be decompressed wo IEND provided it's not missing due to corruption
	if (!isEnd && !allowInvalid)
		return {error: "Critical - missing IEND chunk."};

	return hasIDAT ?
		   (inflate.err ? {error: inflate.msg} : {buffer: inflate.result}) :
		   (allowInvalid ? {buffer: null} : {error: "Critical - no IDAT chunk(s)."})
};