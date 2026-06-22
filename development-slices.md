# 开发切片

## Slice 1: 本地数据与岗位列表

目标：

- 可以新增、编辑、删除岗位
- 可以在列表中查看岗位
- 可以按状态筛选

包含：

- 项目初始化
- JobApplication 数据结构
- IndexedDB / localStorage 存储
- Applications 页面
- Application Detail 基础信息

验收：

- 能录入 10 条岗位
- 刷新页面后数据不丢
- 能更新状态

## Slice 2: Dashboard 与基础统计

目标：

- 用户打开首页能看到求职进度

包含：

- Dashboard 页面
- 总投递数
- 本周投递数
- 回复数
- 面试数
- Offer 数
- 最近需要跟进岗位

验收：

- 修改岗位状态后统计更新
- 能看到本周投递情况

## Slice 3: JD 分析

目标：

- 粘贴 JD 后能提取技术关键词和风险提示

包含：

- 本地关键词词库
- JDAnalysis 数据结构
- 分析按钮
- 分析结果展示

第一版词库：

- Android
- Kotlin
- Java
- Flutter
- Dart
- React Native
- iOS
- Swift
- 性能优化
- 工程化
- CI/CD
- Git
- WebSocket
- 音视频
- 出海
- 国际化
- Google Play
- 支付
- 推送
- 地图
- 金融
- 交易
- AI
- 大模型

验收：

- 能从 JD 中提取关键词
- 能生成简短岗位画像

## Slice 4: 简历版本与匹配建议

目标：

- 用户可以管理多个简历版本
- 岗位可以关联简历版本
- 系统给出匹配建议

包含：

- ResumeVersion 数据结构
- Resume Versions 页面
- 岗位关联简历
- 简历关键词匹配
- 打招呼话术模板

验收：

- 一个岗位能关联一个简历版本
- 能看到匹配点和缺失点
- 能生成一段 BOSS / 脉脉私信文案

## Slice 5: 面试记录与复盘

目标：

- 每个岗位可以沉淀面试问题和复盘

包含：

- InterviewRecord 数据结构
- 新增面试记录
- 问题标签
- 面试记录列表

验收：

- 能给岗位添加多轮面试
- 能记录问题和薄弱点

## Slice 6: AI Provider 接入

目标：

- 在本地规则基础上接入 AI 分析

包含：

- AI Provider 抽象
- OpenAI compatible API
- Ollama API
- JD 分析 prompt
- 简历匹配 prompt
- 面试准备 prompt

验收：

- 用户配置 API 后，可以生成更自然的 JD 分析
- 未配置 API 时，本地规则仍可用

## Slice 6A: 零配置 AI Prompt Pack

目标：

- 不要求用户配置 API Key，也能获得 AI 辅助工作流
- 避免产品早期承担模型调用成本

包含：

- 岗位详情生成面试准备包
- 面试记录生成参考答案 Prompt
- 本地基础建议
- 一键复制完整 Prompt 到常用 AI
- Prompt 中自动带入 JD、简历卖点、面试复盘

验收：

- 粘贴 JD 后能生成面试准备建议
- 面试复盘记录能生成参考答案 Prompt
- 用户能一键复制 Prompt 到外部 AI

## Slice 7: 导入导出与作品化

目标：

- 让项目可展示、可迁移、可写文章

包含：

- JSON 导入导出
- 示例数据
- README
- 截图
- 配套文章大纲

验收：

- 可以导出全部求职数据
- 可以导入示例数据
- GitHub README 能讲清楚项目价值
