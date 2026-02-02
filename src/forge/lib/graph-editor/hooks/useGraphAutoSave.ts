// src/forge/lib/graph-editor/hooks/useGraphAutoSave.ts
import * as React from 'react';

type UseGraphAutoSaveArgs<T> = {
  onSave: (next: T) => void;
  debounceMs?: number;
  immediateIndicatorMs?: number;
};

type UseGraphAutoSaveResult<T> = {
  isSaving: boolean;
  onSaveDebounced: (next: T) => void;
  onSaveImmediate: (next: T) => void;
};

export function useGraphAutoSave<T>({
  onSave,
  debounceMs = 2000,
  immediateIndicatorMs = 500,
}: UseGraphAutoSaveArgs<T>): UseGraphAutoSaveResult<T> {
  const [isSaving, setIsSaving] = React.useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const indicatorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearPending = React.useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (indicatorTimeoutRef.current) {
      clearTimeout(indicatorTimeoutRef.current);
      indicatorTimeoutRef.current = null;
    }
  }, []);

  const onSaveDebounced = React.useCallback(
    (next: T) => {
      clearPending();
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        onSave(next);
        setIsSaving(false);
        saveTimeoutRef.current = null;
      }, debounceMs);
    },
    [clearPending, debounceMs, onSave]
  );

  const onSaveImmediate = React.useCallback(
    (next: T) => {
      clearPending();
      setIsSaving(true);
      onSave(next);
      indicatorTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
        indicatorTimeoutRef.current = null;
      }, immediateIndicatorMs);
    },
    [clearPending, immediateIndicatorMs, onSave]
  );

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    onSaveDebounced,
    onSaveImmediate,
  };
}
