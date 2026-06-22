import { useState } from "react";
import {
  createInterview,
  deleteInterview,
  getInterviews,
  updateInterview,
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

  async function deleteInterviewsByApplication(applicationId: string) {
    const records = await getInterviews();
    const toDelete = records.filter((r) => r.jobApplicationId === applicationId);
    await Promise.all(toDelete.map((r) => deleteInterview(r.id)));
  }

  async function handleInterviewCreate(input: InterviewRecordInput) {
    await createInterview(input);
    await refresh();
  }

  async function handleInterviewDelete(interview: InterviewRecord) {
    await deleteInterview(interview.id);
    await refresh();
  }

  async function handleInterviewUpdate(interview: InterviewRecord) {
    await updateInterview(interview);
    await refresh();
  }

  return {
    interviews,
    setInterviewsFromRefresh,
    deleteInterviewsByApplication,
    handleInterviewCreate,
    handleInterviewDelete,
    handleInterviewUpdate,
  };
}
