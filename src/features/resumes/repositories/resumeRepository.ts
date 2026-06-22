/**
 * 简历版本数据仓储层，封装 IndexedDB CRUD 操作。
 */
import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "../../../shared/storage/indexedDb";
import type { ResumeVersion } from "../types";

/** 获取所有简历版本，按 updatedAt 降序排列 */
export async function listResumes(): Promise<ResumeVersion[]> {
  const resumes = await getAllFromStore<ResumeVersion>("resumes");
  return resumes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 保存（新增或更新）一条简历记录 */
export async function saveResume(resume: ResumeVersion): Promise<void> {
  await putInStore("resumes", resume);
}

/** 删除一条简历记录 */
export async function removeResume(id: string): Promise<void> {
  await deleteFromStore("resumes", id);
}
