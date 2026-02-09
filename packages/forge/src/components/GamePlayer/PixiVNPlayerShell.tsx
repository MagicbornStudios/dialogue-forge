'use client';

import { useEffect, useRef, useState } from 'react';
import type { ForgeCompositionV1 } from '@magicborn/shared/types/composition';

export interface PixiVNPlayerShellProps {
  composition: ForgeCompositionV1 | null;
  className?: string;
}

export function PixiVNPlayerShell({
  composition,
  className,
}: PixiVNPlayerShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [engineMeta, setEngineMeta] = useState<string | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !composition) return;

    let disposed = false;
    let app: {
      destroy: (removeView?: boolean, stageOptions?: unknown) => void;
      stage?: { removeChildren?: () => void; addChild?: (...children: unknown[]) => void };
      renderer?: { resize?: (width: number, height: number) => void };
      init?: (options: Record<string, unknown>) => Promise<void>;
      canvas?: HTMLCanvasElement;
      view?: HTMLCanvasElement;
    } | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const initialize = async () => {
      try {
        const [pixivnModule, pixiModule] = await Promise.all([
          import('@drincs/pixi-vn'),
          import('pixi.js'),
        ]);

        if (disposed) return;

        const engineVersion =
          (pixivnModule as { VERSION?: string }).VERSION ??
          (pixivnModule as { version?: string }).version ??
          'loaded';
        setEngineMeta(`Pixi'VN ${engineVersion}`);
        setEngineError(null);

        const {
          Application,
          Graphics,
          Text,
          TextStyle,
        } = pixiModule as {
          Application: new () => any;
          Graphics: new () => any;
          Text: new (params: { text: string; style?: unknown } | string) => any;
          TextStyle: new (style: Record<string, unknown>) => any;
        };

        const createdApp = new Application();
        app = createdApp;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 480;

        if (typeof createdApp.init === 'function') {
          await createdApp.init({
            width,
            height,
            background: '#0f1220',
            antialias: true,
          });
        }

        const view = createdApp.canvas ?? createdApp.view;
        if (view) {
          view.style.width = '100%';
          view.style.height = '100%';
          view.style.display = 'block';
          container.innerHTML = '';
          container.appendChild(view);
        }

        const stage = createdApp.stage;
        if (stage && Graphics && Text && TextStyle) {
          const background = new Graphics();
          background.rect(0, 0, width, height).fill(0x101726);
          stage.addChild?.(background);

          const title = new Text({
            text: composition.graphs[0]?.title ?? 'Dialogue Scene',
            style: new TextStyle({
              fill: '#f3f5ff',
              fontSize: 26,
              fontFamily: 'Georgia, serif',
            }),
          });
          title.x = 24;
          title.y = 24;
          stage.addChild?.(title);

          const subtitle = new Text({
            text: `Root Graph #${composition.rootGraphId}`,
            style: new TextStyle({
              fill: '#96a4d6',
              fontSize: 14,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }),
          });
          subtitle.x = 24;
          subtitle.y = 62;
          stage.addChild?.(subtitle);
        }

        resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          const nextWidth = Math.floor(entry.contentRect.width);
          const nextHeight = Math.floor(entry.contentRect.height);
          createdApp.renderer?.resize?.(nextWidth, nextHeight);
        });
        resizeObserver.observe(container);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to initialize PixiVN shell';
        setEngineError(message);
      }
    };

    void initialize();

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (app) {
        try {
          app.destroy(true);
        } catch {
          // No-op on teardown.
        }
      }
      container.innerHTML = '';
    };
  }, [composition]);

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
        {engineError ? `PixiVN error: ${engineError}` : engineMeta ?? "Initializing Pixi'VN..."}
      </div>
    </div>
  );
}
