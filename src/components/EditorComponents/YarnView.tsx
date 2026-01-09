import React, { useState, useEffect } from 'react';
import { DialogueTree } from '../../types';
import { exportToYarn, importFromYarn } from '../../lib/yarn-converter';

interface YarnViewProps {
  dialogue: DialogueTree;
  onExport: () => void;
  onImport?: (yarn: string) => void;
  onChange?: (dialogue: DialogueTree) => void;
}

export function YarnView({ dialogue, onExport, onImport, onChange }: YarnViewProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [yarnText, setYarnText] = useState(exportToYarn(dialogue));
  const [isEditing, setIsEditing] = useState(false);
  
  // Update yarn text when dialogue changes externally
  useEffect(() => {
    if (!isEditing) {
      setYarnText(exportToYarn(dialogue));
    }
  }, [dialogue, isEditing]);
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setYarnText(content);
      if (onImport) {
        onImport(content);
      }
      if (onChange) {
        try {
          const importedDialogue = importFromYarn(content, dialogue.title);
          onChange(importedDialogue);
        } catch (err) {
          console.error('Failed to import Yarn:', err);
          alert('Failed to import Yarn file. Please check the format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const handleSave = () => {
    if (onChange) {
      try {
        const importedDialogue = importFromYarn(yarnText, dialogue.title);
        onChange(importedDialogue);
        setIsEditing(false);
      } catch (err) {
        console.error('Failed to parse Yarn:', err);
        alert('Failed to parse Yarn text. Please check the format.');
      }
    }
  };
  
  const handleCancel = () => {
    setYarnText(exportToYarn(dialogue));
    setIsEditing(false);
  };
  
  return (
    <main className="flex-1 flex flex-col bg-[#0d0d14] overflow-hidden">
      <div className="border-b border-[#1a1a2e] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-400">Yarn Spinner {isEditing ? 'Editor' : 'View'}</span>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
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
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-gray-300 text-sm rounded flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
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
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-sm rounded flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-gray-300 text-sm rounded flex items-center gap-2"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {isEditing ? (
          <textarea
            value={yarnText}
            onChange={(e) => setYarnText(e.target.value)}
            className="w-full h-full font-mono text-sm text-gray-300 bg-[#08080c] rounded-lg p-4 border border-[#1a1a2e] resize-none focus:outline-none focus:border-[#e94560]"
            spellCheck={false}
          />
        ) : (
          <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap bg-[#08080c] rounded-lg p-4 border border-[#1a1a2e]">
            {yarnText}
          </pre>
        )}
      </div>
    </main>
  );
}

