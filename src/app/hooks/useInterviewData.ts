import { useState } from "react";
import {
  createInterview,
  deleteInterview,
} from "../../features/interviews/services/interviewService";
import type { InterviewRecord, InterviewRecordInput } from "../../features/interviews/types";

export function useInterviewData({
  refresh,
}: {
  refresh: () => Promise<void>;
}) {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);

  function setInterviewsFromRefresh(data: InterviewRecord[]) {
    setInterviews(data);
  }

  async function handleInterviewCreate(input: InterviewRecordInput) {
    await createInterview(input);
    await refresh();
  }

  async function handleInterviewDelete(interview: InterviewRecord) {
    await deleteInterview(interview.id);
    await refresh();
  }

  return {
    interviews,
    setInterviewsFromRefresh,
    handleInterviewCreate,
    handleInterviewDelete,
  };
}
