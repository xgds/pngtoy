/*
	Parse sPLT

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._sPLT = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunkLst = PngToy._findChunks(chunks, "sPLT"),
		lst = [];

	if (!chunkLst.length) return null;

	chunkLst.forEach(function(chunk) {

		var result = {depth: null, name: null, palette: [], entries: 0},
			nameO, pos, len, width, b, palette = [], i, func;

		pos = chunk.offset;

		nameO = PngToy._getStr(view, pos, 80);
		result.name = nameO.text;

		pos = nameO.offset;

		result.depth = view.getUint8(pos++);

		width = result.depth === 8 ? 6 : 10;
		b = result.depth === 8 ? 1 : 2;
		len = chunk.length - (pos - chunk.offset);

		func = width === 6 ? view.getUint8.bind(view) : view.getUint16.bind(view);

		// unwrap as each entry can be either 6 (4+2) or 10 (5*2) bytes depending on depth (8|16)
		for(i = 0; i < len; i += width) {
			palette.push(
				func(pos + i),
				func(pos + i + b),
				func(pos + i + b * 2),
				func(pos + i + b * 3),
				view.getUint16(pos + i + b * 4)
			)
		}

		result.palette = palette;
		result.entries = palette.length / width;

		if (!allowInvalid) {
			if ((result.depth === 8 && len % 6) || (result.depth === 16 && len % 10))
				return {error: "Invalid sPLT chunk."};
			// todo validate name string...
			// todo order should be by decreasing frequency...
		}

		lst.push(result);
	});

	return lst;
};