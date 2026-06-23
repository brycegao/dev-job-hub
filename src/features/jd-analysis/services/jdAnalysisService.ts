/**
 * JD 分析服务
 * 基于关键词规则库对 JD 文本进行分析，提取技术栈、业务领域、能力要求等关键信息。
 * 同时提供从 JD 原文中自动提取公司、岗位、薪资、城市、渠道等结构化字段的能力。
 * 使用纯本地规则，无需 AI 接口。
 */

import type { RemoteType } from "../../applications/types";
import { keywordRules } from "../keyword-rules";
import type { JDAnalysisResult, KeywordCategory } from "../types";
import { unique } from "../../../shared/utils/common";

/** 从 JD 文本中自动提取的结构化字段 */
export type ExtractedFields = {
  companyName?: string;
  jobTitle?: string;
  channel?: string;
  jobUrl?: string;
  salaryRange?: string;
  city?: string;
  remoteType?: RemoteType;
};

/** 常见中国城市列表 */
const COMMON_CITIES = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "南京", "武汉",
  "西安", "苏州", "厦门", "长沙", "重庆", "天津", "郑州",
  "东莞", "青岛", "大连", "珠海", "佛山",
] as const;

const JOB_TITLE_KEYWORDS = [
  "工程师",
  "开发",
  "架构师",
  "程序员",
  "客户端",
  "移动端",
  "前端",
  "后端",
  "Android",
  "iOS",
  "Flutter",
  "React Native",
  "Java",
  "Golang",
  "全栈",
  "AI",
] as const;

function compactLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanExtractedValue(value: string): string {
  return value
    .replace(/^[：:\-\s]+/, "")
    .replace(/[，,。；;|｜]+$/g, "")
    .trim();
}

function extractByLabel(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[：:]\\s*([^\\n]+)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return cleanExtractedValue(match[1]);
  }
  return undefined;
}

/** 从 JD 原文中提取公司名称 */
function extractCompanyName(text: string): string | undefined {
  const byLabel = extractByLabel(text, [
    "公司名称",
    "公司",
    "企业名称",
    "招聘公司",
    "用人单位",
  ]);
  if (byLabel) return byLabel;

  const lines = compactLines(text);
  const companyLine = lines.find((line) =>
    /(?:科技|信息|网络|数据|智能|软件|集团|公司|团队|工作室)/.test(line)
      && line.length <= 30
      && !JOB_TITLE_KEYWORDS.some((keyword) => line.includes(keyword)),
  );
  return companyLine ? cleanExtractedValue(companyLine) : undefined;
}

/** 从 JD 原文中提取岗位名称 */
function extractJobTitle(text: string): string | undefined {
  const byLabel = extractByLabel(text, [
    "职位名称",
    "岗位名称",
    "招聘岗位",
    "职位",
    "岗位",
  ]);
  if (byLabel) return byLabel;

  const lines = compactLines(text);
  const titleLine = lines.find((line) =>
    line.length <= 36
      && JOB_TITLE_KEYWORDS.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))
      && !/(?:岗位职责|职位描述|任职要求|岗位要求|工作地点|薪资|待遇)/.test(line),
  );
  return titleLine ? cleanExtractedValue(titleLine) : undefined;
}

/** 从 JD 原文中提取岗位链接 */
function extractJobUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s，。；;）)]+/i);
  return match?.[0];
}

/** 从 JD 原文中识别招聘渠道 */
function extractChannel(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/(?:boss直聘|zhipin|kanzhun)/i.test(text)) return "BOSS直聘";
  if (/(?:脉脉|maimai)/i.test(text)) return "脉脉";
  if (/(?:拉勾|lagou)/i.test(text)) return "拉勾";
  if (/(?:猎聘|liepin)/i.test(text)) return "猎聘";
  if (/(?:智联|zhaopin)/i.test(text)) return "智联招聘";
  if (/(?:前程无忧|51job)/i.test(text)) return "前程无忧";
  if (/(?:内推|referral)/i.test(text) || lower.includes("refer")) return "内推";
  return undefined;
}

/** 从 JD 原文中提取薪资范围 */
function extractSalary(text: string): string | undefined {
  // 匹配 "15-25K"、"15k-25k"、"15K-25K"、"15-25K/月"、"15-25k/月"
  let match = text.match(/(\d{1,3})\s*[kK千]?\s*[-~到至]\s*(\d{1,3})\s*[kK千]\s*(?:\/?月)?/);
  if (match) return `${match[1]}-${match[2]}K`;

  // 匹配 "年薪20-40万"、"年薪20-40 万"、"年薪 20-40万"
  match = text.match(/年薪\s*(\d{1,3})\s*[-~到至]\s*(\d{1,3})\s*万/);
  if (match) {
    const low = Math.round(Number(match[1]) / 12);
    const high = Math.round(Number(match[2]) / 12);
    return `${low}-${high}K`;
  }

  // 匹配 "月薪 15000-25000"、"15000-25000/月"、"15000～25000"
  match = text.match(/(?:月薪\s*)?(\d{4,6})\s*[-~到至～]\s*(\d{4,6})\s*(?:\/月)?/);
  if (match) {
    const low = Math.round(Number(match[1]) / 1000);
    const high = Math.round(Number(match[2]) / 1000);
    return `${low}-${high}K`;
  }

  return undefined;
}

/** 从 JD 原文中提取工作城市 */
function extractCity(text: string): string | undefined {
  // 匹配 (上海)、【深圳】、工作地点：北京、办公地点：杭州 等
  const patterns = [
    /[（(]\s*([^)）]+?)\s*[)）]/,  // (城市) 或 （城市）
    /(?:工作|办公|岗位)?(?:地点|城市|Location)\s*[：:]\s*(\S+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1];
      for (const city of COMMON_CITIES) {
        if (candidate.includes(city)) return city;
      }
    }
  }

  // 匹配行首 "上海 · Flutter 开发" 或 "深圳/北京"
  const cityListMatch = text.match(
    new RegExp(`(?:^|\\n)\\s*(${COMMON_CITIES.join("|")})(?:\\s*[·/、,，]|\\s)`)
  );
  if (cityListMatch) return cityListMatch[1];

  return undefined;
}

/** 从 JD 原文中提取远程工作类型 */
function extractRemoteType(text: string): RemoteType | undefined {
  const lower = text.toLowerCase();
  if (/(?:远程|remote|居家办公|在家办公)/.test(lower)) return "remote";
  if (/(?:混合|hybrid|混合办公|部分远程|灵活办公)/.test(lower)) return "hybrid";
  if (/(?:现场办公|到岗办公|坐班|onsite)/.test(lower)) return "onsite";
  return undefined;
}

/**
 * 从 JD 原文中自动提取结构化字段。
 * 仅返回有较高置信度的结果，供表单在用户粘贴 JD 时减少手工输入。
 */
export function extractJDFields(jdText: string): ExtractedFields {
  if (!jdText.trim()) return {};

  return {
    companyName: extractCompanyName(jdText),
    jobTitle: extractJobTitle(jdText),
    channel: extractChannel(jdText),
    jobUrl: extractJobUrl(jdText),
    salaryRange: extractSalary(jdText),
    city: extractCity(jdText),
    remoteType: extractRemoteType(jdText),
  };
}

/** 将文本统一为小写并压缩空白字符 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/** 检查文本中是否包含任一别名（支持词边界匹配） */
function hasAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;，；、（）()\\-])${escaped}(?:$|[\\s,;，；、（）()\\-])`, "i");
    return regex.test(text);
  });
}

/** 按分类从规则库中提取匹配的关键词 */
function pickByCategory(text: string, category: KeywordCategory): string[] {
  return unique(
    keywordRules
      .filter((rule) => rule.category === category && hasAlias(text, rule.aliases))
      .map((rule) => rule.label),
  );
}

/** 根据分析结果生成简要的文字摘要 */
function buildSummary(result: Omit<JDAnalysisResult, "summary">): string {
  const segments: string[] = [];

  if (result.techKeywords.length) {
    segments.push(`技术栈偏向 ${result.techKeywords.slice(0, 4).join("、")}`);
  }

  if (result.domainKeywords.length) {
    segments.push(`业务方向集中在 ${result.domainKeywords.slice(0, 3).join("、")}`);
  }

  if (result.capabilityKeywords.length) {
    segments.push(`重点考察 ${result.capabilityKeywords.slice(0, 3).join("、")}`);
  }

  if (result.bonusKeywords.length) {
    segments.push(`加分项包括 ${result.bonusKeywords.slice(0, 3).join("、")}`);
  }

  if (!segments.length) {
    return "暂未识别出明显技术画像，建议补充更完整的 JD 后再分析。";
  }

  return `${segments.join("；")}。`;
}

/**
 * 分析 JD 文本，提取关键词分类和摘要
 * @param jdText - 原始 JD 文本内容
 * @returns 包含各分类关键词和文字摘要的分析结果
 */
export function analyzeJD(jdText: string): JDAnalysisResult {
  const normalized = normalizeText(jdText);
  const result = {
    techKeywords: pickByCategory(normalized, "tech"),
    domainKeywords: pickByCategory(normalized, "domain"),
    capabilityKeywords: pickByCategory(normalized, "capability"),
    bonusKeywords: pickByCategory(normalized, "bonus"),
    risks: pickByCategory(normalized, "risk"),
  };

  return {
    ...result,
    summary: buildSummary(result),
  };
}
