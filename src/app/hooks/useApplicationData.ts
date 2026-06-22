/**
 * 岗位投递数据管理 Hook。
 * 管理岗位列表状态、表单状态、筛选和 CRUD 操作。
 */
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
  onError,
}: {
  refresh: (nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) => Promise<void>;
  setPage: (page: Page) => void;
  deleteInterviewsByApplication: (applicationId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [input, setInput] = useState<JobApplicationInput>(defaultInput);
  const [isEditing, setIsEditing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  /** 显示新建岗位表单 */
  function showCreateForm() {
    setInput({ ...defaultInput, appliedAt: new Date().toISOString().slice(0, 10) });
    setIsEditing(false);
    setFormVisible(true);
    setPage("applications");
  }

  /** 隐藏表单并重置编辑状态 */
  function hideForm() {
    setFormVisible(false);
    setIsEditing(false);
  }

  /** 从 refresh 回调中同步岗位列表数据 */
  function setApplicationsFromRefresh(data: JobApplication[]) {
    setApplications(data);
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  }

  /** 按状态筛选岗位列表 */
  const filteredApplications = useMemo(() => {
    if (filterStatus === "all") {
      return applications;
    }
    return applications.filter((application) => application.status === filterStatus);
  }, [applications, filterStatus]);

  /** 提交新建或编辑的岗位表单 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.companyName.trim() || !input.jobTitle.trim()) {
      return;
    }

    try {
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
    } catch {
      onError("保存岗位失败，请重试。");
    }
  }

  /** 进入编辑模式，将岗位数据填充到表单 */
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

  /** 删除岗位及其关联的面试记录 */
  async function handleDelete(application: JobApplication) {
    try {
      await deleteInterviewsByApplication(application.id);
      await deleteApplication(application.id);
      setSelectedId(null);
      await refresh();
    } catch {
      onError("删除岗位失败，请重试。");
    }
  }

  /** 快速变更岗位投递状态 */
  async function handleStatusChange(application: JobApplication, status: JobStatus) {
    try {
      const updated = await updateApplicationStatus(application, status);
      setSelectedId(updated.id);
      await refresh();
    } catch {
      onError("更新状态失败，请重试。");
    }
  }

  /** 关联或取消关联简历版本 */
  async function handleApplicationResumeLink(
    application: JobApplication,
    resumeVersionId: string,
  ) {
    try {
      const updated = await updateApplication({
        ...application,
        resumeVersionId: resumeVersionId || undefined,
      });
      setSelectedId(updated.id);
      await refresh();
    } catch {
      onError("关联简历失败，请重试。");
    }
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
