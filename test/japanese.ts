import { describe, it } from "mocha";
import { expect } from "chai";
import * as uca from "../build";

describe("deep compare for japanese", () => {
	before(async () => {
		return uca.init();
	});
	it("同一の値", async () => {
		const sameCharSets = [
			["⼀", "㆒", "㊀"],
			["⼆", "㆓", "㊁"],
			["ぉ", "お", "ォ", "オ", "㋔", "ｫ", "ｵ"],
			["⻱","⻲","⿔","龜","龜"],
			["⽴","立"],
			["⾦","㊎","金"],
			["、","﹑","､"],
			["。","｡"],
			["「","﹁","｢"],
			["っ","つ","づ","ッ","ツ","ヅ","㋡","ｯ","ﾂ"],
			["ほ","ぼ","ぽ","ホ","ボ","ポ","ㇹ","㋭","ﾎ"],
			["ゃ","や","ャ","ヤ","㋳","ｬ","ﾔ"],
			["ゐ","ヰ","ヸ","㋼"],
			["ゑ","ヱ","ヹ","㋽"],
		];
		sameCharSets.forEach((sameCharSet) => {
			sameCharSet.forEach((sameChar, index) => {
				for (let i = index + 1; i < sameCharSet.length; i++) {
					expect(uca.compare(sameChar, sameCharSet[i])).to.eq(0);
				}
			});
		});
	});
	it("違う値", async () => {
		const differentCharSets = [
			["⼀", "一"],
		];
		differentCharSets.forEach((differentCharSet) => {
			differentCharSet.forEach((differentChar, index) => {
				for (let i = index + 1; i < differentCharSet.length; i++) {
					expect(uca.compare(differentChar, differentCharSet[i])).to.not.eq(0);
				}
			});
		});
	});
});
