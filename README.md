# 程序员求职作战台

> Local-first job hunt dashboard for developers. Paste JD, track applications, resumes, interviews, and AI-assisted prep in one private workspace.

粘贴 JD，自动建档，追踪投递、简历版本、面试邀约和复盘。这个项目不是通用 CRM，而是面向程序员求职场景的本地优先作战台。

## Why

找工作时，信息通常散落在招聘软件、微信、简历文档、表格和 AI 对话里：

- JD 复制过一次，过几天就找不到原文
- 投递很多岗位，但不知道哪些渠道有效
- 简历版本不断修改，却很难关联真实反馈
- 面试问题没有系统复盘，薄弱点反复出现
- AI 能帮忙，但缺少自己的 JD、简历和历史面试上下文

这个工具把这些信息收束到一个本地工作台，让求职过程变得可记录、可行动、可复盘。

## Highlights

- **JD 粘贴自动建档**：自动提取公司、岗位、渠道、岗位链接、城市、薪资、工作方式
- **今日行动台**：聚合到期跟进、超期无反馈、即将面试、待复盘和资料补全任务
- **简历版本关联**：记录不同简历版本，并关联到具体岗位结果
- **JD 关键词分析**：本地规则识别技术栈、业务方向、能力要求、加分项和风险点
- **面试邀约与复盘**：记录精确到分钟的面试时间、地点、下一轮安排、问题和薄弱点
- **AI Prompt Pack**：无需配置 API Key，也能生成可复制到 ChatGPT / DeepSeek / 豆包 / Kimi 的高质量 Prompt
- **可选 AI Provider**：支持 OpenAI-compatible API / Ollama，在页面内直接生成建议
- **本地优先**：无登录、无后端、无云同步，数据保存在当前浏览器

## Who Is It For

适合正在求职、需要同时管理多个岗位的开发者：

- Android / Flutter / iOS / React Native 移动端工程师
- 前端 / 后端 / 全栈 / AI 应用开发者
- 通过 BOSS 直聘、脉脉、猎聘、拉勾、内推等渠道投递的人
- 想复盘投递效率、面试问题、简历版本效果的人

不适合企业招聘团队、多人协作 ATS、批量投递或招聘网站爬虫场景。

## Product Flow

1. 粘贴招聘页面、JD 或 HR 消息
2. 自动填充公司、岗位、薪资、城市、渠道等字段
3. 关联投递用的简历版本
4. 分析 JD 技术画像和简历匹配建议
5. 记录面试邀约、地点、下一轮安排和复盘
6. 回到今日行动台，处理跟进、面试准备和资料补全任务

## Privacy

默认不需要登录，也不需要服务器。

- 岗位、JD、简历内容、面试复盘保存在浏览器 IndexedDB
- API Key 只保存在当前浏览器 `localStorage`
- API Key 不会进入 JSON 导入导出数据包
- 不内置云同步，不上传用户数据
- 使用外部 AI Provider 时，请自行确认对应服务的数据策略

## Current Features

- 岗位新增、编辑、删除、状态更新
- JD 粘贴自动建档
- 岗位列表、详情和状态筛选
- 今日行动台
- 多简历版本管理
- 岗位关联简历与匹配建议
- JD 技术关键词分析与岗位画像
- AI 面试准备包和面试前简报
- 面试邀约、下一轮预约、地点/会议链接、问题标签、薄弱点复盘
- 状态分布、渠道分布和基础求职指标
- JSON 导入导出
- 一键加载示例数据
- 响应式布局

## Tech Stack

- React 19
- TypeScript
- Vite
- IndexedDB
- Vitest
- Plain CSS

## Quick Start

```bash
npm install
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

Run tests:

```bash
npm run test
```

Build:

```bash
npm run build
```

## Recommended Demo Script

发布到 GitHub 前，建议录制一个 20-30 秒 GIF：

1. 打开首页，点击加载示例数据
2. 进入岗位页，点击新增岗位
3. 粘贴一段 JD，展示字段自动填充
4. 保存岗位，回到今日行动台
5. 打开岗位详情，生成面试准备包

这个演示比功能清单更容易让新用户理解项目价值。

## Repository Topics

建议发布时添加这些 GitHub topics：

```text
job-hunt
job-tracker
developer-tools
local-first
react
typescript
indexeddb
ai
crm
interview-prep
```

## Documentation

- [mvp-requirements.md](./mvp-requirements.md): MVP 需求
- [architecture.md](./architecture.md): 技术架构
- [data-model.md](./data-model.md): 核心数据模型
- [screens.md](./screens.md): 页面与交互清单
- [development-slices.md](./development-slices.md): 开发切片与优先级
- [article-outline.md](./article-outline.md): 配套文章大纲

## Roadmap

当前阶段优先打磨已有体验，而不是继续堆功能：

- 优化新增岗位流程，让“先粘贴 JD，再确认字段”成为主路径
- 精简首页重复信息，让今日行动台更聚焦
- 打磨空状态文案，给出明确下一步动作
- 为 README 补充真实截图和 GIF
- 提供 GitHub Pages 在线 Demo

## License

当前仓库尚未声明开源许可证。正式发布前请补充 `LICENSE` 文件。
