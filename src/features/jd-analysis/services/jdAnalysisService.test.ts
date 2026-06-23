import { describe, it, expect } from "vitest";
import { analyzeJD, extractJDFields } from "./jdAnalysisService";

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

describe("extractJDFields", () => {
  it("extracts salary range in K format", () => {
    const jd = "薪资待遇：15-25K";
    const result = extractJDFields(jd);
    expect(result.salaryRange).toBe("15-25K");
  });

  it("extracts lowercase k salary", () => {
    const jd = "15k-25k/月";
    const result = extractJDFields(jd);
    expect(result.salaryRange).toBe("15-25K");
  });

  it("extracts annual salary and converts to monthly K", () => {
    const jd = "年薪20-40万";
    const result = extractJDFields(jd);
    expect(result.salaryRange).toBe("2-3K");
  });

  it("extracts numeric salary and converts to K", () => {
    const jd = "月薪 15000-25000";
    const result = extractJDFields(jd);
    expect(result.salaryRange).toBe("15-25K");
  });

  it("extracts city from parentheses", () => {
    const jd = "（上海）Flutter 开发工程师";
    const result = extractJDFields(jd);
    expect(result.city).toBe("上海");
  });

  it("extracts city from 工作地点 label", () => {
    const jd = "工作地点：北京\n岗位要求 Flutter 开发经验";
    const result = extractJDFields(jd);
    expect(result.city).toBe("北京");
  });

  it("extracts city from line start", () => {
    const jd = "深圳 · Flutter 高级开发\n熟悉 Dart 语言";
    const result = extractJDFields(jd);
    expect(result.city).toBe("深圳");
  });

  it("extracts remote type", () => {
    const jd = "支持远程办公，每周到岗 2 天";
    const result = extractJDFields(jd);
    expect(result.remoteType).toBe("remote");
  });

  it("extracts hybrid type", () => {
    const jd = "混合办公模式，灵活安排";
    const result = extractJDFields(jd);
    expect(result.remoteType).toBe("hybrid");
  });

  it("returns empty object for empty text", () => {
    const result = extractJDFields("");
    expect(result).toEqual({});
  });

  it("returns undefined for fields not found", () => {
    const jd = "这是一个没有薪资和城市信息的 JD 描述";
    const result = extractJDFields(jd);
    expect(result.salaryRange).toBeUndefined();
    expect(result.city).toBeUndefined();
    expect(result.remoteType).toBeUndefined();
  });

  it("extracts all three fields from a realistic JD", () => {
    const jd = `（杭州）高级 Flutter 开发工程师
薪资范围：25-40K
支持远程办公
岗位要求：熟练使用 Flutter 和 Dart 进行跨端开发`;
    const result = extractJDFields(jd);
    expect(result.city).toBe("杭州");
    expect(result.salaryRange).toBe("25-40K");
    expect(result.remoteType).toBe("remote");
  });

  it("extracts onsite type for onsite JD", () => {
    const jd = "工作地点：上海\n薪资：20-35K\n需到岗办公";
    const result = extractJDFields(jd);
    expect(result.remoteType).toBe("onsite");
  });

  it("extracts company name and job title from labeled JD", () => {
    const jd = `公司名称：星海科技
职位名称：Flutter 高级开发工程师
工作地点：上海
薪资：25-35K`;
    const result = extractJDFields(jd);

    expect(result.companyName).toBe("星海科技");
    expect(result.jobTitle).toBe("Flutter 高级开发工程师");
  });

  it("extracts company and title from common copied lines", () => {
    const jd = `某出海工具团队
Android / Flutter 客户端工程师
25k-40k/月
上海 · 混合办公`;
    const result = extractJDFields(jd);

    expect(result.companyName).toBe("某出海工具团队");
    expect(result.jobTitle).toBe("Android / Flutter 客户端工程师");
    expect(result.salaryRange).toBe("25-40K");
    expect(result.city).toBe("上海");
    expect(result.remoteType).toBe("hybrid");
  });

  it("extracts channel and job url", () => {
    const jd = `来源：脉脉
招聘岗位：移动端工程师
https://maimai.cn/jobs/12345
工作地点：北京`;
    const result = extractJDFields(jd);

    expect(result.channel).toBe("脉脉");
    expect(result.jobUrl).toBe("https://maimai.cn/jobs/12345");
    expect(result.jobTitle).toBe("移动端工程师");
  });

  it("detects known recruiting channels", () => {
    expect(extractJDFields("BOSS直聘 Flutter 工程师").channel).toBe("BOSS直聘");
    expect(extractJDFields("拉勾招聘 Android").channel).toBe("拉勾");
    expect(extractJDFields("猎聘职位 iOS").channel).toBe("猎聘");
    expect(extractJDFields("内推 Java 后端").channel).toBe("内推");
  });
});
