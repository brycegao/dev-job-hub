/**
 * 岗位投递数据仓储层，封装 IndexedDB CRUD 操作。
 */
import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "../../../shared/storage/indexedDb";
import type { JobApplication } from "../types";

/** 获取所有岗位记录，按 updatedAt 降序排列 */
export async function listApplications(): Promise<JobApplication[]> {
  const applications = await getAllFromStore<JobApplication>("applications");
  return applications.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 保存（新增或更新）一条岗位记录 */
export async function saveApplication(application: JobApplication): Promise<void> {
  await putInStore("applications", application);
}

/** 删除一条岗位记录 */
export async function removeApplication(id: string): Promise<void> {
  await deleteFromStore("applications", id);
}
