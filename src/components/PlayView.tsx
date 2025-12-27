import React, { useState, useMemo, useRef } from 'react';
import { DialogueTree } from '../types';
import { FlagSchema, FlagType } from '../types/flags';
import { GameFlagState, DialogueResult, FlagState } from '../types/game-state';
import { initializeFlags } from '../lib/flag-manager';
import { ScenePlayer, ScenePlayerProps } from './ScenePlayer';

interface PlayViewProps {
  dialogue: DialogueTree;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  initialFlags?: GameFlagState;
}

export function PlayView({ dialogue, startNodeId, flagSchema, initialFlags }: PlayViewProps) {
  // Initialize game flags with defaults from schema, then merge with initialFlags
  const initialGameFlags = useMemo(() => {
    if (flagSchema) {
      const defaults = initializeFlags(flagSchema);
      return { ...defaults, ...initialFlags };
    }
    return initialFlags || {};
  }, [flagSchema, initialFlags]);
  
  // Convert flags to gameState format for ScenePlayer
  const gameState = useMemo(() => {
    return { flags: initialGameFlags };
  }, [initialGameFlags]);
  
  const [currentFlags, setCurrentFlags] = useState<FlagState>(initialGameFlags);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [flagsSetDuringRun, setFlagsSetDuringRun] = useState<Set<string>>(new Set());
  
  // Track initial flags to detect changes
  const initialFlagsRef = useRef<GameFlagState>(initialGameFlags);
  
  const handleComplete = (result: DialogueResult) => {
    // Update flags from result
    if (result.updatedFlags) {
      setCurrentFlags(result.updatedFlags);
    }
  };
  
  const handleFlagUpdate = (flags: FlagState) => {
    setCurrentFlags(flags);
    
    // Track which flags were set during this run
    if (flagSchema) {
      setFlagsSetDuringRun(prev => {
        const next = new Set(prev);
        Object.keys(flags).forEach(flagId => {
          const initialValue = initialFlagsRef.current[flagId];
          const currentValue = flags[flagId];
          if (initialValue !== currentValue) {
            next.add(flagId);
          }
        });
        return next;
      });
    }
  };

  // Update gameState when flags change (for ScenePlayer)
  const currentGameState = useMemo(() => {
    return { flags: currentFlags };
  }, [currentFlags]);
  
  // Get all non-dialogue flags from schema
  const gameFlagsList = useMemo(() => {
    if (!flagSchema) return [];
    return flagSchema.flags.filter(f => f.type !== 'dialogue');
  }, [flagSchema]);
  
  const flagTypeColors: Record<FlagType, string> = {
    dialogue: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    quest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    achievement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    item: 'bg-green-500/20 text-green-400 border-green-500/30',
    stat: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    title: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    global: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <main className="flex-1 flex flex-col relative">
      {/* Debug Toggle Button */}
      {flagSchema && (
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-[#1a1a2e] hover:bg-[#2a2a3e] border border-[#2a2a3e] hover:border-[#e94560] text-gray-400 hover:text-white text-xs rounded-lg transition-colors flex items-center gap-2"
          title="Toggle Flag Debug Panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 15h6M9 12h6" />
          </svg>
          {showDebugPanel ? 'Hide' : 'Debug'} Flags
        </button>
      )}
      
      {/* Debug Panel */}
      {showDebugPanel && flagSchema && (
        <div className="absolute top-12 right-4 w-80 bg-[#0d0d14] border border-[#1a1a2e] rounded-lg shadow-xl z-20 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#1a1a2e] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Flag Debug Panel</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Flags Set During Run */}
            {flagsSetDuringRun.size > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-2">Flags Set This Run ({flagsSetDuringRun.size})</h4>
                <div className="space-y-1">
                  {Array.from(flagsSetDuringRun).map(flagId => {
                    const flag = flagSchema.flags.find(f => f.id === flagId);
                    if (!flag) return null;
                    const value = currentFlags[flagId];
                    return (
                      <div key={flagId} className="bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${flagTypeColors[flag.type]}`}>
                            {flag.type}
                          </span>
                          <span className="font-mono text-white flex-1 truncate">{flagId}</span>
                          {value !== undefined && (
                            <span className="text-gray-400">
                              = {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* All Game Flags */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2">All Game Flags ({gameFlagsList.length})</h4>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {gameFlagsList.map(flag => {
                  const value = currentFlags[flag.id];
                  const wasSet = flagsSetDuringRun.has(flag.id);
                  const hasValue = value !== undefined;
                  
                  return (
                    <div 
                      key={flag.id} 
                      className={`bg-[#12121a] border rounded px-2 py-1.5 text-xs transition-colors ${
                        wasSet ? 'border-[#e94560]/50 bg-[#e94560]/5' : 'border-[#2a2a3e]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${flagTypeColors[flag.type]}`}>
                          {flag.type}
                        </span>
                        <span className="font-mono text-white flex-1 truncate text-[10px]">{flag.id}</span>
                        {wasSet && (
                          <span className="text-[10px] px-1 py-0.5 bg-[#e94560]/20 text-[#e94560] rounded">NEW</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[10px] truncate">{flag.name}</div>
                      {hasValue ? (
                        <div className="mt-1 text-[10px] text-gray-300">
                          <span className="text-gray-500">Value: </span>
                          <span className="font-mono">
                            {typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                             typeof value === 'number' ? value : 
                             `"${value}"`}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-gray-600 italic">Not set</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ScenePlayer handles all dialogue playback */}
      <ScenePlayer
        dialogue={dialogue}
        gameState={currentGameState}
        startNodeId={startNodeId}
        onComplete={handleComplete}
        onFlagUpdate={handleFlagUpdate}
      />
    </main>
  );
}
