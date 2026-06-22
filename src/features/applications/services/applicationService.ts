/**
 * 岗位投递业务逻辑层，处理创建、更新、删除和状态变更。
 */
import {
  listApplications,
  removeApplication,
  saveApplication,
} from "../repositories/applicationRepository";
import type { JobApplication, JobApplicationInput, JobStatus } from "../types";
import { createId } from "../../../shared/utils/common";

/** 获取所有岗位记录 */
export async function getApplications(): Promise<JobApplication[]> {
  return listApplications();
}

/** 创建一条新的岗位投递记录 */
export async function createApplication(input: JobApplicationInput): Promise<JobApplication> {
  const now = new Date().toISOString();
  const application: JobApplication = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  await saveApplication(application);
  return application;
}

/** 更新一条已有的岗位记录（自动刷新 updatedAt） */
export async function updateApplication(
  application: JobApplication,
): Promise<JobApplication> {
  const updated = {
    ...application,
    updatedAt: new Date().toISOString(),
  };
  await saveApplication(updated);
  return updated;
}

/** 仅更新岗位的投递状态 */
export async function updateApplicationStatus(
  application: JobApplication,
  status: JobStatus,
): Promise<JobApplication> {
  return updateApplication({ ...application, status });
}

/** 删除一条岗位记录 */
export async function deleteApplication(id: string): Promise<void> {
  await removeApplication(id);
}
