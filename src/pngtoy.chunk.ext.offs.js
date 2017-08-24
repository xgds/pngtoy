/*
	Parse oFFs

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._oFFs = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "oFFs"),
		pos, result = {};

	if (!chunk) return null;

	pos = chunk.offset;

	result.x = view.getInt32(pos);
	result.y = view.getInt32(pos+4);
	result.unit = view.getUint8(pos+8);
	result.desc = ["Pixels", "Micrometers"][result.unit] || "Invalid";

	if (!allowInvalid) {
		if (result.unit < 0 || result.unit > 1)
			return {error: "Invalid unit for oFFs chunk."}
	}

	return result
};