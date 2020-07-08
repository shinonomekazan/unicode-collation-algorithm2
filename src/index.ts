import * as fs from "fs";
import * as path from "path";
// import * as UnicodeTrie from "unicode-trie";
// import * as unorm from "unorm";
const UnicodeTrie = require("unicode-trie");
const unorm = require("unorm");

// transpiled version of \p{Unified_Ideograph}/u
// eslint-disable-next-line max-len
const isIdeograph = /^(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])$/;

function isCoreHan(cp: number) {
	return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0xF900 && cp <= 0xFAFF);
}

let collationElements: Map<string, number[][]> | null = null;
let ccc: any | null = null;
let initing: Promise<[void, void]> | null = null;

function initCcc(cccFilePath: string) {
	return new Promise<void>((resolve, reject) => {
		fs.readFile(cccFilePath, (err, v) => {
			if (err) {
				reject(err);
				return;
			}
			ccc = new UnicodeTrie(v);
			resolve();
		});
	});
}

function initCollation(collationFilePath: string) {
	return new Promise<void>((resolve, reject) => {
		collationElements = new Map();
		fs.readFile(collationFilePath, { encoding: "ascii" }, (err, v) => {
			if (err) {
				reject(err);
				return;
			}
			const lines = v.split(/\n/);
			for (const line of lines) {
				if (line.match(/^#/) || line.match(/^\s*$/)) continue;
				if (line.match(/^(?:@version|@implicitweight)/)) continue;

				const mapping = line.match(/^((?:\w+\s*?)+)\s*;\s*(\S*)\s*(?:#.*)$/);
				if (mapping == null) {
					console.log(line, mapping);
					throw new Error("invalid mapping");
				}
				const codes = mapping[1].split(/\s+/).map((code) => parseInt(code, 16));
				const elements = mapping[2].match(/\[(?:(?:\.|\*)\w+)*\]/g)!.map(
					(levels) => levels.substr(1, levels.length - 2).match(/(?:\.|\*)\w+/g)!.map((level) => parseInt(level.substr(1), 16)),
				);

				collationElements!.set(String.fromCodePoint.apply(null, codes), elements);
			}
			resolve();
		});
	});
}

function sortKeyRaw(str: string, flags: number) {
	if (collationElements == null || ccc == null) {
		throw new Error("Not initialized UCA yet.");
	}

	const codes = Array.from(str);

	const elements = [];

	let processed = 0;
	while (processed < codes.length) {
		let attemptOffset = processed;
		let attemptCodes = "";

		let lookedupOffset: number | undefined;
		let lookedupCodes: string | undefined;

		// TODO take max prefix length into account

		while (attemptOffset < codes.length) {
			attemptCodes += codes[attemptOffset];
			if (collationElements.get(attemptCodes) !== undefined) {
				lookedupOffset = attemptOffset;
				lookedupCodes = attemptCodes;
			}
			attemptOffset++;
		}

		if (lookedupCodes) {
			let extraOffset = lookedupOffset! + 1;

			let maxCCC = 0;

			let foundCCC;
			while (extraOffset < codes.length) {
				foundCCC = ccc.get(codes[extraOffset].codePointAt(0));
				if (foundCCC == null) break;
				if (foundCCC > maxCCC && collationElements.get(lookedupCodes + codes[extraOffset]) !== undefined) {
					lookedupCodes += codes[extraOffset];
					codes.splice(extraOffset, 1);
				}
				maxCCC = Math.max(foundCCC, maxCCC);
				extraOffset++;
			}

			for (const element of collationElements.get(lookedupCodes!)!) {
				elements.push(element);
			}
			processed = lookedupOffset! + 1;
		} else {
			const codePoint = codes[processed].codePointAt(0);
			if (codePoint == null) {
				throw new Error("Invalid code point");
			}
			const unknown = codes[processed++];
			if (codePoint >= 0x17000 && codePoint <= 0x18AFF) {
				elements.push([0xFB00, 0x0020, 0x0002], [(codePoint - 0x17000) | 0x8000, 0, 0]);
			} else if (codePoint >= 0x1B170 && codePoint <= 0x1B2FF) {
				elements.push([0xFB01, 0x0020, 0x0002], [(codePoint - 0x1B170) | 0x8000, 0, 0]);
			} else {
				if (isIdeograph.test(unknown)) {
					if (isCoreHan(unknown.codePointAt(0)!)) {
						elements.push([0xFB40 + (codePoint >> 15), 0x0020, 0x0002]);
					} else {
						elements.push([0xFB80 + (codePoint >> 15), 0x0020, 0x0002]);
					}
				} else {
					elements.push([0xFBC0 + (codePoint >> 15), 0x0020, 0x0002]);
				}
				elements.push([(codePoint & 0x7FFF) | 0x8000, 0, 0]);
			}
		}
	}

	let keySize = 0;

	for (let level = 0; level < 3; level++) {
		const isNormal = flags & (1 << (2 * level));
		const isReversed = flags & (1 << (2 * level + 1));
		if (!isNormal && !isReversed) {
			continue;
		}

		if (level !== 0) {
			keySize += 2;
		}

		for (const element of elements) {
			if (element[level]) {
				keySize += 2;
			}
		}
	}

	const key = Buffer.alloc(keySize);

	let offset = 0;

	let lastReversed;

	for (let level = 0; level < 3; level++) {
		let reversed = false;
		if (flags & (1 << (2 * level))) {
			// nothing
		} else if (flags & (1 << (2 * level + 1))) {
			reversed = true;
		} else {
			continue;
		}

		if (level !== 0) {
			key.writeUInt16BE(lastReversed ? 2 ** 16 - 1 : 0, offset);
			offset += 2;
		}

		for (const element of elements) {
			if (element[level]) {
				key.writeUInt16BE(reversed ? 2 ** 16 - 1 - element[level] : element[level], offset);
				offset += 2;
			}
		}
		lastReversed = reversed;
	}

	return key;
}

export const PRIMARY = 1;
export const PRIMARY_REVERSED = 2;
export const SECONDARY = 4;
export const SECONDARY_REVERSED = 8;
export const TERTIARY = 16;
export const TERTIARY_REVERSED = 32;
export const QUATERNARY = 64;
export const QUATERNARY_REVERSED = 128;

export function init() {
	if (ccc != null && collationElements != null) {
		return Promise.resolve(true);
	}
	if (initing != null) {
		return initing;
	}
	initing = Promise.all([
		initCcc(path.join(__dirname, "..", "ccc.trie")),
		initCollation(path.join(__dirname, "..", "allkeys.txt")),
	]);
	return new Promise((resolve, reject) => {
		initing!.then(() => {
			initing = null;
			resolve(true);
		}).catch((err) => {
			reject(err);
		});
	});
}

export function sortKey(str: string, flags: number) {
	return sortKeyRaw(unorm.nfd(str), flags);
}

export function compareWithFlags(a: string, b: string, flags: number) {
	const normalizedA = unorm.nfd(a);
	const normalizedB = unorm.nfd(b);

	const cmp = sortKeyRaw(normalizedA, flags).compare(sortKeyRaw(normalizedB, flags));

	if (flags & QUATERNARY && cmp === 0) {
		if (normalizedA < normalizedB) return -1;
		if (normalizedA > normalizedB) return 1;
		return 0;
	} if (flags & QUATERNARY_REVERSED && cmp === 0) {
		if (normalizedA < normalizedB) return 1;
		if (normalizedA > normalizedB) return -1;
		return 0;
	}
	return cmp;
}

export function compare(a: string, b: string) {
	return compareWithFlags(a, b, PRIMARY);
}

export function isEquals(a: string, b: string) {
	return compare(a, b) === 0;
}

export function isEqualsWithFlags(a: string, b: string, flags: number) {
	return compareWithFlags(a, b, flags) === 0;
}

export function compareAndAutoInit(a: string, b: string): Promise<number> {
	if (ccc == null || collationElements == null) {
		return init().then(() => compare(a, b));
	}
	return Promise.resolve(compare(a, b));
}

export function compareWithFlagsAndAutoInit(a: string, b: string, flags: number): Promise<number> {
	if (ccc == null || collationElements == null) {
		return init().then(() => compareWithFlags(a, b, flags));
	}
	return Promise.resolve(compareWithFlags(a, b, flags));
}

export function isEqualsAndAutoInit(a: string, b: string): Promise<boolean> {
	if (ccc == null || collationElements == null) {
		return init().then(() => isEquals(a, b));
	}
	return Promise.resolve(isEquals(a, b));
}

export function isEqualsWithFlagsAndAutoInit(a: string, b: string, flags: number): Promise<boolean> {
	if (ccc == null || collationElements == null) {
		return init().then(() => isEqualsWithFlags(a, b, flags));
	}
	return Promise.resolve(isEqualsWithFlags(a, b, flags));
}
