import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import { FLAG_TYPE } from '@magicborn/forge/types/constants';
import { FlagSchema } from '@magicborn/forge/types/flags';
import { DialogueResult, ForgeFlagState, ForgeGameFlagState, ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import { GamePlayer } from '@magicborn/forge/components/ForgeWorkspace/components/GamePlayer/GamePlayer';
import { flagTypeColors } from '@magicborn/forge/lib/flag-manager/utils/flag-constants';
import { initializeFlags } from '@magicborn/forge/lib/flag-manager/utils/flag-manager';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@magicborn/shared/ui/select';
import type { VideoTemplate } from '@magicborn/video/templates/types/video-template';
import type { VideoTemplateOverrides } from '@magicborn/video/templates/types/video-template-overrides';
import type { VideoTemplateWorkspaceTemplateSummary } from '@magicborn/video/workspace/video-template-workspace-contracts';

interface PlayViewProps {
  graph: ForgeGraphDoc;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  gameState?: ForgeGameState;
  gameStateFlags?: ForgeGameFlagState;
  videoTemplateOverrides?: VideoTemplateOverrides;
}

export function PlayView({
  graph,
  startNodeId,
  flagSchema,
  gameState,
  gameStateFlags,
  videoTemplateOverrides,
}: PlayViewProps) {
  const videoTemplateAdapter = useForgeWorkspaceStore((s) => s.videoTemplateAdapter);
  const workspaceOverrides = useForgeWorkspaceStore((s) => s.videoTemplateOverrides);
  const resolvedOverrides = videoTemplateOverrides ?? workspaceOverrides;
  const [templateSummaries, setTemplateSummaries] = useState<VideoTemplateWorkspaceTemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [templateListError, setTemplateListError] = useState<string | null>(null);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [isTemplateListLoading, setIsTemplateListLoading] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // Initialize game flags with defaults from schema, then merge with gameState
  const resolvedGameState = useMemo(() => {
    const baseState: ForgeGameState = gameState ?? { flags: gameStateFlags ?? {} };
    const baseFlags = baseState.flags ?? {};
    if (flagSchema) {
      const defaults = initializeFlags(flagSchema);
      return {
        ...baseState,
        flags: { ...defaults, ...baseFlags },
      };
    }
    return {
      ...baseState,
      flags: baseFlags,
    };
  }, [flagSchema, gameState, gameStateFlags]);

  const resolvedGameStateFlags = resolvedGameState.flags;
  
  const [currentFlags, setCurrentFlags] = useState<ForgeFlagState>(resolvedGameStateFlags);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [flagsSetDuringRun, setFlagsSetDuringRun] = useState<Set<string>>(new Set());

  // Track baseline flags to detect changes
  const baseFlagsRef = useRef<ForgeGameFlagState>(resolvedGameStateFlags);

  useEffect(() => {
    baseFlagsRef.current = resolvedGameStateFlags;
  }, [resolvedGameStateFlags]);

  useEffect(() => {
    setCurrentFlags(resolvedGameStateFlags);
    setFlagsSetDuringRun(new Set());
  }, [resolvedGameStateFlags]);

  useEffect(() => {
    let isActive = true;

    if (!videoTemplateAdapter) {
      setTemplateSummaries([]);
      setSelectedTemplateId('');
      setSelectedTemplate(null);
      setTemplateListError(null);
      setIsTemplateListLoading(false);
      return;
    }

    setIsTemplateListLoading(true);
    setTemplateListError(null);

    videoTemplateAdapter
      .listTemplates()
      .then((templates) => {
        if (!isActive) {
          return;
        }
        setTemplateSummaries(templates);
        setSelectedTemplateId((prev) =>
          templates.some((template) => template.id === prev) ? prev : ''
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        console.error('Failed to load video templates:', error);
        setTemplateSummaries([]);
        setSelectedTemplateId('');
        setTemplateListError('Unable to load templates.');
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsTemplateListLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [videoTemplateAdapter]);

  useEffect(() => {
    let isActive = true;

    if (!videoTemplateAdapter || !selectedTemplateId) {
      setSelectedTemplate(null);
      setTemplateLoadError(null);
      setIsTemplateLoading(false);
      return;
    }

    setIsTemplateLoading(true);
    setTemplateLoadError(null);

    videoTemplateAdapter
      .loadTemplate(selectedTemplateId)
      .then((template) => {
        if (!isActive) {
          return;
        }
        setSelectedTemplate(template);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        console.error('Failed to load video template:', error);
        setSelectedTemplate(null);
        setTemplateLoadError('Unable to load template.');
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsTemplateLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [selectedTemplateId, videoTemplateAdapter]);

  const handleComplete = (result: DialogueResult) => {
    // Update flags from result
    if (result.updatedFlags) {
      setCurrentFlags(result.updatedFlags);
    }
  };
  
  const handleFlagUpdate = (flags: ForgeFlagState) => {
    setCurrentFlags(flags);
    
    // Track which flags were set during this run
    if (flagSchema) {
      setFlagsSetDuringRun(prev => {
        const next = new Set(prev);
        Object.keys(flags).forEach(flagId => {
          const initialValue = baseFlagsRef.current[flagId];
          const currentValue = flags[flagId];
          if (initialValue !== currentValue) {
            next.add(flagId);
          }
        });
        return next;
      });
    }
  };

  // Get all non-dialogue flags from schema
  const gameFlagsList = useMemo(() => {
    if (!flagSchema) return [];
    return flagSchema.flags.filter(f => f.type !== FLAG_TYPE.DIALOGUE);
  }, [flagSchema]);

  return (
    <main className="flex-1 flex flex-col relative">
      <div className="flex items-center justify-between border-b border-df-editor-border bg-df-editor-bg px-4 py-3 text-xs text-df-text-secondary">
        <div className="uppercase tracking-[0.25em]">Video Template</div>
        <div className="flex items-center gap-3">
          {templateListError && (
            <span className="text-[10px] text-[#e94560]">{templateListError}</span>
          )}
          {templateLoadError && (
            <span className="text-[10px] text-[#e94560]">{templateLoadError}</span>
          )}
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
            disabled={!videoTemplateAdapter || isTemplateListLoading}
          >
            <SelectTrigger className="h-8 w-56 border-df-control-border bg-df-surface text-xs text-white">
              <SelectValue
                placeholder={
                  videoTemplateAdapter
                    ? isTemplateListLoading
                      ? 'Loading templates...'
                      : 'Select template...'
                    : 'Template adapter unavailable'
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-df-surface text-white border-df-control-border">
              <SelectItem value="">No template</SelectItem>
              {templateSummaries.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isTemplateLoading && <span className="text-[10px] text-gray-500">Loading...</span>}
        </div>
      </div>
      {/* Debug Toggle Button */}
      {flagSchema && (
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-df-surface hover:bg-df-control-hover border border-df-control-border hover:border-df-error text-df-text-secondary hover:text-df-text-primary text-xs rounded-lg transition-colors flex items-center gap-2"
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
        <div className="absolute top-12 right-4 w-80 bg-df-canvas-bg border border-df-editor-border rounded-lg shadow-xl z-20 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-df-editor-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Flag Debug Panel</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="p-1 text-df-text-secondary hover:text-df-text-primary"
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
                      <div key={flagId} className="bg-df-surface border border-df-control-border rounded px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${flagTypeColors[flag.type]}`}>
                            {flag.type}
                          </span>
                          <span className="font-mono text-white flex-1 truncate">{flagId}</span>
                          {value !== undefined && (
                            <span className="text-df-text-secondary">
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
                      className={`bg-df-surface border rounded px-2 py-1.5 text-xs transition-colors ${
                        wasSet ? 'border-df-error/50 bg-df-error/5' : 'border-df-control-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${flagTypeColors[flag.type]}`}>
                          {flag.type}
                        </span>
                        <span className="font-mono text-white flex-1 truncate text-[10px]">{flag.id}</span>
                        {wasSet && (
                          <span className="text-[10px] px-1 py-0.5 bg-df-error/20 text-[#e94560] rounded">NEW</span>
                        )}
                      </div>
                      <div className="text-df-text-secondary text-[10px] truncate">{flag.name}</div>
                      {hasValue ? (
                        <div className="mt-1 text-[10px] text-df-text-secondary">
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
      
      <GamePlayer
        dialogue={graph}
        startNodeId={startNodeId}
        flagSchema={flagSchema}
        gameState={resolvedGameState}
        gameStateFlags={resolvedGameStateFlags}
        videoTemplate={selectedTemplate}
        videoTemplateOverrides={resolvedOverrides}
        onComplete={handleComplete}
        onFlagsChange={handleFlagUpdate}
      />
    </main>
  );
}
