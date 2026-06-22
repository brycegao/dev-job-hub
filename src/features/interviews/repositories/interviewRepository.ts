/**
 * 面试记录数据仓储层，封装 IndexedDB CRUD 操作。
 */
import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "../../../shared/storage/indexedDb";
import type { InterviewRecord } from "../types";

/** 获取所有面试记录，按 updatedAt 降序排列 */
export async function listInterviews(): Promise<InterviewRecord[]> {
  const interviews = await getAllFromStore<InterviewRecord>("interviews");
  return interviews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 保存（新增或更新）一条面试记录 */
export async function saveInterview(interview: InterviewRecord): Promise<void> {
  await putInStore("interviews", interview);
}

/** 删除一条面试记录 */
export async function removeInterview(id: string): Promise<void> {
  await deleteFromStore("interviews", id);
}
