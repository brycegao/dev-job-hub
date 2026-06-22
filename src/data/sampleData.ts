import type { AppDataExport } from "../features/data-portability/types";

const now = new Date().toISOString();

export const sampleData: AppDataExport = {
  app: "developer-job-hunt-crm",
  version: 1,
  exportedAt: now,
  applications: [
    {
      id: "sample-app-1",
      companyName: "星海出海科技",
      jobTitle: "Flutter 高级开发工程师",
      channel: "脉脉",
      city: "上海",
      remoteType: "hybrid",
      salaryRange: "25-35K",
      jobUrl: "https://example.com/jobs/flutter",
      jdText:
        "负责 Flutter 出海 App 开发，要求熟悉 Dart、Android、Google Play 上架、多语言国际化、性能优化、工程化和 CI/CD，有支付、推送、WebSocket 经验优先。",
      status: "interviewing",
      appliedAt: "2026-06-20",
      nextFollowUpAt: "2026-06-25",
      resumeVersionId: "sample-resume-1",
      notes: "技术负责人关注 Flutter 工程化和 Google Play 合规经验。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sample-app-2",
      companyName: "量化工具团队",
      jobTitle: "Android 客户端工程师",
      channel: "BOSS直聘",
      city: "北京",
      remoteType: "onsite",
      salaryRange: "22-32K",
      jobUrl: "https://example.com/jobs/android",
      jdText:
        "负责金融交易 Android App，要求 Kotlin、Java、WebSocket、行情、性能优化、稳定性治理、模块化架构，有金融或交易业务经验优先。",
      status: "contacted",
      appliedAt: "2026-06-21",
      nextFollowUpAt: "2026-06-24",
      resumeVersionId: "sample-resume-2",
      notes: "需要准备金融 App 网络容灾和行情链路案例。",
      createdAt: now,
      updatedAt: now,
    },
  ],
  resumes: [
    {
      id: "sample-resume-1",
      name: "Flutter 出海方向版",
      targetRole: "Flutter / 出海 App",
      content:
        "多年移动端开发经验，关注 Flutter、Dart、Android、Google Play 合规、多语言国际化、RTL、移动端工程化、CI/CD、App 上线交付。",
      filePath: "",
      highlights: [
        "Flutter 出海多语言与 RTL 适配",
        "Google Play 合规和上架检查",
        "移动端工程化与 AI Coding 落地",
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sample-resume-2",
      name: "Android 金融工程化版",
      targetRole: "Android / 金融 App",
      content:
        "熟悉 Android、Kotlin、Java、WebSocket、金融交易 App 架构、网络容灾、性能优化、稳定性治理、模块化和 CI/CD。",
      filePath: "",
      highlights: [
        "金融交易 App 架构与 WebSocket 治理",
        "OkHttp 多线路容灾和弱网恢复",
        "客户端性能优化和稳定性治理",
      ],
      createdAt: now,
      updatedAt: now,
    },
  ],
  interviews: [
    {
      id: "sample-interview-1",
      jobApplicationId: "sample-app-1",
      round: "first",
      scheduledAt: "2026-06-23",
      interviewerType: "技术负责人",
      questions: [
        {
          id: "sample-question-1",
          question: "Flutter 多语言和 RTL 你是怎么做工程化约束的？",
          answerNotes: "",
          tags: ["Flutter", "国际化", "工程化"],
        },
        {
          id: "sample-question-2",
          question: "Google Play 合规上架前你会检查哪些内容？",
          answerNotes: "",
          tags: ["Google Play", "合规", "上线交付"],
        },
      ],
      selfReview: "需要把 Google Play Data Safety 和 SDK 披露讲得更结构化。",
      weakPoints: ["Data Safety 表单细节", "隐私政策与实际采集行为对齐"],
      result: "pending",
      summary: "整体方向匹配，下一轮需要准备出海合规细节。",
      createdAt: now,
      updatedAt: now,
    },
  ],
};

