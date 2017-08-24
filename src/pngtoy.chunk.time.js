/*
	Parse tIME

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._tIME = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "tIME"),
		pos, result;

	if (!chunk) return null;

	pos = chunk.offset;

	result = {
		year: view.getUint16(pos),
		month: view.getUint8(pos+2),
		day: view.getUint8(pos+3),
		hour: view.getUint8(pos+4),
		minute: view.getUint8(pos+5),
		second: view.getUint8(pos+6),
		date : null
	};

	if (!allowInvalid) {
		if (result.year < 0 || result.year > 0xffff ||
			result.month < 1 || result.month > 12 ||
			result.day < 1 || result.day > 31 ||
			result.hour < 0 || result.hour > 23 ||
			result.minute < 0 || result.minute > 59 ||
			result.second < 0 || result.second > 60)
			return {error: "Invalid timestamp."}
	}

	try {
		// todo UTC issue -> new Date(date - timezone) ?
		result.date = new Date(
			result.year, result.month - 1, result.day,
			result.hour, result.minute, Math.min(59, result.second)
		);
	}
	catch(err) {
		if (!allowInvalid) return {error: err}
	}

	return result;
};
