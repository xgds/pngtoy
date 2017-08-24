/*
	Parse sCAL

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._sCAL = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "sCAL"),
		pos, o, result = {};

	if (!chunk.length) return null;

	pos = chunk.offset;

	result.unit = view.getUint8(pos++);
	result.desc = ["meters", "radians"][result.unit] || null;

	o = PngToy._getStr(view, pos, 100000);
	result.unitsX = o.text;
	pos = o.offset;

	o = PngToy._getStr(view, pos, chunk.length - (pos - chunk.offset));
	result.unitsY = o.text;

	if (!allowInvalid) {
		if (result.unit < 1 || result.unit > 2)
			return {error: "Invalid unit"};
	}

	return result;
};