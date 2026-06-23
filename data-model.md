# 数据模型

## 1. JobApplication

岗位投递记录。

```ts
type JobStatus =
  | "evaluating"
  | "applied"
  | "contacted"
  | "interviewing"
  | "offer"
  | "rejected"
  | "no_response"
  | "not_fit";

type JobApplication = {
  id: string;
  companyName: string;
  jobTitle: string;
  channel: string;
  city?: string;
  remoteType?: "onsite" | "hybrid" | "remote";
  salaryRange?: string;
  jobUrl?: string;
  jdText: string;
  status: JobStatus;
  appliedAt?: string;
  nextFollowUpAt?: string;
  resumeVersionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 2. ResumeVersion

简历版本。

```ts
type ResumeVersion = {
  id: string;
  name: string;
  targetRole: string;
  content: string;
  filePath?: string;
  highlights: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 3. JDAnalysis

JD 分析结果。

```ts
type JDAnalysis = {
  id: string;
  jobApplicationId: string;
  techKeywords: string[];
  domainKeywords: string[];
  capabilityKeywords: string[];
  bonusKeywords: string[];
  risks: string[];
  summary: string;
  createdAt: string;
};
```

## 4. ResumeMatch

JD 与简历匹配结果。

```ts
type ResumeMatch = {
  id: string;
  jobApplicationId: string;
  resumeVersionId: string;
  matchedPoints: string[];
  missingPoints: string[];
  suggestedProjects: string[];
  suggestedKeywords: string[];
  greetingMessage: string;
  interviewPrep: string[];
  createdAt: string;
};
```

## 5. InterviewRecord

面试记录。

```ts
type InterviewRound =
  | "first"
  | "second"
  | "third"
  | "hr"
  | "final"
  | "other";

type InterviewInviteStatus =
  | "not_scheduled"
  | "invited"
  | "confirmed"
  | "completed"
  | "cancelled";

type InterviewRecord = {
  id: string;
  jobApplicationId: string;
  round: InterviewRound;
  inviteStatus?: InterviewInviteStatus;
  invitedAt?: string;
  scheduledAt?: string;
  location?: string;
  confirmedAt?: string;
  interviewerType?: string;
  nextRound?: InterviewRound;
  nextScheduledAt?: string;
  nextLocation?: string;
  inviteNotes?: string;
  questions: InterviewQuestion[];
  selfReview?: string;
  weakPoints: string[];
  result?: "pending" | "passed" | "failed" | "unknown";
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

type InterviewQuestion = {
  id: string;
  question: string;
  answerNotes?: string;
  tags: string[];
};
```

## 6. WeeklyReview

周复盘。

```ts
type WeeklyReview = {
  id: string;
  weekStart: string;
  weekEnd: string;
  applicationsCount: number;
  repliesCount: number;
  interviewsCount: number;
  offersCount: number;
  effectiveChannels: string[];
  problems: string[];
  nextWeekActions: string[];
  createdAt: string;
};
```
