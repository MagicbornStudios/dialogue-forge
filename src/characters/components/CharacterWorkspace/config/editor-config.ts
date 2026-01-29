/**
 * Editor configuration for Character Graph Editor
 */
export interface CharacterGraphEditorConfig {
  /**
   * Enable autosave functionality
   * @default true
   */
  autosaveEnabled: boolean;
  
  /**
   * Debounce delay in milliseconds before saving to database
   * @default 2000
   */
  autosaveDebounceMs: number;
}

/**
 * Default editor configuration
 */
export const DEFAULT_EDITOR_CONFIG: CharacterGraphEditorConfig = {
  autosaveEnabled: true,
  autosaveDebounceMs: 2000, // 2 seconds
};
