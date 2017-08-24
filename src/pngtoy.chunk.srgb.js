/*
	Parse sRGB

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */
PngToy._sRGB = function(host) {

	var view = host.view,
		chunks = host.chunks,
		allowInvalid = host.allowInvalid,
		chunk = PngToy._findChunk(chunks, "sRGB"),
		intent, intents = [
			"Perceptual",
			"Relative colorimetric",
			"Saturation",
			"Absolute colorimetric"
		];

	if (!chunk) return null;

	intent = view.getUint8(chunk.offset);

	if (!allowInvalid) {
		if (intent < 0 || intent > 3)
			return {error: "Invalid range for sRGB render intent."};
	}

	return {
		intent: intent,
		desc: intents[intent] || null
	}
};