/**
 * PWA 安装提示组件。
 * 监听 beforeinstallprompt 事件，在用户可安装时显示底部横幅。
 */
import { useCallback, useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("pwa-dismissed") === "true");
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({ immediate: true });

  /** 监听浏览器安装事件 */
  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  /** 安装完成后重置状态 */
  useEffect(() => {
    function handleAppInstalled() {
      setShowInstall(false);
      setDeferredPrompt(null);
    }
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstall(false);
    sessionStorage.setItem("pwa-dismissed", "true");
    setDismissed(true);
  }, []);

  // 离线就绪提示
  const handleOfflineDismiss = useCallback(() => setOfflineReady(false), [setOfflineReady]);

  if (dismissed && !needRefresh && !offlineReady) return null;

  return (
    <>
      {showInstall && !dismissed && (
        <div className="install-banner">
          <span>💾 安装到桌面，数据不离开浏览器</span>
          <div className="install-banner-actions">
            <button className="primary" onClick={handleInstall}>安装</button>
            <button className="secondary-action" onClick={handleDismiss}>忽略</button>
          </div>
        </div>
      )}
      {needRefresh && (
        <div className="install-banner">
          <span>🔄 有新版本可用</span>
          <div className="install-banner-actions">
            <button className="primary" onClick={() => updateServiceWorker(true)}>更新</button>
          </div>
        </div>
      )}
      {offlineReady && (
        <div className="install-banner">
          <span>✅ 应用已可离线使用</span>
          <div className="install-banner-actions">
            <button className="secondary-action" onClick={handleOfflineDismiss}>知道了</button>
          </div>
        </div>
      )}
    </>
  );
}

/** beforeinstallprompt 事件的类型声明（非标准 API，需要手动声明） */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
