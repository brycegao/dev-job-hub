/**
 * 通用工具函数。
 */

/** 生成唯一 ID，优先使用 crypto.randomUUID()，降级为时间戳+随机数 */
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 数组去重，基于 Set（自动 trim 并过滤空字符串） */
export function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

/** 将文本按换行拆分为非空行 */
export function parseLines(text: string): string[] {
  return text.split("\n").map((item) => item.trim()).filter(Boolean);
}

/** 将小数转为百分比字符串，零值返回 "--" */
export function formatPercent(value: number): string {
  if (value === 0) return "--";
  return `${Math.round(value * 100)}%`;
}

/** 人性化日期格式（相对日期 + 绝对日期） */
export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return "未填写";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays === -1) return "明天";
  if (diffDays > 0 && diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} 天后`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

/** 人性化日期时间格式 */
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return "未填写";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
