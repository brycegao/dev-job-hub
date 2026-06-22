import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "../../../shared/storage/indexedDb";
import type { InterviewRecord } from "../types";

export async function listInterviews(): Promise<InterviewRecord[]> {
  const interviews = await getAllFromStore<InterviewRecord>("interviews");
  return interviews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveInterview(interview: InterviewRecord): Promise<void> {
  await putInStore("interviews", interview);
}

export async function removeInterview(id: string): Promise<void> {
  await deleteFromStore("interviews", id);
}

