import {
  listApplications,
  removeApplication,
  saveApplication,
} from "../repositories/applicationRepository";
import type { JobApplication, JobApplicationInput, JobStatus } from "../types";
import { createId } from "../../../shared/utils/common";

export async function getApplications(): Promise<JobApplication[]> {
  return listApplications();
}

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

export async function updateApplicationStatus(
  application: JobApplication,
  status: JobStatus,
): Promise<JobApplication> {
  return updateApplication({ ...application, status });
}

export async function deleteApplication(id: string): Promise<void> {
  await removeApplication(id);
}
