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

/** 数组去重，基于 Set */
export function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
