import React from 'react';
import { DialogueTree } from '../types';
import { exportToYarn } from '../lib/yarn-converter';

interface YarnViewProps {
  dialogue: DialogueTree;
  onExport: () => void;
  onImport?: (yarn: string) => void;
}

export function YarnView({ dialogue, onExport, onImport }: YarnViewProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (onImport) {
        onImport(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  return (
    <main className="flex-1 flex flex-col bg-[#0d0d14] overflow-hidden">
      <div className="border-b border-[#1a1a2e] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-400">Yarn Spinner Output</span>
        <div className="flex items-center gap-2">
          {onImport && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-gray-300 text-sm rounded flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import .yarn
              </button>
              <input ref={fileInputRef} type="file" accept=".yarn" onChange={handleImport} className="hidden" />
            </>
          )}
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-[#e94560] hover:bg-[#d63850] text-white text-sm rounded flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download .yarn
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap bg-[#08080c] rounded-lg p-4 border border-[#1a1a2e]">
          {exportToYarn(dialogue)}
        </pre>
      </div>
    </main>
  );
}

