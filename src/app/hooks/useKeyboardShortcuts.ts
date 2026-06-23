/**
 * 全局键盘快捷键 hook。
 * N: 新增岗位 | 1-7: 切换页面 | ?: 帮助 | Escape: 关闭表单
 */
import { useCallback, useEffect } from "react";
import type { Page } from "../constants";
import { navItems } from "../constants";

export function useKeyboardShortcuts(options: {
  page: Page;
  setPage: (page: Page) => void;
  showCreateForm: () => void;
  cancelEdit: () => void;
  cancelResumeEdit: () => void;
}): void {
  const { page, setPage, showCreateForm, cancelEdit, cancelResumeEdit } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    // Escape 始终生效（包括在输入框中）
    if (e.key === "Escape") {
      cancelEdit();
      cancelResumeEdit();
      return;
    }

    // 其他快捷键仅在非输入焦点时生效
    if (isEditable) return;

    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      showCreateForm();
      return;
    }

    if (e.key === "?") {
      e.preventDefault();
      setPage("help");
      return;
    }

    // 数字键 1-7 切换页面
    const digit = parseInt(e.key, 10);
    if (digit >= 1 && digit <= navItems.length) {
      e.preventDefault();
      setPage(navItems[digit - 1].key);
    }
  }, [page, setPage, showCreateForm, cancelEdit, cancelResumeEdit]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
