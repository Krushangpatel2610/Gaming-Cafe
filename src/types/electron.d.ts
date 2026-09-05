// Injected by the Electron preload script when the app runs as a desktop app.
interface Window {
  __DESKTOP_APP__?: true;
  electronAPI?: {
    notify: (title: string, body: string) => void;
    getAutoStart: () => Promise<boolean>;
    setAutoStart: (enabled: boolean) => Promise<boolean>;
  };
}
