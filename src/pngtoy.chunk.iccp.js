/*
	Parse iCCP

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._iCCP = function() {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "iCCP"),
		pos, nameO, name, i, ch, result = {name: null, icc: null};

	if (!chunk) return null;

	pos = chunk.offset;
	nameO = PngToy._getStr(view, pos, 80);
	name = nameO.text;
	pos = nameO.offset;

	// validate chars in name
	if (!allowInvalid) {
		for(i = 0; i < name.length; i++) {
			ch = name.charCodeAt(i);
			if (!(ch > 31 && ch < 127) && !(ch > 160 && ch < 256))
				return {error: "ICC profile contains illegal chars in name."};
		}
	}

	result.name = name;

	// decompress profile
	if (view.getUint8(pos++) && !allowInvalid)
		return {error: "Invalid compression type."};

	try {
		result.icc = ezlib.inflate(new Uint8Array(view.buffer, pos, chunk.length - (pos - chunk.offset)));
	}
	catch(err) {
		if (!allowInvalid) return {error: err}
	}

	return result;
};