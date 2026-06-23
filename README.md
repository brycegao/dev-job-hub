# 程序员求职作战台

> Developer Job Hunt CRM: a local-first job hunting workspace for Chinese developers.

粘贴 JD，自动建档；追踪投递漏斗、简历版本、面试邀约和复盘；用本地规则和可选 AI Provider 辅助准备面试。默认无登录、无后端、无云同步，数据保存在当前浏览器。

![程序员求职作战台真实界面](./docs/assets/homepage-real.png)

## Live Demo

- Online demo: https://brycegao.github.io/dev-job-hub/
- Demo data: open the demo and click「一键加载示例数据，快速体验」

If the demo link is not available yet, enable GitHub Pages in the repository settings and select **GitHub Actions** as the source. The workflow in `.github/workflows/deploy-pages.yml` will publish `dist/` after each push to `main`.

## Why

找工作时，信息常常散落在招聘 App、微信、简历文档和 AI 对话里：

- JD 原文复制过一次，过几天就找不到
- 投了很多岗位，但很难判断哪个渠道、岗位类型或简历版本更有效
- 面试问题和薄弱点没有持续沉淀，容易反复踩坑
- AI 能帮忙，但缺少自己的 JD、简历和历史面试上下文

这个工具把核心流程收束到一个本地工作台：

```text
记录岗位 -> 分析 JD -> 关联简历 -> 跟踪面试 -> 复盘数据
```

## Current Status

当前代码已覆盖 Phase 1 MVP 的主要闭环：

- **岗位管理**：CRUD、状态筛选、全文搜索、JD 原文存储、列表内状态标签快速流转
- **JD 智能解析**：粘贴 JD 自动提取公司、岗位、渠道、城市、薪资、工作方式和链接；47 条纯同步关键词规则分析技术栈、业务方向和加分项
- **简历匹配**：多简历版本管理，岗位关联简历版本，JD 与简历匹配生成”可直接讲 / 缺口 / 差异化”建议
- **面试复盘**：邀约、日程、轮次、问题、自我评估、薄弱点、行动项和评分记录；跨面试高频薄弱点自动聚合
- **数据洞察**：投递漏斗可视化、渠道分布环形图、瓶颈提示、今日行动台和智能提醒
- **数据安全**：JSON 全量导入导出、AI 上下文 Markdown 导出、超过 7 天未备份自动提醒
- **AI 集成**：可选 OpenAI-compatible / Ollama Provider；未配置时仍可使用本地 Prompt Pack
- **桌面体验**：PWA 安装到桌面、键盘快捷键（N/1-7/?/Esc）、浏览器通知提醒

## Product Highlights

### 输入减负

- **JD 粘贴自动建档**：新增岗位时，JD 粘贴区为第一入口；粘贴招聘页面文本后自动填充常见字段并高亮提示，少打 80% 字段。
- **渠道自动补全**：根据历史岗位渠道提供输入建议。
- **状态一键切换**：在岗位列表点击状态标签即可流转，无需进入编辑表单。
- **面试标签填充**：新建面试时可根据 JD 关键词生成问题标签。

### 输出复盘

- **Command Center 概览**：四色指标卡（投递/面试/Offer/关闭）、水平漏斗图、渠道环形图和最近行动台，一眼看清求职全局。
- **今日行动台**：聚合跟进、即将面试、待复盘、超期无反馈和资料补全任务，按优先/今天/补全三档排序。
- **智能提醒**：提示停滞岗位、近期面试和历史薄弱点与当前 JD 的重合。
- **跨面试薄弱点**：自动统计高频薄弱点，帮你发现反复踩坑的知识方向。
- **一键导出 AI 上下文**：所有简历 + JD + 面试复盘 → Markdown，直接粘贴给 ChatGPT / DeepSeek。
- **统计洞察**：投递到回复、回复到面试、Offer 等漏斗指标，渠道转化率对比，瓶颈自动识别。

### 交互体验

- **键盘快捷键**：`N` 新增岗位、`1-7` 切页面、`?` 帮助、`Esc` 关闭表单。
- **PWA 安装**：点击安装提示，像桌面应用一样使用，离线可用。
- **三层空状态引导**：首屏 Hero → 加载后引导横幅 → 各页面步骤编号提示卡。
- **浏览器通知**：面试前自动推送提醒。
- **零运行时依赖**：仅 React 和 React DOM，纯 CSS 无组件库，所有导入均为相对路径。

## Screens

- **概览（Command Center）**：四色指标卡、投递漏斗、渠道环形图、最近行动台、面试复盘卡、智能提醒、今日行动面板。
- **岗位**：岗位列表、状态筛选、搜索、JD 粘贴区（第一入口 + 自动提取）、JD 分析、简历关联、匹配建议、面试记录入口。
- **简历**：简历版本列表、核心卖点和正文维护。
- **面试**：邀约状态、时间地点、轮次、问题、复盘、评分、日历导出和 AI 准备包。
- **统计**：投递漏斗、转化率、渠道分布、瓶颈提示、高频薄弱点和近 7 天面试。
- **设置**：JSON 导入导出、AI 上下文导出、示例数据、清空数据、AI Provider 配置。
- **帮助**：键盘快捷键和使用说明。

## Privacy

默认不需要登录，也不需要服务器。

- 岗位、JD、简历和面试数据保存在浏览器 IndexedDB。
- AI Provider 配置保存在当前浏览器 `localStorage`。
- API Key 不会进入 JSON 备份文件，也不会进入 AI 上下文导出。
- JSON 导入会替换当前本地数据，设置页会在覆盖前确认。
- 使用外部 AI Provider 时，请自行确认对应服务的数据策略。

## Tech Stack

- React 19 + TypeScript strict mode
- Vite 6 + `@vitejs/plugin-react`
- 原生 IndexedDB 封装：`applications`、`resumes`、`interviews` 三个 object store
- Vite PWA：安装提示、离线就绪提示和更新提示
- Plain CSS + CSS Custom Properties（45+ Design Token，语义化色值/圆角/阴影体系）
- Vitest + happy-dom：12 个测试文件，127 个测试用例
- 零运行时依赖：仅 React 和 React DOM，无组件库、无路由库、无状态管理库
- AI 调用：OpenAI-compatible Chat Completions / Ollama `/api/generate`

## Quick Start

```bash
npm install
npm run dev -- --host 127.0.0.1
```

Open: http://127.0.0.1:5173/

常用命令：

```bash
npm test          # 运行单元测试
npm run build     # TypeScript 检查 + 生产构建
npm run preview   # 预览生产构建
npm run lint      # ESLint 检查
```

## Keyboard Shortcuts

- `1` - `7`：切换概览、岗位、简历、面试、统计、设置、帮助
- `N`：新增岗位
- `?`：打开帮助
- `Esc`：关闭岗位或简历表单

## Project Structure

```text
src/
  app/                    # App 根组件、页面、通用组件和 hooks
  data/sampleData.ts       # 示例数据
  features/
    action-plan/           # 今日行动台
    ai-assist/             # Prompt Pack、AI Provider 配置和调用
    analytics/             # 漏斗指标、瓶颈和薄弱点洞察
    applications/          # 岗位领域模型、仓储和服务
    data-portability/      # JSON 导入导出
    interviews/            # 面试记录、日历导出
    jd-analysis/           # JD 关键词规则与字段提取
    resume-match/          # 简历与 JD 匹配建议
    resumes/               # 简历版本管理
  shared/
    components/
    services/              # 浏览器通知等共享服务
    storage/               # IndexedDB 封装
    utils/
```

## Demo GIF

![程序员求职作战台真实演示](./docs/assets/demo.gif)

演示路径：

| 步骤 | 操作 | 展示效果 |
|------|------|----------|
| 1 | 首页点击「加载示例数据」 | 一键填充，数据从 0 到有 |
| 2 | 查看概览 Command Center | 四色指标 + 投递漏斗 + 渠道环形图 |
| 3 | 新增岗位 → 粘贴 JD | 自动提取字段，虚线区变实线 |
| 4 | 查看岗位详情 | JD 分析与简历关联匹配 |
| 5 | 查看统计分析 | 漏斗指标、瓶颈提示和薄弱点 |
| 6 | 导出 AI 上下文 | 一键下载 Markdown 给 AI 复盘 |

## Documentation

- [docs/why-built-it.md](./docs/why-built-it.md): 为什么做它，可直接发布到开发者社区
- [mvp-requirements.md](./mvp-requirements.md): MVP 需求
- [architecture.md](./architecture.md): 技术架构
- [data-model.md](./data-model.md): 核心数据模型
- [screens.md](./screens.md): 页面与交互清单
- [development-slices.md](./development-slices.md): 开发切片与优先级
- [CLAUDE.md](./CLAUDE.md): AI 辅助开发指南

## License

[MIT](./LICENSE) — 本项目代码可自由使用、修改和分发，但请保留原始版权声明。
