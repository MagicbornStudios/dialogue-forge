/**
 * Creates a storage object for react-resizable-panels following their persistent layout pattern
 * Reference: https://react-resizable-panels.vercel.app/examples/persistent-layout
 */
export function createPanelStorage() {
  return {
    getItem: (name: string) => {
      try {
        const value = localStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Ignore localStorage errors
      }
    },
  };
}
