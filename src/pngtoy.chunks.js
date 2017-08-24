/*
	Parse and check chunks

	pngtoy
	By Epistemex (c) 2015-2017
	www.epistemex.com
 */

/**
 * Get and validate chunks
 * @param buffer
 * @param view
 * @param doCRC
 * @param allowInvalid
 * @static
 * @private
 */
PngToy._getChunks = function(buffer, view, doCRC, allowInvalid) {

	var me = this,
		pos = 8,
		len = buffer.byteLength,
		chunks = [], chunk,
		length, fourCC, offset, crc, colorType,
		plteChunk, trnsChunk, histChunk, offsChunk, sterChunk,
		isIDAT = true,
		noConst = ["iTXT", "tIME", "tEXt","zTXt"],
		fc = PngToy._findChunk,
		errNum = "Invalid number of ",
		errOrd = "Invalid chunk order for ";

	// build CRC table if none is built
	if (doCRC && !this.table) {
		this.table = new Uint32Array(256);
		for (var i = 0, j; i < 256; i++) {
			crc = i>>>0;
			for (j = 0; j < 8; j++) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
			this.table[i] = crc;
		}
	}

	/*
	Get chunk list with minimal validation
	 */

	while(pos < len) {

		// chunk header
		length = getUint32();
		fourCC = getFourCC();

		if (length > 2147483647 && !allowInvalid) return {error: "Invalid chunk size."};	// max size: 2^31-1

		offset = pos;			// data offset
		pos = offset + length;
		crc = getUint32();		// crc

		chunk = new PngToy.Chunk(fourCC, offset, length, crc, buffer);

		if (doCRC) {
			checkCRC(chunk);
			if (!chunk.crcOk && !allowInvalid) return {error: "Invalid CRC in chunk " + fourCC};
		}

		if (chunk.isReserved && !allowInvalid) return {error: "Invalid chunk name: " + fourCC};

		chunks.push(chunk);
	}

	/*
	Do error checking and validation
	 */

	if (!allowInvalid) {

		// check presence and count
		if (!chunksInRange("IHDR", 1, 1)) return {error: errNum + "IHDR chunks."};
		if (!chunksInRange("tIME", 0, 1)) return {error: errNum + "tIME chunks."};
		if (!chunksInRange("zTXt", 0, -1)) return {error: errNum + "zTXt chunks."};
		if (!chunksInRange("tEXt", 0, -1)) return {error: errNum + "tEXt chunks."};
		if (!chunksInRange("iTXt", 0, -1)) return {error: errNum + "iTXt chunks."};
		if (!chunksInRange("pHYs", 0, 1)) return {error: errNum + "pHYs chunks."};
		if (!chunksInRange("sPLT", 0, -1)) return {error: errNum + "sPLT chunks."};
		if (!chunksInRange("iCCP", 0, 1)) return {error: errNum + "iCCP chunks."};
		if (!chunksInRange("sRGB", 0, 1)) return {error: errNum + "sRGB chunks."};
		if (!chunksInRange("sBIT", 0, 1)) return {error: errNum + "sBIT chunks."};
		if (!chunksInRange("gAMA", 0, 1)) return {error: errNum + "gAMA chunks."};
		if (!chunksInRange("cHRM", 0, 1)) return {error: errNum + "cHRM chunks."};
		if (!chunksInRange("PLTE", 0, 1)) return {error: errNum + "PLTE chunks."};
		if (!chunksInRange("tRNS", 0, 1)) return {error: errNum + "tRNS chunks."};
		if (!chunksInRange("hIST", 0, 1)) return {error: errNum + "hIST chunks."};
		if (!chunksInRange("bKGD", 0, 1)) return {error: errNum + "bKGD chunks."};
		if (!chunksInRange("IDAT", 1, -1)) return {error: errNum + "IDAT chunks."};
		if (!chunksInRange("IEND", 1, 1)) return {error: errNum + "IEND chunks."};

		// check critical order
		if (chunks[0].name !== "IHDR" || chunks[chunks.length - 1].name !== "IEND")
			return {error: "Invalid PNG chunk order."};

		// check special cases
		colorType = view.getUint8(fc(chunks, "IHDR").offset + 9);
		plteChunk = fc(chunks, "PLTE");
		histChunk = fc(chunks, "hIST");
		trnsChunk = fc(chunks, "tRNS");
		offsChunk = fc(chunks, "oFFs");
		sterChunk = fc(chunks, "sTER");

		// sRGB and iCCP
		if (fc(chunks, "iCCP") && fc(chunks, "sRGB"))
			return {error: "Both iCCP and sRGB cannot be present."};

		// color type and palette
		if (colorType === 3 && !plteChunk)
			return {error: "Missing PLTE chunk."};

		if ((colorType === 0 || colorType === 4) && plteChunk)
			return {error: "PLTE chunk should not appear with this color type."};

		if ((colorType === 4 || colorType === 6) && trnsChunk)
			return {error: "tRNS chunk should not appear with this color type."};

		// histogram
		if (histChunk && !plteChunk)
			return {error: "hIST chunk can only appear if a PLTE chunk is present."};

		// check order relative to the PLTE chunk
		if (plteChunk) {
			if (!isBefore("PLTE", "IDAT")) return {error: errOrd + "PLTE."};
			if (histChunk && !isBetween("PLTE", "hIST", "IDAT")) return {error: errOrd + "hIST."};
			if (trnsChunk && !isBetween("PLTE", "tRNS", "IDAT")) return {error: errOrd + "tRNS."};
			if (fc(chunks, "bKGD") && !isBetween("PLTE", "bKGD", "IDAT")) return {error: errOrd + "bKGD."};
			if (!isBefore("cHRM", "PLTE")) return {error: errOrd + "cHRM."};
			if (!isBefore("gAMA", "PLTE")) return {error: errOrd + "gAMA."};
			if (!isBefore("iCCP", "PLTE")) return {error: errOrd + "iCCP."};
			if (!isBefore("sRGB", "PLTE")) return {error: errOrd + "sRGB."};
		}

		// oFFs chunk
		if (offsChunk && !isBefore("oFFs", "IDAT")) return {error: errOrd + "oFFs."};

		// sTER chunk
		if (sterChunk && !isBefore("sTER", "IDAT")) return {error: errOrd + "sTER."};

		// check order of chunks in more detail
		for(i = chunks.length - 2; i > 0; i--) {
			if (isIDAT && chunks[i].name !== "IDAT" && noConst.indexOf(chunks[i].name) < 0) {
				isIDAT = false
			}
			else if (!isIDAT && chunks[i].name === "IDAT") {
				return {error: "Invalid chunk inside IDAT chunk sequence."};
			}
		}
	}

	return {
		chunks: chunks
	};

	function chunksInRange(chunk, min, max) {
		var lst = PngToy._findChunks(chunks, chunk);
		return max < 0 ? lst.length >= min : lst.length >= min && lst.length <= max;
	}

	function isBetween(beforeChunk, chunk, afterChunk) {
		return isBefore(beforeChunk, chunk) && isBefore(chunk, afterChunk)
	}

	function isBefore(beforeChunk, chunk) {

		var bi = -1, ci = -1, i, l = chunks.length;

		for(i = 0; i < l; i++) {
			if (chunks[i].name === beforeChunk) bi = i;
			if (chunks[i].name === chunk) ci = i;
		}

		return (bi < ci);
	}

	function checkCRC(chunk) {

		var crcBuffer = new Uint8Array(buffer, chunk.offset - 4, chunk.length + 4);
		chunk.crcOk = (chunk.crc === calcCRC(crcBuffer));

		function calcCRC(buffer) {
			var crc = (-1>>>0), len = buffer.length, i;
			for (i = 0; i < len; i++) crc = (crc >>> 8) ^ me.table[(crc ^ buffer[i]) & 0xff];
			return (crc ^ -1)>>>0;
		}
	}

	function getFourCC() {
		var v = getUint32(),
			c = String.fromCharCode;
		return	c(v >>> 24) + c(v >> 16 & 0xff) + c(v >> 8 & 0xff) + c(v & 0xff);
	}

	function getUint32() {
		var i = view.getUint32(pos);
		pos += 4;
		return i>>>0;
	}

};

PngToy._getChunks.table = null;

PngToy._findChunk = function(chunks, name) {
	for(var i = 0, chunk; chunk = chunks[i++];) {
		if (chunk.name === name) return chunk;
	}
	return null
};

PngToy._findChunks = function(chunks, name) {
	var lst = [];
	chunks.forEach(function(chunk) {
		if (chunk.name === name) lst.push(chunk);
	});
	return lst
};

PngToy._getStr = function(view, offset, max) {

	/*
	All registered textual keywords in text chunks and all other chunk types are limited
	to the ASCII characters A-Z, a-z, 0-9, space, and the following 20 symbols:

	   	! " % & ' ( ) * + , - . / : ; < = > ? _

	but not the remaining 12 symbols:

   		# $ @ [ \ ] ^ ` { | } ~

	This restricted set is the ISO-646 "invariant" character set [ISO-646]. These characters
	have the same numeric codes in all ISO character sets, including all national variants of ASCII.
	 */

	var text = "", i = offset, ch = -1, v,
		warn = false,
		getChar = String.fromCharCode,
		san = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!\"%&'()*+,-./:;<=>?_";

	max += i;

	for(; i < max && ch;) {
		ch = view.getUint8(i++);
		if (ch) {
			v = getChar(ch);
			if (san.indexOf(v) > -1)
				text += v;
			else
				warn = true;

			continue;
		}
		break;
	}

	return {
		offset: i,
		text: text,
		warning: warn
	}
};

/**
 * Chunk object holding references to a single chunk in the PNG file. A chunk
 * is created internally by the PngToy instance and stored in the `instance.chunks` array.
 *
 * @param {string} name - FourCC name of the chunk
 * @param {number} offset - offset in raw binary files in bytes. Does not include chunk header.
 * @param {number} length - length of chunk content. Does not include CRC.
 * @param {number} crc - CRC checksum (if enabled).
 * @param {ArrayBuffer} buffer - reference to PNG binary buffer for this chunk
 * @property {string} name - FourCC name of the chunk
 * @property {number} offset - offset in raw binary files in bytes. Does not include chunk header.
 * @property {number} length - length of chunk content. Does not include CRC.
 * @property {number} crc - CRC checksum (if enabled).
 * @property {boolean} crcOk - If CRC, if true the CRC check was OK
 * @property {boolean} isCritical - chunk type critical (required)
 * @property {boolean} isPrivate - chunk type is private type
 * @property {boolean} isReserved - chunk type is reserved
 * @property {boolean} isCopySafe - chunk type is copy-safe (see official PNG documentation)
 * @property {ArrayBuffer} buffer - reference to PNG binary buffer for this chunk
 * @constructor
 */
PngToy.Chunk = function(name, offset, length, crc, buffer) {

	this.name = name;
	this.offset = offset;
	this.length = length;
	this.crc = crc;
	this.crcOk = true;

	this.isCritical = !(name.charCodeAt(0) & 0x20);
	this.isPrivate = !!(name.charCodeAt(1) & 0x20);
	this.isReserved = !!(name.charCodeAt(2) & 0x20);
	this.isCopySafe = !!(name.charCodeAt(3) & 0x20);

	this.buffer = buffer;
};

PngToy.Chunk.prototype = {

	/**
	 * Get the raw binary data as Uint8Array() including or excluding the
	 * chunk container.
	 *
	 * @param {boolean} [includeContainer=false] - include chunk container (size, name, data, crc) if true, if false only the chunk *content* is returned.
	 * @returns {Uint8Array}
	 */
	getRaw: function(includeContainer) {
		return includeContainer ? new Uint8Array(this.buffer, this.offset - 8, this.length + 12) : new Uint8Array(this.buffer, this.offset, this.length)
	}
};