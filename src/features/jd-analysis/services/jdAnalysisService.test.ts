import { describe, it, expect } from "vitest";
import { analyzeJD } from "./jdAnalysisService";

describe("analyzeJD", () => {
  it("extracts tech keywords from a Chinese JD mentioning Flutter, Android, and Kotlin", () => {
    const jd =
      "岗位要求：熟练使用 Flutter 和 Dart 进行跨端开发，熟悉 Android 原生开发，掌握 Kotlin 语言。";
    const result = analyzeJD(jd);

    expect(result.techKeywords).toContain("Flutter");
    expect(result.techKeywords).toContain("Dart");
    expect(result.techKeywords).toContain("Android");
    expect(result.techKeywords).toContain("Kotlin");
  });

  it("extracts domain keywords like 金融 from JD text", () => {
    const jd = "岗位方向 金融, 交易; 熟悉 证券, 基金 业务";
    const result = analyzeJD(jd);

    expect(result.domainKeywords).toContain("金融");
    expect(result.domainKeywords).toContain("交易");
  });

  it("extracts capability keywords from JD text", () => {
    const jd =
      "岗位要求：性能（启动优化）；熟悉 CI/CD、持续集成；架构（模块化）；稳定性（容灾）";
    const result = analyzeJD(jd);

    expect(result.capabilityKeywords).toContain("性能优化");
    expect(result.capabilityKeywords).toContain("CI/CD");
    expect(result.capabilityKeywords).toContain("架构设计");
    expect(result.capabilityKeywords).toContain("稳定性治理");
  });

  it("extracts bonus keywords from JD text", () => {
    const jd =
      "有 Google Play 上架经验者优先, 了解 国际化, i18n, 多语言 适配, 熟悉 支付, 内购, IAP";
    const result = analyzeJD(jd);

    expect(result.bonusKeywords).toContain("Google Play");
    expect(result.bonusKeywords).toContain("国际化");
    expect(result.bonusKeywords).toContain("支付");
  });

  it("extracts risk keywords from JD text", () => {
    const jd =
      "工作节奏：996、高强度、快速迭代；有团队管理、带团队、管理经验；英语（跨国沟通）要求";
    const result = analyzeJD(jd);

    expect(result.risks).toContain("高强度交付");
    expect(result.risks).toContain("团队管理要求");
    expect(result.risks).toContain("英语沟通要求");
  });

  it("returns empty arrays and default summary for empty or irrelevant JD", () => {
    const result1 = analyzeJD("");
    expect(result1.techKeywords).toEqual([]);
    expect(result1.domainKeywords).toEqual([]);
    expect(result1.capabilityKeywords).toEqual([]);
    expect(result1.bonusKeywords).toEqual([]);
    expect(result1.risks).toEqual([]);
    expect(result1.summary).toBe(
      "暂未识别出明显技术画像，建议补充更完整的 JD 后再分析。",
    );

    const result2 = analyzeJD("这是一段与招聘无关的普通文字。");
    expect(result2.techKeywords).toEqual([]);
    expect(result2.domainKeywords).toEqual([]);
    expect(result2.capabilityKeywords).toEqual([]);
    expect(result2.bonusKeywords).toEqual([]);
    expect(result2.risks).toEqual([]);
    expect(result2.summary).toBe(
      "暂未识别出明显技术画像，建议补充更完整的 JD 后再分析。",
    );
  });

  it("generates summary in the expected format", () => {
    const jd = "岗位需要 Flutter 和 Android 开发经验, 业务方向 出海, 金融";
    const result = analyzeJD(jd);

    expect(result.summary).toContain("技术栈偏向");
    expect(result.summary).toContain("Flutter");
    expect(result.summary).toContain("业务方向集中在");
    expect(result.summary).toContain("出海");
    expect(result.summary).toMatch(/；.*。$/);
  });

  it("matches aliases: 安卓 should match Android", () => {
    const jd = "熟练掌握 安卓 原生开发和 Kotlin";
    const result = analyzeJD(jd);

    expect(result.techKeywords).toContain("Android");
    expect(result.techKeywords).toContain("Kotlin");
  });

  it("matches aliases: 长连接 should match WebSocket", () => {
    const jd = "熟悉 长连接 和实时通信技术";
    const result = analyzeJD(jd);

    expect(result.techKeywords).toContain("WebSocket");
  });

  it("handles punctuation boundaries: keyword after comma or inside parentheses still matches", () => {
    const jd = "熟悉 Flutter，了解(React Native)框架。";
    const result = analyzeJD(jd);

    expect(result.techKeywords).toContain("Flutter");
    expect(result.techKeywords).toContain("React Native");
  });

  it("is case insensitive: flutter and Flutter both match", () => {
    const result1 = analyzeJD("flutter developer wanted");
    expect(result1.techKeywords).toContain("Flutter");

    const result2 = analyzeJD("Flutter developer wanted");
    expect(result2.techKeywords).toContain("Flutter");

    const result3 = analyzeJD("FLUTTER developer wanted");
    expect(result3.techKeywords).toContain("Flutter");
  });
});
