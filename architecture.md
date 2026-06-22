# 第一阶段技术架构

## 1. 架构决策

第一阶段采用「纯 Web 本地版」：

```text
React + TypeScript + Vite
IndexedDB 本地存储
规则分析优先，AI Provider 预留
无登录、无服务端、无云同步
```

核心原则：

- 数据默认保存在用户本机
- 用户无需注册即可使用
- 先完成求职闭环，再考虑平台化
- AI 能力作为增强项，不作为基础功能依赖
- 后续可以平滑演进到 Tauri 桌面端或浏览器插件

## 2. 为什么第一阶段不做后端

求职数据包含公司、岗位、沟通记录、简历内容和面试复盘，天然比较私密。第一阶段做本地 Web 版有几个好处：

- 降低使用门槛
- 降低开发成本
- 避免服务器和账号体系
- 离线可用
- 方便快速迭代
- 适合先作为自用工具验证价值

后端能力暂缓，等出现明确需求后再做：

- 多设备同步
- 数据备份
- 多用户协作
- 浏览器插件自动采集岗位
- 公开发布 SaaS

## 3. 技术选型

推荐选型：

```text
Build: Vite
Framework: React
Language: TypeScript
Storage: IndexedDB
Storage Wrapper: Dexie
State: Zustand or React Context
Charts: Recharts
Style: CSS Modules or plain CSS
AI: OpenAI compatible API / Ollama, optional
```

第一版如果想进一步压低复杂度：

```text
React + TypeScript + Vite + localStorage
```

但更推荐从 IndexedDB 开始，因为 JD、简历正文、面试复盘文本会越来越多。

## 4. 分层设计

```text
UI Layer
  Pages
  Components
  Forms

Feature Layer
  applications
  resumes
  jd-analysis
  interviews
  analytics
  ai

Service Layer
  ApplicationService
  ResumeService
  JDAnalysisService
  ResumeMatchService
  InterviewService
  AnalyticsService

Repository Layer
  ApplicationRepository
  ResumeRepository
  InterviewRepository
  AnalysisRepository

Storage Layer
  IndexedDB / Dexie

AI Layer
  AIProvider interface
  RuleBasedProvider
  OpenAICompatibleProvider
  OllamaProvider
```

## 5. 推荐目录结构

```text
src/
  app/
    App.tsx
    routes.tsx
    layout/

  pages/
    dashboard/
    applications/
    resumes/
    interviews/
    analytics/
    settings/

  features/
    applications/
      components/
      repositories/
      services/
      types.ts
    resumes/
      components/
      repositories/
      services/
      types.ts
    jd-analysis/
      services/
      keyword-rules.ts
      types.ts
    interviews/
      components/
      repositories/
      services/
      types.ts
    analytics/
      services/
      types.ts
    ai/
      providers/
      prompts/
      types.ts

  shared/
    components/
    hooks/
    storage/
    utils/
    constants/

  data/
    seed.ts
```

## 6. 核心数据流

```text
新增岗位
  -> 保存岗位基础信息和 JD
  -> JDAnalysisService 提取关键词
  -> 生成岗位画像
  -> 用户关联简历版本
  -> ResumeMatchService 生成匹配建议
  -> 用户投递并更新状态
  -> 面试后记录问题和复盘
  -> AnalyticsService 汇总渠道、状态和转化率
```

## 7. AI Provider 设计

AI 能力不直接写死在页面里，而是放到 provider 层。

```ts
interface AIProvider {
  analyzeJD(input: AnalyzeJDInput): Promise<AnalyzeJDResult>;
  matchResume(input: MatchResumeInput): Promise<MatchResumeResult>;
  generateInterviewPrep(input: InterviewPrepInput): Promise<InterviewPrepResult>;
}
```

第一版至少保留 `RuleBasedProvider`：

- 没有 API Key 时可用
- 便于离线
- 便于测试
- 结果可控

后续再加：

- `OpenAICompatibleProvider`
- `OllamaProvider`

## 8. 第一阶段页面

第一阶段只做 6 个页面：

- Dashboard: 求职概览
- Applications: 岗位列表
- Application Detail: 岗位详情
- Resumes: 简历版本
- Interviews: 面试复盘
- Analytics: 数据统计

Settings 可先做轻量版：

- 数据导出
- 数据导入
- AI Provider 配置

## 9. 第一阶段不做什么

明确不做：

- 用户登录
- 云端同步
- 多用户协作
- 自动海投
- 招聘网站爬虫
- 自动填写申请表
- 浏览器插件
- 移动 App
- 支付系统

这些功能都可能有价值，但会拖慢 MVP。

## 10. 演进路线

```text
Phase 1: 纯 Web 本地版
  记录岗位、JD、简历版本、面试复盘、基础统计

Phase 2: AI 增强
  JD 分析、简历匹配、打招呼话术、面试准备

Phase 3: 桌面端
  Tauri 打包，支持本地文件和更强隐私感

Phase 4: 浏览器插件
  从 BOSS / 脉脉 / 拉勾 / LinkedIn 保存岗位

Phase 5: 可选同步
  用户自选云同步或 WebDAV / Git / 本地备份
```

## 11. MVP 验收标准

技术上第一阶段完成的标准：

- 可在浏览器运行
- 数据刷新后不丢
- 可录入和编辑岗位
- 可保存 JD 原文
- 可管理简历版本
- 可添加面试记录
- 可看到基础统计
- 可导入导出 JSON
- 不配置 AI 也能使用

