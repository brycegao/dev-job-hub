export function HelpPage() {
  return (
    <section className="page-grid">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>如何使用求职作战台</h2>
            <p>按岗位、简历、面试、AI 准备这条线，把求职过程沉淀成可复盘的数据。</p>
          </div>
        </div>
        <div className="help-steps">
          <article>
            <span>1</span>
            <div>
              <strong>录入目标岗位</strong>
              <p>进入"岗位"，添加公司、岗位、渠道、状态、JD 原文和下次跟进日期。JD 是后续关键词分析、简历匹配和 AI 准备的基础。</p>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <strong>维护简历版本</strong>
              <p>进入"简历"，为不同方向准备不同版本，例如 Flutter 出海、Android 金融、AI 应用开发。每个版本填写核心卖点和简历正文。</p>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <strong>关联岗位和简历</strong>
              <p>回到岗位详情，选择最匹配的简历版本，再生成简历匹配建议，查看已匹配点、缺失点和沟通话术。</p>
            </div>
          </article>
          <article>
            <span>4</span>
            <div>
              <strong>准备面试</strong>
              <p>在岗位详情点击"分析 JD"和"生成准备包"。未配置 AI 时可复制 Prompt；配置 Provider 后可直接生成面试准备内容。</p>
            </div>
          </article>
          <article>
            <span>5</span>
            <div>
              <strong>复盘面试</strong>
              <p>每轮面试后记录问题、标签、薄弱点、自我复盘和结果。HR 通知下一轮时，可在原记录里更新邀约状态、下一轮轮次和预约时间。</p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>常用入口</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>"概览"查看总投递、本周投递、回复率和跟进提醒。</li>
            <li>"统计"查看渠道分布和投递转化情况。</li>
            <li>"设置"导入导出 JSON，加载示例数据，配置 AI Provider。</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>AI 使用建议</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>默认使用本地建议和 Prompt Pack，不产生模型调用成本。</li>
            <li>需要页面内直接生成时，在"设置"里配置 OpenAI compatible 或 Ollama。</li>
            <li>API Key 只保存在当前浏览器 localStorage，不会进入导出的求职数据。</li>
          </ul>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <h2>推荐工作流</h2>
        </div>
        <div className="workflow-strip">
          <span>新增岗位</span>
          <i>→</i>
          <span>粘贴 JD</span>
          <i>→</i>
          <span>关联简历</span>
          <i>→</i>
          <span>生成准备包</span>
          <i>→</i>
          <span>面试复盘</span>
          <i>→</i>
          <span>更新邀约</span>
          <i>→</i>
          <span>调整简历</span>
        </div>
      </section>
    </section>
  );
}
