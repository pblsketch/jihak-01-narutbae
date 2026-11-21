export type SceneId =
  | 'title'
  | 'intro'
  | 'stanza1'
  | 'stanza2'
  | 'stanza3'
  | 'stanza4'
  | 'stanza5'
  | 'lenses'
  | 'metaphor'
  | 'result';

export type ToneMode = 'resentment' | 'dry' | 'honorific';

export type LensId = 'lover' | 'nation' | 'buddhism';

export type ContrastSide = 'self' | 'you';

export type AchievementSealId = 'quiet-ferryman' | 'three-gaze-reader' | 'complete-waiting';

export interface ResonanceEvent {
  id: number;
  label: string;
  detail?: string;
  chain: number;
  tone?: 'gold' | 'seal' | 'jade';
}

export interface MetaphorCardData {
  target: string;
  selfMetaphor: string;
  youMetaphor: string;
  similarity: string;
  authorName: string;
  stamped: boolean;
}

export interface GameProgress {
  currentScene: SceneId;
  grainLevel: number; // 0 to 4 (헌신의 결 — 역전된 내구도)
  stanzaCompleted: Record<'stanza1' | 'stanza2' | 'stanza3' | 'stanza4' | 'stanza5', boolean>;
  toneCompleted: Record<'s2' | 's3' | 's4', boolean>;
  contrastPlaced: Record<string, ContrastSide>;
  observationsFound: string[];
  lensesViewed: LensId[];
  selectedLens: LensId | null;
  unlockedSeals: AchievementSealId[];
  metaphorCard: MetaphorCardData;
  muted: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface SceneVisualState {
  scene: SceneId;
  grainLevel: number;
  tonePreview: ToneMode | null;
  holdProgress: number; // 0..1
  isHolding: boolean;
  waterDepth: 'calm' | 'shallow' | 'deep' | 'rapids';
  timeOfDay: 'morning' | 'overcast' | 'night' | 'dawn' | 'clearMorning';
  weather: 'mist' | 'wind' | 'snowRain' | 'clear';
  dawnReveal: number; // 0..1 (4연 그러나 전환)
  activeLens: LensId | null;
  boatTilt: number; // -1..1 gentle wobble when hold released
  passerbyState: 'distant' | 'boarding' | 'onboard' | 'departing' | 'gone';
  resonancePulse: number; // timestamp/counter for golden shimmer surge
  resonanceChain: number; // consecutive poetic resonance chain count
}
