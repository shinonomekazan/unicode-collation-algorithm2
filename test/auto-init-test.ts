import { describe, it } from "mocha";
import { expect } from "chai";
import * as uca from "../build";

describe("async compare test", () => {
	it("大小比較", async () => {
		expect(await uca.compareAndAutoInit("a", "a")).to.eq(0);
		expect(await uca.compareAndAutoInit("a", "b")).to.eq(-1);
		expect(await uca.compareAndAutoInit("b", "a")).to.eq(1);
	});
	it("日本語系のテスト", async () => {
		expect(await uca.compareAndAutoInit("ギガゾンビ", "きかそんひ")).to.eq(0);
		expect(await uca.compareAndAutoInit("きかそんひ", "ギガゾンビ")).to.eq(0);
		expect(await uca.compareAndAutoInit("わわわわ", "わワﾜ㋻")).to.eq(0);
		expect(await uca.compareAndAutoInit("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ", "あいうえおかきくけこさしすせそ")).to.eq(0);
		expect(await uca.compareAndAutoInit("ｬｭｮャュヨゃゅよ", "やゆよやゆよやゆよ")).to.eq(0);
		expect(await uca.compareWithFlagsAndAutoInit("ｬｭｮャュヨゃゅよ", "やゆよやゆよやゆよ", 0)).to.eq(0);
	});
	it("Alphabet test", async () => {
		expect(await uca.compareAndAutoInit("YyÝýÿŶŷŸȲȳʸẎẏẙỲỳỴỵỶỷỸỹⓎⓨＹｙ", "YYYYYYYYYYYYYYYYYYYYYYYYYY")).to.eq(0);
	});
	it("emoji", async () => {
		// same as mysql unicode_ci: 0
		expect(await uca.compareAndAutoInit("🍣", "🍺")).to.eq(-1);
		expect(await uca.compareWithFlagsAndAutoInit("🍣", "🍺", 0)).to.eq(0);
	});
});
