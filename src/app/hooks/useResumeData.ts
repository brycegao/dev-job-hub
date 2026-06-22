import { useState, type FormEvent } from "react";
import {
  createResume,
  deleteResume,
  updateResume,
} from "../../features/resumes/services/resumeService";
import type { ResumeVersion, ResumeVersionInput } from "../../features/resumes/types";
import { defaultResumeInput, type Page } from "../constants";

export function useResumeData({
  refresh,
  setPage,
}: {
  refresh: (nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) => Promise<void>;
  setPage: (page: Page) => void;
}) {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [resumeInput, setResumeInput] = useState<ResumeVersionInput>(defaultResumeInput);
  const [isEditingResume, setIsEditingResume] = useState(false);

  function setResumesFromRefresh(data: ResumeVersion[]) {
    setResumes(data);
    if (!selectedResumeId && data.length > 0) {
      setSelectedResumeId(data[0].id);
    }
  }

  async function handleResumeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeInput.name.trim() || !resumeInput.targetRole.trim()) {
      return;
    }

    const selectedResume = resumes.find((r) => r.id === selectedResumeId);

    if (isEditingResume && selectedResume) {
      const updated = await updateResume({
        ...selectedResume,
        ...resumeInput,
      });
      setSelectedResumeId(updated.id);
    } else {
      const created = await createResume(resumeInput);
      setSelectedResumeId(created.id);
    }

    setResumeInput(defaultResumeInput);
    setIsEditingResume(false);
    await refresh();
  }

  function startResumeEdit(resume: ResumeVersion) {
    setSelectedResumeId(resume.id);
    setResumeInput({
      name: resume.name,
      targetRole: resume.targetRole,
      content: resume.content,
      filePath: resume.filePath,
      highlights: resume.highlights,
    });
    setIsEditingResume(true);
    setPage("resumes");
  }

  async function handleResumeDelete(resume: ResumeVersion) {
    await deleteResume(resume.id);
    setSelectedResumeId(null);
    await refresh();
  }

  return {
    resumes,
    selectedResumeId,
    setSelectedResumeId,
    resumeInput,
    setResumeInput,
    isEditingResume,
    setIsEditingResume,
    setResumesFromRefresh,
    handleResumeSubmit,
    startResumeEdit,
    handleResumeDelete,
  };
}
