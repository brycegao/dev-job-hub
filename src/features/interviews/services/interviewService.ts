/**
 * 面试记录业务逻辑层，处理创建、更新和删除。
 */
import { createId } from "../../../shared/utils/common";
import {
  listInterviews,
  removeInterview,
  saveInterview,
} from "../repositories/interviewRepository";
import type { InterviewRecord, InterviewRecordInput } from "../types";

/** 获取所有面试记录 */
export async function getInterviews(): Promise<InterviewRecord[]> {
  return listInterviews();
}

/** 创建一条新的面试记录 */
export async function createInterview(
  input: InterviewRecordInput,
): Promise<InterviewRecord> {
  const now = new Date().toISOString();
  const interview: InterviewRecord = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  await saveInterview(interview);
  return interview;
}

/** 更新一条已有的面试记录（自动刷新 updatedAt） */
export async function updateInterview(
  interview: InterviewRecord,
): Promise<InterviewRecord> {
  const updated = {
    ...interview,
    updatedAt: new Date().toISOString(),
  };
  await saveInterview(updated);
  return updated;
}

/** 删除一条面试记录 */
export async function deleteInterview(id: string): Promise<void> {
  await removeInterview(id);
}
