import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import { analyzeJD } from "../../jd-analysis/services/jdAnalysisService";
import type { ResumeVersion } from "../../resumes/types";
import type { InterviewAnswerPack, InterviewPrepPack } from "../types";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function limitText(text: string | undefined, maxLength: number): string {
  if (!text) {
    return "未填写";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function lines(title: string, values: string[]): string {
  return [`## ${title}`, ...values.map((value) => `- ${value}`)].join("\n");
}

export function buildInterviewPrepPack(
  application: JobApplication,
  resume?: ResumeVersion,
): InterviewPrepPack {
  const analysis = analyzeJD(application.jdText);
  const allKeywords = unique([
    ...analysis.techKeywords,
    ...analysis.domainKeywords,
    ...analysis.capabilityKeywords,
    ...analysis.bonusKeywords,
  ]);
  const focusAreas = unique([
    ...analysis.techKeywords.slice(0, 5).map((keyword) => `复盘 ${keyword} 的项目实践、踩坑和量化结果`),
    ...analysis.capabilityKeywords.slice(0, 4).map((keyword) => `准备 ${keyword} 的具体案例`),
    ...analysis.risks.slice(0, 3).map((risk) => `提前解释或规避「${risk}」相关风险`),
  ]).slice(0, 8);
  const likelyQuestions = unique([
    ...allKeywords.slice(0, 8).map((keyword) => `请结合项目讲一下你在 ${keyword} 上的实践？`),
    `为什么你适合 ${application.companyName} 的 ${application.jobTitle}？`,
    "如果让你入职后负责这个方向，前两周你会如何推进？",
  ]).slice(0, 10);
  const projectStories = resume?.highlights.length
    ? resume.highlights.slice(0, 4).map((highlight) => `把「${highlight}」整理成 STAR 案例`)
    : ["补充 2 个和 JD 技术栈直接相关的项目案例", "准备一个线上问题排查或性能优化案例"];
  const reviewChecklist = unique([
    "准备 1 分钟自我介绍，重点贴合岗位关键词",
    "准备项目背景、技术方案、个人贡献、结果指标",
    "准备一个失败或踩坑案例，说明复盘和改进",
    ...allKeywords.slice(0, 5).map((keyword) => `复习 ${keyword} 的核心概念和常见追问`),
  ]).slice(0, 10);

  return {
    focusAreas,
    likelyQuestions,
    projectStories,
    reviewChecklist,
    prompt: [
      "你是资深移动端面试官和求职教练。请基于下面信息，帮我生成一份可执行的面试准备方案。",
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
      "要求：回答要具体，不要泛泛而谈；优先围绕移动端工程化、App 上线交付、业务稳定性和岗位关键词展开。",
    ].join("\n"),
  };
}

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
  const answerAngles = unique([
    "先给结论，再讲项目背景、技术方案、个人贡献和结果",
    "把回答落到移动端真实工程问题，不只讲概念",
    ...weakPoints.map((point) => `针对薄弱点「${point}」补一个可验证案例`),
  ]).slice(0, 8);
  const starTemplate = [
    "S: 项目背景、业务目标、约束条件",
    "T: 你负责的任务和技术难点",
    "A: 关键方案、取舍、排查过程、协作方式",
    "R: 结果指标、上线效果、复盘改进",
  ];
  const followUpQuestions = unique([
    ...questions.slice(0, 6).map((question) => `如果面试官追问「${question}」的边界条件，该怎么答？`),
    "这个方案有什么缺点？你会如何优化？",
    "如果流量、机型、网络环境变差，方案是否还能稳定？",
  ]).slice(0, 8);

  return {
    answerAngles,
    starTemplate,
    followUpQuestions,
    prompt: [
      "你是资深移动端面试官。请基于下面的面试问题和我的复盘，帮我输出更好的参考答案。",
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
      `自我复盘：\n${limitText(interview.selfReview, 1600)}`,
      `面试总结：${interview.summary || "未填写"}`,
      "",
      "要求：答案要像真实候选人能说出口的版本；不要编造没有给出的项目经历；遇到信息不足时，请标注需要我补充的素材。",
    ].join("\n"),
  };
}
