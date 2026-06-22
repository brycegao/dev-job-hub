import { createId } from "../../../shared/utils/common";
import {
  listInterviews,
  removeInterview,
  saveInterview,
} from "../repositories/interviewRepository";
import type { InterviewRecord, InterviewRecordInput } from "../types";

export async function getInterviews(): Promise<InterviewRecord[]> {
  return listInterviews();
}

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

export async function deleteInterview(id: string): Promise<void> {
  await removeInterview(id);
}

