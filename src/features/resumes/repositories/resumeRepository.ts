import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "../../../shared/storage/indexedDb";
import type { ResumeVersion } from "../types";

export async function listResumes(): Promise<ResumeVersion[]> {
  const resumes = await getAllFromStore<ResumeVersion>("resumes");
  return resumes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveResume(resume: ResumeVersion): Promise<void> {
  await putInStore("resumes", resume);
}

export async function removeResume(id: string): Promise<void> {
  await deleteFromStore("resumes", id);
}

