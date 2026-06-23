# 程序员求职作战台

> Developer Job Hunt CRM: a local-first job hunting workspace for Chinese developers.

粘贴 JD，自动建档；追踪投递漏斗、简历版本、面试邀约和复盘；用本地规则和可选 AI Provider 辅助准备面试。默认无登录、无后端、无云同步，数据保存在当前浏览器。

![程序员求职作战台演示](./homepage.png)

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

- 岗位 CRUD、状态筛选、全文搜索、JD 原文存储
- 粘贴 JD 自动提取公司、岗位、渠道、城市、薪资、工作方式和链接
- 列表内点击状态标签快速流转
- 多简历版本管理，岗位可关联简历版本
- 本地规则 JD 关键词分析和简历匹配建议
- 面试邀约、日程、轮次、问题、复盘、薄弱点、行动项和评分记录
- 今日行动台、智能提醒、投递漏斗、渠道统计、瓶颈提示和高频薄弱点分析
- JSON 全量导入导出、AI 上下文 Markdown 导出、一键加载示例数据
- 可选 OpenAI-compatible / Ollama Provider；未配置时仍可使用 Prompt Pack
- PWA 安装提示、离线可用提示、浏览器通知提醒和键盘快捷键

## Product Highlights

### 输入减负

- **JD 粘贴自动建档**：粘贴招聘页面文本后，自动填充常见字段并高亮提示。
- **渠道自动补全**：根据历史岗位渠道提供输入建议。
- **状态一键切换**：在岗位列表点击状态标签即可流转，无需进入编辑表单。
- **面试标签填充**：新建面试时可根据 JD 关键词生成问题标签。

### 输出复盘

- **今日行动台**：聚合跟进、即将面试、待复盘、超期无反馈和资料补全任务。
- **智能提醒**：提示停滞岗位、近期面试和历史薄弱点与当前 JD 的重合。
- **简历匹配建议**：基于 JD 与简历内容生成“可直接讲 / 缺口 / 差异化”建议。
- **统计洞察**：展示投递到回复、回复到面试、Offer 等漏斗指标，并识别瓶颈。

## Screens

- **概览**：空状态引导、示例数据加载、今日行动台、智能提醒、求职健康度、近期跟进和渠道漏斗。
- **岗位**：岗位列表、状态筛选、搜索、岗位表单、JD 分析、简历关联、匹配建议、面试记录入口。
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
- Plain CSS + CSS Custom Properties
- Vitest + happy-dom：12 个测试文件，127 个测试用例
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

演示路径：

| 步骤 | 操作 | 展示效果 |
|------|------|----------|
| 1 | 首页点击「加载示例数据」 | 一键填充，数据从 0 到有 |
| 2 | 新增岗位，粘贴一段 JD | 薪资/城市/渠道自动填充 + 高亮动画 |
| 3 | 列表中点击状态标签 | 一键从「已投递」切到「面试中」 |
| 4 | 查看概览页 | 今日行动台 + 智能提醒卡片 |
| 5 | 打开岗位详情，关联简历 | 匹配建议（可直接讲/缺口/差异化） |
| 6 | 统计页 | 瓶颈提示 + 高频薄弱点分析 |

重新生成 README 演示 GIF：

```bash
python3 scripts/generate_demo_gif.py
```

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
