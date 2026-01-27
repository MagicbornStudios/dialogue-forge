'use client';

import React, { useEffect, useRef } from 'react';
import { useControls, button, folder } from 'leva';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';

interface LevaPropertyInspectorProps {
  layer: VideoLayer | null;
  onUpdate: (layerId: string, updates: Partial<VideoLayer>) => void;
  onClose: () => void;
}

export function LevaPropertyInspector({
  layer,
  onUpdate,
  onClose,
}: LevaPropertyInspectorProps) {
  if (!layer) {
    return null;
  }

  const visual = layer.visual ?? {};
  const style = layer.style ?? {};
  const inputs = layer.inputs ?? {};

  // Use layer ID in store name to ensure unique controls per layer
  // This forces Leva to recreate controls when layer changes
  const storeName = `Properties-${layer.id}`;

  // Track if update is coming from Leva to prevent feedback loops
  const isUpdatingFromLevaRef = useRef(false);
  const prevLayerRef = useRef<VideoLayer | null>(null);

  // Build controls - useControls doesn't reliably return set function for nested paths
  // We'll use a key-based approach with debouncing to avoid performance issues
  useControls(
    storeName,
    () => ({
      // Layer info
      _layerName: {
        value: layer.name ?? layer.id,
        label: 'Layer Name',
        onChange: (value) => {
          if (layer) {
            isUpdatingFromLevaRef.current = true;
            onUpdate(layer.id, { name: value });
          }
        },
      },
      _layerKind: {
        value: layer.kind,
        label: 'Type',
        disabled: true,
      },

      // Position folder (top-left corner position)
      Position: folder({
        x: {
          value: Math.round(visual.x ?? 0),
          min: 0,
          max: 1920,
          step: 1,
          label: 'X (top-left)',
          onChange: (value) => {
            if (layer) {
              isUpdatingFromLevaRef.current = true;
              onUpdate(layer.id, {
                visual: { ...layer.visual, x: value },
              });
            }
          },
        },
        y: {
          value: Math.round(visual.y ?? 0),
          min: 0,
          max: 1080,
          step: 1,
          label: 'Y (top-left)',
          onChange: (value) => {
            if (layer) {
              isUpdatingFromLevaRef.current = true;
              onUpdate(layer.id, {
                visual: { ...layer.visual, y: value },
              });
            }
          },
        },
      }),

      // Size folder
      Size: folder({
        width: {
          value: Math.round(visual.width ?? 200),
          min: 10,
          max: 1920,
          step: 1,
          onChange: (value) => {
            if (layer) {
              isUpdatingFromLevaRef.current = true;
              onUpdate(layer.id, {
                visual: { ...layer.visual, width: value },
              });
            }
          },
        },
        height: {
          value: Math.round(visual.height ?? 200),
          min: 10,
          max: 1080,
          step: 1,
          onChange: (value) => {
            if (layer) {
              isUpdatingFromLevaRef.current = true;
              onUpdate(layer.id, {
                visual: { ...layer.visual, height: value },
              });
            }
          },
        },
      }),

      // Transform folder
      Transform: folder({
        rotation: {
          value: visual.rotation ?? 0,
          min: 0,
          max: 360,
          step: 1,
          onChange: (value) => {
            if (layer) {
              isUpdatingFromLevaRef.current = true;
              onUpdate(layer.id, {
                visual: { ...layer.visual, rotation: value },
              });
            }
          },
        },
        opacity: {
          value: (layer.opacity ?? 1) * 100,
          min: 0,
          max: 100,
          step: 1,
          suffix: '%',
          onChange: (value) => {
            if (layer) {
              isUpdatingFromLevaRef.current = true;
              onUpdate(layer.id, { opacity: value / 100 });
            }
          },
        },
      }),

      // Text-specific controls
      ...(layer.kind === VIDEO_LAYER_KIND.TEXT
        ? {
            Text: folder({
              content: {
                value: inputs.content ?? '',
                onChange: (value) => {
                  if (layer) {
                    isUpdatingFromLevaRef.current = true;
                    onUpdate(layer.id, {
                      inputs: { ...layer.inputs, content: value },
                    });
                  }
                },
              },
              fontSize: {
                value: style.fontSize ?? 32,
                min: 8,
                max: 200,
                step: 1,
                onChange: (value) => {
                  if (layer) {
                    isUpdatingFromLevaRef.current = true;
                    onUpdate(layer.id, {
                      style: { ...layer.style, fontSize: value },
                    });
                  }
                },
              },
              fontWeight: {
                value: style.fontWeight ?? 'normal',
                options: ['normal', 'bold', '600', '300'],
                onChange: (value) => {
                  if (layer) {
                    isUpdatingFromLevaRef.current = true;
                    onUpdate(layer.id, {
                      style: { ...layer.style, fontWeight: value },
                    });
                  }
                },
              },
              color: {
                value: style.color ?? '#ffffff',
                onChange: (value) => {
                  if (layer) {
                    isUpdatingFromLevaRef.current = true;
                    onUpdate(layer.id, {
                      style: { ...layer.style, color: value },
                    });
                  }
                },
              },
              textAlign: {
                value: style.textAlign ?? 'center',
                options: ['left', 'center', 'right'],
                onChange: (value) => {
                  if (layer) {
                    isUpdatingFromLevaRef.current = true;
                    onUpdate(layer.id, {
                      style: { ...layer.style, textAlign: value as 'left' | 'center' | 'right' },
                    });
                  }
                },
              },
            }),
          }
        : {}),

      // Shape-specific controls
      ...(layer.kind === VIDEO_LAYER_KIND.RECTANGLE ||
      layer.kind === VIDEO_LAYER_KIND.CIRCLE ||
      layer.kind === VIDEO_LAYER_KIND.BACKGROUND
        ? {
            Fill: folder({
              backgroundColor: {
                value: style.backgroundColor ?? '#3b82f6',
                label: 'Color',
                onChange: (value) => {
                  if (layer) {
                    isUpdatingFromLevaRef.current = true;
                    onUpdate(layer.id, {
                      style: { ...layer.style, backgroundColor: value },
                    });
                  }
                },
              },
            }),
          }
        : {}),

      // Actions
      _close: button(() => onClose()),
    }),
    [layer.id] // Only recreate when layer ID changes
  );

  // Note: Leva's useControls doesn't support programmatic updates via set() for nested paths
  // Property updates from canvas will be reflected when the component remounts via key prop
  // This is handled by the parent component (DefaultTab) which uses a key based on layer ID

  return null; // Leva renders its own panel
}
