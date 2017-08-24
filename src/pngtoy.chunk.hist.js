/*
	Parse hIST

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._hIST = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "hIST"),
		plte = PngToy._PLTE(host),
		hist = [], pos, max;

	if (!chunk) return null;

	if (!allowInvalid && chunk.length % 2)
		return {error: "Invalid length of hIST chunk."};

	pos = chunk.offset;
	max = pos + chunk.length;

	for(; pos < max; pos += 2) hist.push(view.getUint16(pos));

	if (!allowInvalid) {
		if (hist.length !== plte.length)
			return {error: "hIST chunk must have same number of entries as PLTE chunk."};
	}

	return {histogram: hist}
};
