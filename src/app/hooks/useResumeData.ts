/**
 * 简历版本数据管理 Hook。
 * 管理简历列表状态、表单状态和 CRUD 操作。
 */
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
  onError,
}: {
  refresh: (nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) => Promise<void>;
  setPage: (page: Page) => void;
  onError: (message: string) => void;
}) {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [resumeInput, setResumeInput] = useState<ResumeVersionInput>(defaultResumeInput);
  const [isEditingResume, setIsEditingResume] = useState(false);

  /** 从 refresh 回调中同步简历列表数据 */
  function setResumesFromRefresh(data: ResumeVersion[]) {
    setResumes(data);
    if (!selectedResumeId && data.length > 0) {
      setSelectedResumeId(data[0].id);
    }
  }

  /** 提交新建或编辑的简历表单 */
  async function handleResumeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeInput.name.trim() || !resumeInput.targetRole.trim()) {
      return;
    }

    try {
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
    } catch {
      onError("保存简历失败，请重试。");
    }
  }

  /** 进入编辑模式，将简历数据填充到表单 */
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

  /** 删除简历版本 */
  async function handleResumeDelete(resume: ResumeVersion) {
    try {
      await deleteResume(resume.id);
      setSelectedResumeId(null);
      await refresh();
    } catch {
      onError("删除简历失败，请重试。");
    }
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
