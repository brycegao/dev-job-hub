# Developer Job Hunt CRM MVP

这是一个面向中国程序员求职场景的「求职作战台」MVP 需求文档。

目标不是做一个通用 CRM，而是帮助技术岗求职者把投递、JD、简历版本、面试复盘和 AI 辅助分析串起来，形成可复盘的求职闭环。

## 当前实现

第一版已实现纯 Web 本地 MVP：

- React + TypeScript + Vite
- 原生 IndexedDB 本地持久化
- 岗位新增、编辑、删除、状态更新
- JD 技术关键词分析与岗位画像
- 多简历版本管理
- 岗位关联简历与匹配建议
- 零配置 AI Prompt Pack：生成面试准备建议、参考答案 Prompt、一键复制到常用 AI
- 面试记录、问题标签、薄弱点复盘
- Dashboard 基础指标
- 岗位列表与详情
- 状态分布、渠道分布
- JSON 导入导出
- 一键加载示例数据，方便演示完整求职流程
- 响应式布局

## AI 使用策略

当前版本优先降低用户使用成本：不要求配置 API Key，不把模型密钥放在前端。

- 默认生成本地基础建议
- 自动拼装高质量 Prompt
- 一键复制到 ChatGPT / DeepSeek / 豆包 / Kimi 等常用 AI
- 后续再扩展 OpenAI compatible API 或 Ollama 本地模型

## 本地运行

```bash
npm install
npm run dev -- --host 127.0.0.1
```

访问：

```text
http://127.0.0.1:5173/
```

生产构建：

```bash
npm run build
```

## 文档结构

- [mvp-requirements.md](./mvp-requirements.md): 第一版 MVP 需求
- [architecture.md](./architecture.md): 第一阶段技术架构
- [data-model.md](./data-model.md): 核心数据模型
- [screens.md](./screens.md): 页面与交互清单
- [development-slices.md](./development-slices.md): 开发切片与优先级
- [article-outline.md](./article-outline.md): 配套文章大纲
