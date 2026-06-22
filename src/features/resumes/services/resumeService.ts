/**
 * 简历版本业务逻辑层，处理创建、更新和删除。
 */
import { createId } from "../../../shared/utils/common";
import {
  listResumes,
  removeResume,
  saveResume,
} from "../repositories/resumeRepository";
import type { ResumeVersion, ResumeVersionInput } from "../types";

/** 获取所有简历版本 */
export async function getResumes(): Promise<ResumeVersion[]> {
  return listResumes();
}

/** 创建一个新的简历版本 */
export async function createResume(input: ResumeVersionInput): Promise<ResumeVersion> {
  const now = new Date().toISOString();
  const resume: ResumeVersion = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  await saveResume(resume);
  return resume;
}

/** 更新一条已有的简历记录（自动刷新 updatedAt） */
export async function updateResume(resume: ResumeVersion): Promise<ResumeVersion> {
  const updated = {
    ...resume,
    updatedAt: new Date().toISOString(),
  };
  await saveResume(updated);
  return updated;
}

/** 删除一条简历记录 */
export async function deleteResume(id: string): Promise<void> {
  await removeResume(id);
}
