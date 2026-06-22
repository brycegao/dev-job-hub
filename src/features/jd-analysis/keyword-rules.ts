/**
 * JD 关键词匹配规则库
 * 定义用于 JD 文本分析的关键词规则，包括技术栈、业务领域、工程能力、加分项和风险项。
 * 每条规则包含标准标签、别名列表和分类。
 */

import type { KeywordRule } from "./types";

/**
 * 关键词匹配规则列表
 * - tech: 技术栈关键词
 * - domain: 业务领域关键词
 * - capability: 工程能力关键词
 * - bonus: 加分项关键词
 * - risk: 潜在风险关键词
 */
export const keywordRules: KeywordRule[] = [
  { label: "Flutter", aliases: ["flutter"], category: "tech" },
  { label: "Dart", aliases: ["dart"], category: "tech" },
  { label: "Android", aliases: ["android", "安卓"], category: "tech" },
  { label: "Kotlin", aliases: ["kotlin"], category: "tech" },
  { label: "Java", aliases: ["java"], category: "tech" },
  { label: "React Native", aliases: ["react native", "rn"], category: "tech" },
  { label: "iOS", aliases: ["ios"], category: "tech" },
  { label: "Swift", aliases: ["swift"], category: "tech" },
  { label: "TypeScript", aliases: ["typescript", "ts"], category: "tech" },
  { label: "WebSocket", aliases: ["websocket", "web socket", "长连接"], category: "tech" },
  { label: "音视频", aliases: ["音视频", "播放器", "直播", "webrtc"], category: "tech" },

  { label: "出海", aliases: ["出海", "海外", "全球化"], category: "domain" },
  { label: "金融", aliases: ["金融", "证券", "基金", "银行"], category: "domain" },
  { label: "交易", aliases: ["交易", "行情", "撮合", "币圈", "加密货币"], category: "domain" },
  { label: "电商", aliases: ["电商", "商城", "交易平台"], category: "domain" },
  { label: "AI", aliases: ["ai", "人工智能", "aigc"], category: "domain" },
  { label: "大模型", aliases: ["大模型", "llm", "agent"], category: "domain" },
  { label: "工具产品", aliases: ["工具", "效率", "生产力"], category: "domain" },
  { label: "内容社区", aliases: ["内容", "社区", "短视频", "信息流"], category: "domain" },

  { label: "工程化", aliases: ["工程化", "规范", "代码质量"], category: "capability" },
  { label: "性能优化", aliases: ["性能", "卡顿", "启动优化", "内存优化", "fps"], category: "capability" },
  { label: "架构设计", aliases: ["架构", "模块化", "组件化", "解耦"], category: "capability" },
  { label: "CI/CD", aliases: ["ci/cd", "cicd", "持续集成", "自动化构建"], category: "capability" },
  { label: "稳定性治理", aliases: ["稳定性", "崩溃", "crash", "容灾", "降级"], category: "capability" },
  { label: "跨端协作", aliases: ["跨端", "多端", "前端协作"], category: "capability" },
  { label: "团队协作", aliases: ["团队协作", "code review", "代码评审"], category: "capability" },

  { label: "Google Play", aliases: ["google play", "gp 上架", "海外上架"], category: "bonus" },
  { label: "国际化", aliases: ["国际化", "多语言", "i18n", "本地化"], category: "bonus" },
  { label: "RTL", aliases: ["rtl", "阿语", "阿拉伯语"], category: "bonus" },
  { label: "支付", aliases: ["支付", "payment", "iap", "内购"], category: "bonus" },
  { label: "推送", aliases: ["推送", "push", "apns", "fcm"], category: "bonus" },
  { label: "地图定位", aliases: ["地图", "定位", "lbs"], category: "bonus" },
  { label: "埋点分析", aliases: ["埋点", "数据分析", "ab 实验", "a/b"], category: "bonus" },

  { label: "团队管理要求", aliases: ["团队管理", "带团队", "管理经验"], category: "risk" },
  { label: "英语沟通要求", aliases: ["英语", "英文", "跨国沟通"], category: "risk" },
  { label: "高年限要求", aliases: ["5年以上", "五年以上", "8年以上", "八年以上"], category: "risk" },
  { label: "高强度交付", aliases: ["抗压", "高强度", "快速迭代", "996"], category: "risk" },
  { label: "全栈泛化要求", aliases: ["全栈", "后端", "服务端", "运维"], category: "risk" },
];
