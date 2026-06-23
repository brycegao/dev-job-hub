import { useState } from "react";

const SECTIONS = [
  {
    id: "quickstart",
    title: "快速上手",
    steps: [
      {
        title: "录入目标岗位",
        desc: "进入「岗位」，点击新增。粘贴招聘 JD 文本，系统自动提取公司、岗位、渠道、薪资、城市和工作方式。也可以手动填写。",
      },
      {
        title: "维护简历版本",
        desc: "进入「简历」，为不同方向准备不同版本（如 Flutter 出海、后端开发）。填写核心卖点（每行一个）和简历正文。",
      },
      {
        title: "关联简历，查看匹配",
        desc: "回到岗位详情，选择最匹配的简历版本。系统会分析 JD × 简历的交叉匹配，给出可直接讲的优势、需要补充的缺口和差异化卖点。",
      },
      {
        title: "准备面试",
        desc: "在岗位详情点击「生成准备包」，获取重点复习方向、预测面试问题和复习清单。未配置 AI 时可复制 Prompt 到 ChatGPT / DeepSeek。",
      },
      {
        title: "复盘面试",
        desc: "面试后展开「面试复盘」，记录问题、标签、薄弱点、亮点和行动项。结构化复盘会自动融入后续面试准备。",
      },
    ],
  },
  {
    id: "tips",
    title: "使用技巧",
    tips: [
      {
        title: "状态一键切换",
        desc: "在岗位列表中，点击状态标签（如「已投递」）即可直接切换到下一个状态，无需打开详情页。",
      },
      {
        title: "今日行动台",
        desc: "概览页顶部聚合了所有待办：到期跟进、即将面试、待复盘、超期无反馈。按优先级排列，先处理高优先级任务。",
      },
      {
        title: "智能提醒",
        desc: "系统自动检测停滞岗位（投递 7 天以上无回复）和即将面试与历史薄弱点的重合，在概览页提醒你。",
      },
      {
        title: "瓶颈分析",
        desc: "统计页会自动识别低回复率、低面试转化率、渠道过于集中等问题，并给出具体改进建议。",
      },
      {
        title: "高频薄弱点",
        desc: "如果你在多场面试中出现相同的薄弱点（如「架构设计」），系统会在统计页汇总并建议准备。",
      },
      {
        title: "面试标签自动填充",
        desc: "新建面试记录时，问题标签会根据 JD 关键词自动填充，减少手工输入。",
      },
      {
        title: "导出日历",
        desc: "面试卡片点击「导出日程」下载 .ics 文件，双击即可添加到系统日历。面试页支持批量导出。",
      },
    ],
  },
  {
    id: "pages",
    title: "页面说明",
    pages: [
      { name: "概览", desc: "今日行动台 + 智能提醒 + 跟进/面试待办 + 求职健康度 + 渠道漏斗" },
      { name: "岗位", desc: "岗位列表（搜索/筛选/状态切换） + 详情（JD 分析/简历匹配/面试准备）" },
      { name: "简历", desc: "多版本管理 + 核心卖点 + 关联岗位" },
      { name: "面试", desc: "跨岗位面试列表（搜索） + 导出全部日程" },
      { name: "统计", desc: "投递漏斗 + 瓶颈提示 + 高频薄弱点 + 渠道分布" },
      { name: "设置", desc: "导入导出 JSON + 加载示例数据 + AI Provider 配置" },
    ],
  },
  {
    id: "ai",
    title: "AI 使用说明",
    ai: [
      "默认使用本地规则和建议，不产生任何模型调用成本。",
      "面试准备包和面试前简报会生成包含你私有数据的 Prompt，可一键复制到外部 AI 工具。",
      "如需页面内直接生成，在「设置」配置 OpenAI compatible API 或 Ollama 本地模型。",
      "API Key 只保存在当前浏览器，不会进入导出的求职数据。",
      "Prompt 中包含你的 JD 原文、简历内容、历史面试薄弱点等私有信息，不会发送到任何第三方（除非你主动使用 AI 生成功能）。",
    ],
  },
] as const;

const WORKFLOW_STEPS = [
  "粘贴 JD",
  "自动建档",
  "关联简历",
  "查看匹配",
  "准备面试",
  "结构化复盘",
  "更新状态",
  "调整策略",
];

export function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>("quickstart");

  function toggleSection(id: string) {
    setOpenSection(openSection === id ? null : id);
  }

  return (
    <section className="page-grid">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>如何使用求职作战台</h2>
            <p>粘贴 JD → 自动建档 → 关联简历 → 面试复盘 → 数据驱动优化。全程本地，数据不离开浏览器。</p>
          </div>
        </div>
        <div className="workflow-strip">
          {WORKFLOW_STEPS.map((step, i) => (
            <span key={step}>
              {i > 0 && <i> →</i>}
              {step}
            </span>
          ))}
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          className={`panel ${section.id === "quickstart" ? "wide" : ""}`}
        >
          <button
            className="help-section-toggle"
            onClick={() => toggleSection(section.id)}
          >
            <h2>{section.title}</h2>
            <span className="toggle-icon">{openSection === section.id ? "收起" : "展开"}</span>
          </button>

          {openSection === section.id && (
            <>
              {"steps" in section && (
                <div className="help-steps">
                  {section.steps.map((step, i) => (
                    <article key={i}>
                      <span>{i + 1}</span>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.desc}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {"tips" in section && (
                <div className="text-list">
                  <ul>
                    {section.tips.map((tip) => (
                      <li key={tip.title}>
                        <strong>{tip.title}</strong> — {tip.desc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {"pages" in section && (
                <div className="text-list">
                  <ul>
                    {section.pages.map((page) => (
                      <li key={page.name}>
                        <strong>{page.name}</strong> — {page.desc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {"ai" in section && (
                <div className="text-list">
                  <ul>
                    {section.ai.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      ))}

      <section className="panel wide">
        <div className="panel-header">
          <h2>数据安全说明</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>所有数据（岗位、简历、面试记录）保存在浏览器 IndexedDB，不经过任何服务器。</li>
            <li>JSON 导出文件包含完整数据，可随时备份到本地或迁移到其他浏览器。</li>
            <li>AI API Key 仅存储在当前浏览器 localStorage，不会随求职数据导出。</li>
            <li>清除浏览器数据会删除所有求职记录，建议定期在「设置」中导出备份。</li>
          </ul>
        </div>
      </section>
    </section>
  );
}
