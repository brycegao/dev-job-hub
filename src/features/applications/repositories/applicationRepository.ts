import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "../../../shared/storage/indexedDb";
import type { JobApplication } from "../types";

export async function listApplications(): Promise<JobApplication[]> {
  const applications = await getAllFromStore<JobApplication>("applications");
  return applications.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveApplication(application: JobApplication): Promise<void> {
  await putInStore("applications", application);
}

export async function removeApplication(id: string): Promise<void> {
  await deleteFromStore("applications", id);
}
