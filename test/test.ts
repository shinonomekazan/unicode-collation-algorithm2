import { describe, it } from "mocha";
import { expect } from "chai";
import * as uca from "../build";

describe("compare test", () => {
	before(async () => {
		return uca.init();
	});
	it("大小比較", async () => {
		expect(uca.compare("a", "a")).to.eq(0);
		expect(uca.compare("a", "b")).to.eq(-1);
		expect(uca.compare("b", "a")).to.eq(1);
	});
	it("日本語系のテスト", async () => {
		expect(uca.compare("ギガゾンビ", "きかそんひ")).to.eq(0);
		expect(uca.compare("きかそんひ", "ギガゾンビ")).to.eq(0);
		expect(uca.compare("わわわわ", "わワﾜ㋻")).to.eq(0);
		expect(uca.compare("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ", "あいうえおかきくけこさしすせそ")).to.eq(0);
		expect(uca.compare("ｬｭｮャュヨゃゅよ", "やゆよやゆよやゆよ")).to.eq(0);
		expect(uca.compareWithFlags("ｬｭｮャュヨゃゅよ", "やゆよやゆよやゆよ", 0)).to.eq(0);
	});
	it("Alphabet test", async () => {
		expect(uca.compare("YyÝýÿŶŷŸȲȳʸẎẏẙỲỳỴỵỶỷỸỹⓎⓨＹｙ", "YYYYYYYYYYYYYYYYYYYYYYYYYY")).to.eq(0);
	});
	it("emoji", async () => {
		// same as mysql unicode_ci: 0
		expect(uca.compare("🍣", "🍺")).to.eq(-1);
		expect(uca.compareWithFlags("🍣", "🍺", 0)).to.eq(0);
	});
});
