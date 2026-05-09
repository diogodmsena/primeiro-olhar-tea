export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
          renderButton: (parent: HTMLElement | null, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}
