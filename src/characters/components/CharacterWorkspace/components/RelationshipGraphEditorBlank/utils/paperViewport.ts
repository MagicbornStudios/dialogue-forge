import type { dia } from '@joint/core';

export interface PaperViewportOptions {
  container: HTMLElement;
  minScale?: number;
  maxScale?: number;
}

export interface PaperViewportFacade {
  destroy(): void;
}

const DEFAULT_MIN_SCALE = 0.25;
const DEFAULT_MAX_SCALE = 2;
const ZOOM_SENSITIVITY = 0.001;

export function installPaperViewport(
  paper: dia.Paper,
  options: PaperViewportOptions
): PaperViewportFacade {
  const container = options.container;
  const minScale = options.minScale ?? DEFAULT_MIN_SCALE;
  const maxScale = options.maxScale ?? DEFAULT_MAX_SCALE;

  let panStart: { clientX: number; clientY: number; tx: number; ty: number } | null = null;

  const onWheel = (evt: WheelEvent) => {
    evt.preventDefault();
    const delta = -evt.deltaY * ZOOM_SENSITIVITY;
    const current = paper.scale();
    const s = typeof current === 'object' && current !== null && 'sx' in current ? (current as { sx: number }).sx : 1;
    const newScale = Math.min(maxScale, Math.max(minScale, s + delta));
    if (newScale === s) return;
    const point = paper.clientToLocalPoint(evt.clientX, evt.clientY);
    paper.scaleUniformAtPoint(newScale, point);
  };

  const onPointerMove = (evt: PointerEvent) => {
    if (!panStart) return;
    const dx = evt.clientX - panStart.clientX;
    const dy = evt.clientY - panStart.clientY;
    paper.translate(panStart.tx + dx, panStart.ty + dy);
  };

  const onPointerUp = () => {
    panStart = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  };

  const onBlankPointerDown = (evt: dia.Event) => {
    const native = (evt as unknown as { originalEvent?: PointerEvent }).originalEvent as PointerEvent | undefined;
    if (!native || native.button !== 0) return;
    const t = paper.translate();
    const tx = typeof t === 'object' && t !== null && 'tx' in t ? (t as { tx: number; ty: number }).tx : 0;
    const ty = typeof t === 'object' && t !== null && 'ty' in t ? (t as { tx: number; ty: number }).ty : 0;
    panStart = { clientX: native.clientX, clientY: native.clientY, tx, ty };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  };

  container.addEventListener('wheel', onWheel, { passive: false });
  paper.on('blank:pointerdown', onBlankPointerDown);

  return {
    destroy() {
      container.removeEventListener('wheel', onWheel);
      paper.off('blank:pointerdown', onBlankPointerDown);
      if (panStart) {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
      }
    },
  };
}
