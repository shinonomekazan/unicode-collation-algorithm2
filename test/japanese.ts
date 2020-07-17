import { describe, it } from "mocha";
import { expect } from "chai";
import * as uca from "../build";

describe("deep compare for japanese", () => {
	before(async () => {
		return uca.init();
	});
	it("同一の値", async () => {
		const sameCharSets = [
			["一", "⼀", "㆒", "㊀"],
			["二", "⼆", "㆓", "㊁"],
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
});
