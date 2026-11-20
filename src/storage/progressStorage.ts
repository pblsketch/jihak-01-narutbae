import { GameProgress } from '../types/game';

export const STORAGE_KEY = 'jihak-kr-01-narutbae:progress-v1';

export function createInitialProgress(): GameProgress {
  return {
    currentScene: 'title',
    grainLevel: 0,
    stanzaCompleted: {
      stanza1: false,
      stanza2: false,
      stanza3: false,
      stanza4: false,
      stanza5: false,
    },
    toneCompleted: {
      s2: false,
      s3: false,
      s4: false,
    },
    contrastPlaced: {
      'c2-mud': 'you', // 2연 풀이 예시(시범) 자동 배치 항목
    },
    observationsFound: [],
    lensesViewed: [],
    selectedLens: null,
    metaphorCard: {
      target: '',
      selfMetaphor: '',
      youMetaphor: '',
      similarity: '',
      authorName: '',
      stamped: false,
    },
    muted: false,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function loadProgress(): GameProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    const initial = createInitialProgress();
    return {
      ...initial,
      ...parsed,
      stanzaCompleted: { ...initial.stanzaCompleted, ...(parsed.stanzaCompleted ?? {}) },
      toneCompleted: { ...initial.toneCompleted, ...(parsed.toneCompleted ?? {}) },
      contrastPlaced: { ...initial.contrastPlaced, ...(parsed.contrastPlaced ?? {}) },
      observationsFound: Array.isArray(parsed.observationsFound) ? parsed.observationsFound : [],
      lensesViewed: Array.isArray(parsed.lensesViewed) ? parsed.lensesViewed : [],
      metaphorCard: { ...initial.metaphorCard, ...(parsed.metaphorCard ?? {}) },
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: GameProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

export function resetProgress(): GameProgress {
  const fresh = createInitialProgress();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return fresh;
}
