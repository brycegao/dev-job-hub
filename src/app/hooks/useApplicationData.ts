import { useState, useMemo, type FormEvent } from "react";
import {
  createApplication,
  deleteApplication,
  updateApplication,
  updateApplicationStatus,
} from "../../features/applications/services/applicationService";
import type {
  JobApplication,
  JobApplicationInput,
  JobStatus,
} from "../../features/applications/types";
import { defaultInput, type Page } from "../constants";

export function useApplicationData({
  refresh,
  setPage,
  deleteInterviewsByApplication,
}: {
  refresh: (nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) => Promise<void>;
  setPage: (page: Page) => void;
  deleteInterviewsByApplication: (applicationId: string) => Promise<void>;
}) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [input, setInput] = useState<JobApplicationInput>(defaultInput);
  const [isEditing, setIsEditing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  function showCreateForm() {
    setInput({ ...defaultInput, appliedAt: new Date().toISOString().slice(0, 10) });
    setIsEditing(false);
    setFormVisible(true);
    setPage("applications");
  }

  function hideForm() {
    setFormVisible(false);
    setIsEditing(false);
  }

  function setApplicationsFromRefresh(data: JobApplication[]) {
    setApplications(data);
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  }

  const filteredApplications = useMemo(() => {
    if (filterStatus === "all") {
      return applications;
    }
    return applications.filter((application) => application.status === filterStatus);
  }, [applications, filterStatus]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.companyName.trim() || !input.jobTitle.trim()) {
      return;
    }

    const selectedApplication = applications.find((a) => a.id === selectedId);

    if (isEditing && selectedApplication) {
      const updated = await updateApplication({
        ...selectedApplication,
        ...input,
      });
      setSelectedId(updated.id);
    } else {
      const created = await createApplication(input);
      setSelectedId(created.id);
    }

    setInput(defaultInput);
    hideForm();
    await refresh();
  }

  function startEdit(application: JobApplication) {
    setSelectedId(application.id);
    setInput({
      companyName: application.companyName,
      jobTitle: application.jobTitle,
      channel: application.channel,
      city: application.city,
      remoteType: application.remoteType,
      salaryRange: application.salaryRange,
      jobUrl: application.jobUrl,
      jdText: application.jdText,
      status: application.status,
      appliedAt: application.appliedAt,
      nextFollowUpAt: application.nextFollowUpAt,
      resumeVersionId: application.resumeVersionId,
      notes: application.notes,
    });
    setIsEditing(true);
    setFormVisible(true);
    setPage("applications");
  }

  async function handleDelete(application: JobApplication) {
    await deleteInterviewsByApplication(application.id);
    await deleteApplication(application.id);
    setSelectedId(null);
    await refresh();
  }

  async function handleStatusChange(application: JobApplication, status: JobStatus) {
    const updated = await updateApplicationStatus(application, status);
    setSelectedId(updated.id);
    await refresh();
  }

  async function handleApplicationResumeLink(
    application: JobApplication,
    resumeVersionId: string,
  ) {
    const updated = await updateApplication({
      ...application,
      resumeVersionId: resumeVersionId || undefined,
    });
    setSelectedId(updated.id);
    await refresh();
  }

  return {
    applications,
    selectedId,
    setSelectedId,
    filterStatus,
    setFilterStatus,
    input,
    setInput,
    isEditing,
    formVisible,
    showCreateForm,
    hideForm,
    filteredApplications,
    setApplicationsFromRefresh,
    handleSubmit,
    startEdit,
    handleDelete,
    handleStatusChange,
    handleApplicationResumeLink,
  };
}
