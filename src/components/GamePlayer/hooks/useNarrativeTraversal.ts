import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoryThread } from '../../../types/narrative';
import { buildLinearSequence, type NarrativeSequenceStep } from '../../../utils/narrative-helpers';

export interface NarrativeLocation {
  actIndex: number;
  chapterIndex: number;
  pageIndex: number;
}

export interface NarrativeProgress {
  actTitle: string;
  chapterTitle: string;
  pageIndex: number;
  pageCount: number;
  progress: number;
}

interface NarrativeTraversalOptions {
  thread: StoryThread;
  initialLocation?: NarrativeLocation;
}

const DEFAULT_LOCATION: NarrativeLocation = {
  actIndex: 0,
  chapterIndex: 0,
  pageIndex: 0,
};

function resolveLocationStep(
  sequence: NarrativeSequenceStep[],
  location: NarrativeLocation
): NarrativeSequenceStep | undefined {
  return sequence.find(
    step =>
      step.actIndex === location.actIndex &&
      step.chapterIndex === location.chapterIndex &&
      step.pageIndex === location.pageIndex
  );
}

export function useNarrativeTraversal({ thread, initialLocation }: NarrativeTraversalOptions) {
  const [location, setLocation] = useState<NarrativeLocation>(
    initialLocation ?? DEFAULT_LOCATION
  );

  const sequence = useMemo(() => buildLinearSequence(thread), [thread]);

  const currentSequenceIndex = useMemo(() => {
    if (sequence.length === 0) {
      return 0;
    }
    const matchIndex = sequence.findIndex(step =>
      step.actIndex === location.actIndex &&
      step.chapterIndex === location.chapterIndex &&
      step.pageIndex === location.pageIndex
    );
    return matchIndex >= 0 ? matchIndex : 0;
  }, [location.actIndex, location.chapterIndex, location.pageIndex, sequence]);

  const currentStep = sequence[currentSequenceIndex];

  useEffect(() => {
    if (!initialLocation) return;
    setLocation(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    if (sequence.length === 0) {
      setLocation(DEFAULT_LOCATION);
      return;
    }
    setLocation(prev => {
      const match = resolveLocationStep(sequence, prev);
      if (match) {
        return prev;
      }
      return {
        actIndex: sequence[0].actIndex,
        chapterIndex: sequence[0].chapterIndex,
        pageIndex: sequence[0].pageIndex,
      };
    });
  }, [sequence]);

  const setLocationFromSequenceIndex = useCallback(
    (index: number) => {
      if (sequence.length === 0) {
        setLocation(DEFAULT_LOCATION);
        return;
      }
      const clampedIndex = Math.min(Math.max(index, 0), sequence.length - 1);
      const step = sequence[clampedIndex];
      setLocation({
        actIndex: step.actIndex,
        chapterIndex: step.chapterIndex,
        pageIndex: step.pageIndex,
      });
    },
    [sequence]
  );

  const goToPage = useCallback(
    (pageIndex: number) => {
      setLocationFromSequenceIndex(pageIndex);
    },
    [setLocationFromSequenceIndex]
  );

  const nextPage = useCallback(() => {
    setLocationFromSequenceIndex(currentSequenceIndex + 1);
  }, [currentSequenceIndex, setLocationFromSequenceIndex]);

  const previousPage = useCallback(() => {
    setLocationFromSequenceIndex(currentSequenceIndex - 1);
  }, [currentSequenceIndex, setLocationFromSequenceIndex]);

  const progress = useMemo<NarrativeProgress>(() => {
    const safePageCount = Math.max(sequence.length, 1);
    const safeIndex = Math.min(currentSequenceIndex, safePageCount - 1);
    const actTitle = currentStep?.act.title ?? 'Untitled Act';
    const chapterTitle = currentStep?.chapter.title ?? 'Untitled Chapter';

    return {
      actTitle,
      chapterTitle,
      pageIndex: safeIndex,
      pageCount: safePageCount,
      progress: (safeIndex + 1) / safePageCount,
    };
  }, [currentSequenceIndex, currentStep?.act.title, currentStep?.chapter.title, sequence.length]);

  return {
    location,
    progress,
    sequence,
    currentStep: currentStep ?? null,
    goToPage,
    nextPage,
    previousPage,
  };
}
