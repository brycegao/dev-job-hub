/**
 * 面试记录数据管理 Hook。
 * 管理面试列表状态和 CRUD 操作。
 */
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
  onError,
}: {
  refresh: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);

  /** 从 refresh 回调中同步面试列表数据 */
  function setInterviewsFromRefresh(data: InterviewRecord[]) {
    setInterviews(data);
  }

  /** 删除指定岗位关联的所有面试记录 */
  async function deleteInterviewsByApplication(applicationId: string) {
    const records = await getInterviews();
    const toDelete = records.filter((r) => r.jobApplicationId === applicationId);
    await Promise.all(toDelete.map((r) => deleteInterview(r.id)));
  }

  /** 创建一条新的面试记录 */
  async function handleInterviewCreate(input: InterviewRecordInput) {
    try {
      await createInterview(input);
      await refresh();
    } catch {
      onError("保存面试记录失败，请重试。");
    }
  }

  /** 删除一条面试记录 */
  async function handleInterviewDelete(interview: InterviewRecord) {
    try {
      await deleteInterview(interview.id);
      await refresh();
    } catch {
      onError("删除面试记录失败，请重试。");
    }
  }

  /** 更新一条面试记录 */
  async function handleInterviewUpdate(interview: InterviewRecord) {
    try {
      await updateInterview(interview);
      await refresh();
    } catch {
      onError("更新面试记录失败，请重试。");
    }
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
