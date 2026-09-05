/**
 * Fire a native OS notification when running inside the Electron desktop app.
 * Falls back to a no-op in the browser.
 */
export function useDesktopNotify() {
  return (title: string, body: string) => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.notify(title, body);
    }
  };
}
