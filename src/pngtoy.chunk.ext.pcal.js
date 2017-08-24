/*
	Parse pCAL

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._pCAL = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "pCAL"),
		warn = false,
		pos, o, result = {}, params = [], i = 0, len;

	if (!chunk.length) return null;

	pos = chunk.offset;

	o = PngToy._getStr(view, pos, 80);
	result.calName = o.text;
	pos = o.offset;

	if (o.warn) warn = true;

	result.x0 = view.getInt32(pos);
	result.x1 = view.getInt32(pos+4);
	result.eqType = view.getUint8(pos+8);

	result.eqDesc = [
		"Linear mapping",
		"Base-e exponential mapping",
		"Arbitrary-base exponential mapping",
		"Hyperbolic mapping"][result.eqType] || null;

	result.paramCount = view.getUint8(pos+9);
	pos += 10;

	o = PngToy._getStr(view, pos, 10000);
	result.unitName = o.text;
	pos = o.offset;

	if (o.warn) warn = true;

	// parameters
	len = result.paramCount - 1;
	for(; i < len; i++) {
		o = PngToy._getStr(view, pos, 10000);
		params.push(o.text);
		pos = o.offset;
		if (o.warn) warn = true;
	}

	// last, not 0-terminated
	o = PngToy._getStr(view, pos, chunk.length - (pos - chunk.offset));
	params.push(o.text);
	if (o.warn) warn = true;

	result.parameters = params;

	if (!allowInvalid) {
		if (result.x0 === result.x1)
			return {error: "Invalid x0 or x1."};

		if (params.length !== result.paramCount)
			return {error: "Mismatching parameter count and number of parameters."};

		if (result.eqType < 0 || result.eqType > 3)
			return {error: "Invalid equation type."};

		if (warn)
			return {error: "One or more text field contains illegal chars."};
	}

	return result;
};