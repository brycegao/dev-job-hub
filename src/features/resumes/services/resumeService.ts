import { createId } from "../../../shared/utils/common";
import {
  listResumes,
  removeResume,
  saveResume,
} from "../repositories/resumeRepository";
import type { ResumeVersion, ResumeVersionInput } from "../types";

export async function getResumes(): Promise<ResumeVersion[]> {
  return listResumes();
}

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

export async function updateResume(resume: ResumeVersion): Promise<ResumeVersion> {
  const updated = {
    ...resume,
    updatedAt: new Date().toISOString(),
  };
  await saveResume(updated);
  return updated;
}

export async function deleteResume(id: string): Promise<void> {
  await removeResume(id);
}

