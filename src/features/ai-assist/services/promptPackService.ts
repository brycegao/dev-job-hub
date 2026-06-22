/**
 * 面试准备提示词打包服务
 * 根据职位申请、简历版本和面试记录，构建结构化的面试准备数据包和 AI 提示词。
 * 输出引用用户真实数据，给出具体可执行的建议。
 */

import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import { analyzeJD } from "../../jd-analysis/services/jdAnalysisService";
import type { ResumeVersion } from "../../resumes/types";
import type { InterviewAnswerPack, InterviewPrepPack } from "../types";
import { unique } from "../../../shared/utils/common";

/** 截断文本到指定长度，超出部分以省略号结尾 */
function limitText(text: string | undefined, maxLength: number): string {
  if (!text) {
    return "未填写";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/** 将标题和列表值格式化为 Markdown 无序列表 */
function lines(title: string, values: string[]): string {
  return [`## ${title}`, ...values.map((value) => `- ${value}`)].join("\n");
}

/** 从简历亮点中查找包含某个关键词的条目 */
function findHighlightForKeyword(
  keyword: string,
  highlights: string[],
): string | undefined {
  const lowered = keyword.toLowerCase();
  return highlights.find((h) => h.toLowerCase().includes(lowered));
}

/**
 * 构建面试准备数据包
 * 交叉引用 JD 关键词 × 简历亮点 × 历史面试数据，生成具体建议。
 */
export function buildInterviewPrepPack(
  application: JobApplication,
  resume?: ResumeVersion,
  interviews?: InterviewRecord[],
): InterviewPrepPack {
  const analysis = analyzeJD(application.jdText);
  const allKeywords = unique([
    ...analysis.techKeywords,
    ...analysis.domainKeywords,
    ...analysis.capabilityKeywords,
    ...analysis.bonusKeywords,
  ]);
  const highlights = resume?.highlights ?? [];

  // focusAreas：简历亮点 × JD 关键词交叉，给出具体怎么讲
  const focusAreas = unique(
    allKeywords.slice(0, 8).flatMap((keyword) => {
      const highlight = findHighlightForKeyword(keyword, highlights);
      if (highlight) {
        return [`你有「${highlight}」经验 → 和 JD「${keyword}」匹配，准备讲方案细节、个人贡献和量化结果`];
      }
      return [`JD 重点考察「${keyword}」，你的简历未涉及 → 建议准备 1 个相关案例或补充到简历`];
    }),
  ).slice(0, 8);

  // projectStories：映射简历亮点到 JD 关键词
  const projectStories = highlights.length
    ? highlights.slice(0, 5).map((highlight) => {
        const matchedKeyword = allKeywords.find((k) =>
          highlight.toLowerCase().includes(k.toLowerCase()),
        );
        return matchedKeyword
          ? `把「${highlight}」整理成 STAR 案例讲给面试官（对应 JD「${matchedKeyword}」）`
          : `把「${highlight}」整理成 STAR 案例，说明背景、方案、贡献和结果`;
      })
    : ["补充 2 个和 JD 技术栈直接相关的项目案例"];

  // likelyQuestions：基于 JD 关键词 + 简历缺口推算
  const missingKeywords = allKeywords.filter(
    (k) => !highlights.some((h) => h.toLowerCase().includes(k.toLowerCase())),
  );
  const likelyQuestions = unique([
    ...allKeywords.slice(0, 5).map((keyword) => {
      const highlight = findHighlightForKeyword(keyword, highlights);
      return highlight
        ? `请结合「${highlight}」讲一下你在 ${keyword} 上的实践和量化成果？`
        : `你在 ${keyword} 方面有哪些经验和理解？`;
    }),
    ...missingKeywords.slice(0, 3).map((keyword) =>
      `JD 要求 ${keyword}，你觉得自己的短板在哪？打算怎么补？`,
    ),
    `为什么你适合 ${application.companyName} 的 ${application.jobTitle}？`,
  ]).slice(0, 10);

  // reviewChecklist：包含历史薄弱点交叉
  const historicalWeakPoints = interviews
    ? unique(interviews.flatMap((i) => i.weakPoints))
    : [];
  const weakPointOverlap = historicalWeakPoints.filter((wp) =>
    allKeywords.some((k) => wp.toLowerCase().includes(k.toLowerCase())),
  );
  const reviewChecklist = unique([
    "准备 1 分钟自我介绍，重点贴合岗位关键词",
    ...weakPointOverlap.map(
      (wp) => `⚠️ 上次面试薄弱点「${wp}」和本轮 JD 相关 → 一定要改进`,
    ),
    ...historicalWeakPoints
      .filter((wp) => !weakPointOverlap.includes(wp))
      .slice(0, 2)
      .map((wp) => `上次薄弱点「${wp}」→ 面试中注意回避或展示改进`),
    "准备项目背景、技术方案、个人贡献、结果指标",
    "准备一个失败或踩坑案例，说明复盘和改进",
    ...allKeywords.slice(0, 3).map((keyword) => `复习 ${keyword} 的核心概念和常见追问`),
  ]).slice(0, 10);

  return {
    focusAreas,
    likelyQuestions,
    projectStories,
    reviewChecklist,
    prompt: [
      "你是资深面试官和求职教练。请基于下面信息，帮我生成一份可执行的面试准备方案。",
      "",
      "输出格式：",
      "1. 岗位画像",
      "2. 面试高频问题，按技术栈/项目经历/工程化/业务理解分类",
      "3. 我应该重点讲的项目案例",
      "4. 每个问题的回答要点",
      "5. 面试前 24 小时复习清单",
      "",
      `公司：${application.companyName}`,
      `岗位：${application.jobTitle}`,
      `城市/薪资：${application.city || "未填写"} / ${application.salaryRange || "未填写"}`,
      "",
      `JD：\n${limitText(application.jdText, 3000)}`,
      "",
      `关联简历版本：${resume ? `${resume.name} / ${resume.targetRole}` : "未关联"}`,
      `简历核心卖点：\n${resume?.highlights.join("\n") || "未填写"}`,
      `简历正文：\n${limitText(resume?.content, 3000)}`,
      "",
      historicalWeakPoints.length
        ? `历史面试薄弱点：\n${lines("薄弱点", historicalWeakPoints.slice(0, 6))}\n`
        : "",
      "要求：回答要具体，不要泛泛而谈；围绕岗位关键词、项目经历、工程能力展开。",
    ].join("\n"),
  };
}

/**
 * 构建面试答案优化数据包
 * 基于已记录的面试问题和复盘，结合历史薄弱点和行动项生成具体建议。
 */
export function buildInterviewAnswerPack(input: {
  interview: InterviewRecord;
  application?: JobApplication;
  resume?: ResumeVersion;
}): InterviewAnswerPack {
  const { interview, application, resume } = input;
  const questions = interview.questions.map((question) => question.question);
  const weakPoints = interview.weakPoints.length
    ? interview.weakPoints
    : ["补充技术细节", "补充项目结果指标", "表达更结构化"];
  const highlights = resume?.highlights ?? [];

  // answerAngles：基于薄弱点 + 行动项生成具体建议
  const answerAngles = unique([
    ...weakPoints.map((point) => {
      const actionItem = interview.actionItems.find(
        (item) => item.toLowerCase().includes(point.toLowerCase()),
      );
      return actionItem
        ? `薄弱点「${point}」→ 已有行动项「${actionItem}」，面试中按行动项回答，展示改进成果`
        : `薄弱点「${point}」→ 用 STAR 结构补一个可验证案例，说明已改进`;
    }),
    ...highlights.slice(0, 2).map(
      (h) => `你的亮点「${h}」→ 回答中主动关联，用数据和细节支撑`,
    ),
  ]).slice(0, 8);

  const starTemplate = [
    "S: 项目背景、业务目标、约束条件",
    "T: 你负责的任务和技术难点",
    "A: 关键方案、取舍、排查过程、协作方式",
    "R: 结果指标、上线效果、复盘改进",
  ];

  // followUpQuestions：结合实际面试问题 + JD 关键词
  const jdKeywords = application?.jdText
    ? analyzeJD(application.jdText)
    : null;
  const followUpQuestions = unique([
    ...questions.slice(0, 5).map((question) => {
      const relatedKeyword = jdKeywords
        ? [...jdKeywords.techKeywords, ...jdKeywords.capabilityKeywords].find((k) =>
            question.toLowerCase().includes(k.toLowerCase()),
          )
        : undefined;
      return relatedKeyword
        ? `如果追问「${question}」的边界条件或性能影响，建议结合 JD「${relatedKeyword}」回答`
        : `如果追问「${question}」的细节，补充具体数据和决策过程`;
    }),
    ...interview.actionItems.slice(0, 3).map(
      (item) => `展示你的改进：「${item}」具体怎么做的，效果如何`,
    ),
  ]).slice(0, 8);

  return {
    answerAngles,
    starTemplate,
    followUpQuestions,
    prompt: [
      "你是资深面试官。请基于下面的面试问题和我的复盘，帮我输出更好的参考答案。",
      "",
      "输出格式：",
      "1. 每个问题的优秀回答版本",
      "2. STAR 结构拆解",
      "3. 面试官可能继续追问的问题",
      "4. 我的回答应避免的坑",
      "5. 下次复盘行动项",
      "",
      `岗位：${application ? `${application.companyName} / ${application.jobTitle}` : "未知岗位"}`,
      `JD：\n${limitText(application?.jdText, 2600)}`,
      "",
      `简历版本：${resume ? `${resume.name} / ${resume.targetRole}` : "未关联"}`,
      `简历卖点：\n${resume?.highlights.join("\n") || "未填写"}`,
      "",
      lines("面试问题", questions.length ? questions : ["未记录具体问题"]),
      "",
      lines("薄弱点", weakPoints),
      "",
      interview.actionItems.length
        ? lines("改进行动项", interview.actionItems)
        : "",
      `自我复盘：\n${limitText(interview.selfReview, 1600)}`,
      `面试总结：${interview.summary || "未填写"}`,
      "",
      "要求：答案要像真实候选人能说出口的版本；不要编造没有给出的项目经历；遇到信息不足时，请标注需要我补充的素材。",
    ].join("\n"),
  };
}
