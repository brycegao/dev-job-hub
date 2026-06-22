# Agents Guide

## 1. Project Context

Build a local-first web MVP for a developer-focused job hunting CRM.

Product name:

```text
Developer Job Hunt CRM
程序员求职作战台
```

Core positioning:

```text
帮助中国程序员记录投递、管理 JD、关联简历版本、沉淀面试复盘，并用数据复盘求职效率。
```

The product is not a generic CRM. It focuses on technical job seekers, especially developers applying through BOSS, Maimai, referrals, recruiters, and job boards.

## 2. Target Users

Primary users:

- Chinese software developers actively job hunting
- Android / Flutter / frontend / backend / AI application developers
- Candidates managing many applications across different channels
- Candidates who need to track JD details, resume versions, interview questions, and follow-ups

Do not assume enterprise recruiters, HR teams, or multi-user hiring workflows in Phase 1.

## 3. Core Pain Points

Solve these first:

- Applications are scattered across platforms and chats
- JD text disappears or is hard to find later
- Resume versions are hard to connect with outcomes
- Interview questions and weak points are not systematically reviewed
- Job seekers feel anxious but lack funnel data
- Users cannot tell which channel, role type, or resume version performs better

## 4. MVP Scope

Phase 1 must include:

- Job application management
- JD text storage
- Status tracking
- Resume version management
- JD keyword analysis with local rules
- Resume-to-JD matching suggestions
- Interview records and review notes
- Basic analytics
- JSON import and export

Recommended status flow:

```text
evaluating -> applied -> contacted -> interviewing -> offer
                         -> rejected / no_response / not_fit
```

## 5. Non-Goals

Do not implement in Phase 1:

- User login
- Cloud sync
- Backend service
- Multi-user collaboration
- Automatic mass application
- Recruitment website scraping
- Browser extension
- Payment system
- Mobile app
- Enterprise ATS features

## 6. Technical Architecture

Phase 1 architecture:

```text
React + TypeScript + Vite
IndexedDB local storage
Rule-based analysis first
AI Provider abstraction reserved
No backend
No login
No cloud sync
```

Recommended libraries:

```text
Build: Vite
Framework: React
Language: TypeScript
Storage: IndexedDB
Storage wrapper: Dexie
State: Zustand or React Context
Charts: Recharts
Style: CSS Modules or plain CSS
AI: OpenAI-compatible API / Ollama, optional
```

Use IndexedDB instead of localStorage for real implementation, because JD text, resume content, and interview notes can become large.

## 7. Suggested Source Structure

```text
src/
  app/
    App.tsx
    routes.tsx
    layout/

  pages/
    dashboard/
    applications/
    resumes/
    interviews/
    analytics/
    settings/

  features/
    applications/
      components/
      repositories/
      services/
      types.ts
    resumes/
      components/
      repositories/
      services/
      types.ts
    jd-analysis/
      services/
      keyword-rules.ts
      types.ts
    interviews/
      components/
      repositories/
      services/
      types.ts
    analytics/
      services/
      types.ts
    ai/
      providers/
      prompts/
      types.ts

  shared/
    components/
    hooks/
    storage/
    utils/
    constants/

  data/
    seed.ts
```

## 8. Core Domain Models

Use the detailed data model in `data-model.md`.

Core entities:

- `JobApplication`
- `ResumeVersion`
- `JDAnalysis`
- `ResumeMatch`
- `InterviewRecord`
- `WeeklyReview`

Keep model names stable unless there is a strong reason to change them.

## 9. AI Design Boundary

AI must be optional.

The app must work without API keys.

Use a provider interface:

```ts
interface AIProvider {
  analyzeJD(input: AnalyzeJDInput): Promise<AnalyzeJDResult>;
  matchResume(input: MatchResumeInput): Promise<MatchResumeResult>;
  generateInterviewPrep(input: InterviewPrepInput): Promise<InterviewPrepResult>;
}
```

Required providers over time:

- `RuleBasedProvider`
- `OpenAICompatibleProvider`
- `OllamaProvider`

Phase 1 can implement only `RuleBasedProvider`.

## 10. UX Principles

Build for repeated daily use during job hunting.

Follow these principles:

- Keep screens dense but readable
- Make status and follow-up dates visible
- Avoid decorative landing pages
- Prioritize forms, tables, filters, and analytics
- Keep AI suggestions editable and non-authoritative
- Make import/export easy to find
- Treat user data as private by default

## 11. Development Order

Follow `development-slices.md`.

Recommended order:

1. Build local data storage and job application CRUD
2. Build dashboard and basic statistics
3. Build JD keyword analysis
4. Build resume version management and matching suggestions
5. Build interview records
6. Add AI provider abstraction
7. Add import/export, sample data, README, and screenshots

## 12. Acceptance Criteria

Phase 1 is acceptable when:

- The app runs in the browser
- Data persists after refresh
- Users can create, edit, delete, and filter job applications
- Users can store JD text
- Users can manage resume versions
- Users can add interview records
- Users can see basic funnel metrics
- Users can export and import JSON data
- The app remains usable without AI configuration

## 13. Agent Instructions

When contributing to this project:

1. Follow the local-first Phase 1 boundary.
2. Do not introduce a backend unless explicitly requested.
3. Do not add login, cloud sync, scraping, or browser extension code in Phase 1.
4. Prefer small vertical slices over broad abstractions.
5. Keep implementation aligned with `mvp-requirements.md`, `architecture.md`, `data-model.md`, `screens.md`, and `development-slices.md`.
6. Use TypeScript types for domain models.
7. Keep AI features optional and behind a provider abstraction.
8. Keep user-facing copy focused on job hunting workflows, not generic CRM language.
9. Before adding new scope, check whether it helps the core loop:

```text
record job -> analyze JD -> connect resume -> track interview -> review data
```

