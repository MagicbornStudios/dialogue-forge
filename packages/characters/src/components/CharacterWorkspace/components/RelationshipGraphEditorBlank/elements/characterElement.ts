import { dia } from '@joint/core';

export type CharacterCardNodeAttrs = {
  name?: string;
  initials?: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
};

type CharacterCardModel = dia.Element & {
  setName: (name: string) => void;
  setSubtitle: (subtitle?: string | null) => void;
  setInitials: (initials: string) => void;
  setAvatarUrl: (url?: string | null) => void;
  setSelected: (selected: boolean) => void;
};

let characterCardConstructor: ReturnType<typeof dia.Element.define> | null = null;

export function computeInitials(name?: string): string {
  const n = (name ?? '').trim();
  if (!n) return 'NC';
  const parts = n.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'N';
  const second =
    (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) ?? 'C';
  return (first + second).toUpperCase();
}

/**
 * Defines: mb.CharacterCard
 * - Shadcn-ish: flat surface, subtle stroke, subtle inner highlight
 * - Avatar bubble overlaps slightly (but not "hanging off" too much)
 * - Bottom accent border
 * - Per-instance mask id (no collisions)
 * - Optional selected state (border + glow + accent line)
 */
export function ensureCharacterCardNodeDefined() {
  if (characterCardConstructor !== null) return;

  characterCardConstructor = dia.Element.define(
    'mb.CharacterCard',
    {
      size: { width: 260, height: 72 },

      character: {
        name: 'New Character',
        initials: 'NC',
        avatarUrl: null,
        subtitle: null,
      },

      attrs: {
        // ---- plate
        plate: {
          x: 22,
          y: 10,
          width: 230,
          height: 52,
          rx: 12,
          ry: 12,
          fill: 'var(--color-df-node-bg)',
          stroke: 'var(--color-df-control-border)',
          strokeWidth: 1,
        },

        // subtle inner highlight (shadcn vibe)
        plateInner: {
          x: 23,
          y: 11,
          width: 228,
          height: 50,
          rx: 11,
          ry: 11,
          fill: 'none',
          stroke: 'rgba(255,255,255,0.06)',
          strokeWidth: 1,
          pointerEvents: 'none',
        },

        // bottom accent line
        plateAccent: {
          x: 22,
          y: 60,
          width: 230,
          height: 2,
          rx: 1,
          ry: 1,
          fill: 'var(--color-df-border-selected)',
          opacity: 0.6,
          pointerEvents: 'none',
        },

        // shadow as a dedicated path under the plate (cleaner than filter strings)
        plateShadow: {
          d: '', // computed in markup via rect? we'll use a rect instead (below)
          opacity: 1,
        },
        plateShadowRect: {
          x: 22,
          y: 10,
          width: 230,
          height: 52,
          rx: 12,
          ry: 12,
          fill: 'rgba(0,0,0,0.0)',
          filter: 'url(#mb-card-shadow)',
          pointerEvents: 'none',
        },

        // ---- avatar bubble (shifted right a bit)
        avatarRing: {
          cx: 44,
          cy: 36,
          r: 22,
          fill: 'var(--color-df-surface)',
          stroke: 'var(--color-df-control-border)',
          strokeWidth: 1,
        },
        avatarRingInner: {
          cx: 44,
          cy: 36,
          r: 20,
          fill: 'var(--color-df-elevated)',
          stroke: 'rgba(255,255,255,0.06)',
          strokeWidth: 1,
          pointerEvents: 'none',
        },

        // per-instance mask id; filled in by factory
        avatarMask: { id: '' },

        avatarImage: {
          x: 44 - 18,
          y: 36 - 18,
          width: 36,
          height: 36,
          preserveAspectRatio: 'xMidYMid slice',
          xlinkHref: '',
          mask: '',
          opacity: 0,
        },

        avatarInitials: {
          x: 44,
          y: 36,
          text: 'NC',
          fill: 'var(--color-df-text-primary)',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          opacity: 1,
        },

        // ---- text
        name: {
          x: 76,
          y: 32,
          text: 'New Character',
          fill: 'var(--color-df-text-primary)',
          fontSize: 14,
          fontWeight: 650,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAnchor: 'start',
          textVerticalAnchor: 'middle',
        },

        subtitle: {
          x: 76,
          y: 48,
          text: '',
          fill: 'var(--color-df-text-tertiary)',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAnchor: 'start',
          textVerticalAnchor: 'middle',
          opacity: 0,
        },

        // ---- selection affordances (toggled via setSelected)
        selectionStroke: {
          x: 22,
          y: 10,
          width: 230,
          height: 52,
          rx: 12,
          ry: 12,
          fill: 'none',
          stroke: 'var(--color-df-border-active)',
          strokeWidth: 1.5,
          opacity: 0,
          pointerEvents: 'none',
        },
        selectionGlowRect: {
          x: 22,
          y: 10,
          width: 230,
          height: 52,
          rx: 12,
          ry: 12,
          fill: 'rgba(0,0,0,0)',
          filter: 'url(#mb-card-glow)',
          opacity: 0,
          pointerEvents: 'none',
        },
        selectionAccent: {
          x: 22,
          y: 60,
          width: 230,
          height: 2,
          rx: 1,
          ry: 1,
          fill: 'var(--color-df-border-active)',
          opacity: 0,
          pointerEvents: 'none',
        },
      },
    },
    {
      markup: [
        // defs (shadow + glow + per-instance mask)
        {
          tagName: 'defs',
          children: [
            {
              tagName: 'filter',
              attributes: {
                id: 'mb-card-shadow',
                x: '-30%',
                y: '-30%',
                width: '160%',
                height: '180%',
              },
              children: [
                {
                  tagName: 'feDropShadow',
                  attributes: {
                    dx: '0',
                    dy: '6',
                    stdDeviation: '6',
                    'flood-color': '#000',
                    'flood-opacity': '0.35',
                  },
                },
              ],
            },
            {
              tagName: 'filter',
              attributes: {
                id: 'mb-card-glow',
                x: '-40%',
                y: '-40%',
                width: '180%',
                height: '220%',
              },
              children: [
                {
                  tagName: 'feDropShadow',
                  attributes: {
                    dx: '0',
                    dy: '0',
                    stdDeviation: '8',
                    'flood-color': '#00ff9a',
                    'flood-opacity': '0.12',
                  },
                },
              ],
            },
            {
              tagName: 'mask',
              selector: 'avatarMask',
              children: [
                {
                  tagName: 'rect',
                  attributes: { x: '0', y: '0', width: '100%', height: '100%', fill: 'black' },
                },
                {
                  tagName: 'circle',
                  attributes: { cx: '44', cy: '36', r: '18', fill: 'white' },
                },
              ],
            },
          ],
        },

        // plate shadow then plate
        { tagName: 'rect', selector: 'plateShadowRect' },
        { tagName: 'rect', selector: 'plate' },
        { tagName: 'rect', selector: 'plateInner' },
        { tagName: 'rect', selector: 'plateAccent' },

        // selection layers (hidden unless selected)
        { tagName: 'rect', selector: 'selectionGlowRect' },
        { tagName: 'rect', selector: 'selectionStroke' },
        { tagName: 'rect', selector: 'selectionAccent' },

        // avatar
        { tagName: 'circle', selector: 'avatarRing' },
        { tagName: 'circle', selector: 'avatarRingInner' },
        { tagName: 'image', selector: 'avatarImage' },
        { tagName: 'text', selector: 'avatarInitials' },

        // text
        { tagName: 'text', selector: 'name' },
        { tagName: 'text', selector: 'subtitle' },
      ],

      setName(this: dia.Element, name: string) {
        this.attr('name/text', name);
      },

      setSubtitle(this: dia.Element, subtitle?: string | null) {
        const text = (subtitle ?? '').trim();
        this.attr('subtitle/text', text);
        this.attr('subtitle/opacity', text ? 1 : 0);
      },

      setInitials(this: dia.Element, initials: string) {
        this.attr('avatarInitials/text', initials);
      },

      setAvatarUrl(this: dia.Element, url?: string | null) {
        const has = !!url && url.trim().length > 0;
        this.attr('avatarImage/xlinkHref', has ? url! : '');
        this.attr('avatarImage/opacity', has ? 1 : 0);
        this.attr('avatarInitials/opacity', has ? 0 : 1);
      },

      setSelected(this: dia.Element, selected: boolean) {
        this.attr('selectionStroke/opacity', selected ? 1 : 0);
        this.attr('selectionGlowRect/opacity', selected ? 1 : 0);
        this.attr('selectionAccent/opacity', selected ? 0.9 : 0);
        // Slightly boost default accent when selected
        this.attr('plateAccent/opacity', selected ? 0.25 : 0.6);
      },
    }
  );
}

export function getCharacterCardConstructor(): ReturnType<typeof dia.Element.define> {
  ensureCharacterCardNodeDefined();
  return characterCardConstructor!;
}

export function createCharacterCardElement(
  id: string,
  position: { x: number; y: number },
  attrs?: CharacterCardNodeAttrs
): CharacterCardModel {
  const CharacterCard = getCharacterCardConstructor();

  const name = attrs?.name ?? 'New Character';
  const initials = attrs?.initials ?? computeInitials(name);
  const avatarUrl = attrs?.avatarUrl ?? null;
  const subtitle = attrs?.subtitle ?? null;

  const el = new CharacterCard({ id, position }) as CharacterCardModel;

  // Per-instance mask id (prevents collisions across nodes)
  const maskId = `mb-avatar-mask-${id}`;
  el.attr('avatarMask/id', maskId);
  el.attr('avatarImage/mask', `url(#${maskId})`);

  el.setName(name);
  el.setInitials(initials);
  el.setSubtitle(subtitle);
  el.setAvatarUrl(avatarUrl);
  el.setSelected(false);

  return el;
}
