import { ContrastSide, LensId, ToneMode } from '../types/game';

export interface StanzaText {
  id: 'stanza1' | 'stanza2' | 'stanza3' | 'stanza4' | 'stanza5';
  number: number;
  title: string;
  summary: string;
  lines: string[];
}

/**
 * 지학사 2022 개정 공통국어1 교과서 p.19 수록 원문 (문장부호 100% 보존)
 * 주의: 1연 '당신은 행인'은 마침표 없음, 5연 '당신은 행인.'은 마침표 있음.
 */
export const POEM_STANZAS: StanzaText[] = [
  {
    id: 'stanza1',
    number: 1,
    title: '1연 · 나루터의 은유',
    summary: '‘나’와 ‘당신’의 관계 설정 (은유)',
    lines: ['나는 나룻배', '당신은 행인'],
  },
  {
    id: 'stanza2',
    number: 2,
    title: '2연 · 흙발과 급한 여울',
    summary: '당신에게 희생하며 어떤 물이든 건너는 ‘나’',
    lines: [
      '당신은 흙발로 나를 짓밟습니다.',
      '나는 당신을 안고 물을 건너갑니다.',
      '나는 당신을 안으면 깊으나 얕으나 급한 여울이나 건너갑니다.',
    ],
  },
  {
    id: 'stanza3',
    number: 3,
    title: '3연 · 밤에서 낮까지의 눈비',
    summary: '무정히 떠나는 당신을 바람·눈비 속 기다리는 ‘나’',
    lines: [
      '만일 당신이 아니 오시면 나는 바람을 쐬고 눈비를 맞으며 밤에서 낮까지 당신을 기다리고 있습니다.',
      '당신은 물만 건너면 나를 돌아보지도 않고 가십니다그려.',
    ],
  },
  {
    id: 'stanza4',
    number: 4,
    title: '4연 · 그러나, 날마다 낡아감',
    summary: '시상의 전환(‘그러나’), 거자필반(去者必返)의 믿음',
    lines: [
      '그러나 당신이 언제든지 오실 줄만은 알아요.',
      '나는 당신을 기다리면서 날마다 날마다 낡아갑니다.',
    ],
  },
  {
    id: 'stanza5',
    number: 5,
    title: '5연 · 수미상관, 다시 나루터',
    summary: '‘나’와 ‘당신’의 관계 강조, 형태적 완결성과 운율',
    lines: ['나는 나룻배', '당신은 행인.'],
  },
];

export interface ToneVariant {
  mode: ToneMode;
  label: string;
  isOriginal: boolean;
  sentence: string;
  effectText: string;
  sceneFeel: string;
}

export interface ToneTunerConfig {
  id: 's2' | 's3' | 's4';
  stanzaNumber: number;
  scaffoldLevel: 'worked-example' | 'optional-hint' | 'independent';
  prompt: string;
  hint?: string;
  variants: ToneVariant[];
  confirmNote: string;
}

export const TONE_TUNERS: Record<'s2' | 's3' | 's4', ToneTunerConfig> = {
  s2: {
    id: 's2',
    stanzaNumber: 2,
    scaffoldLevel: 'worked-example',
    prompt: '먼저 [원망·하대체]와 [건조 서술체]를 눌러 강물의 변화를 살펴본 뒤, 한용운의 원문 경어체로 조율해 보세요.',
    hint: '경어체 어미 ‘-ㅂ니다’는 짓밟히는 고통 속에서도 대상을 높이고 존경하는 마음을 담습니다.',
    variants: [
      {
        mode: 'resentment',
        label: '원망·하대체',
        isOriginal: false,
        sentence: '당신은 흙발로 날 마구 짓밟아.',
        effectText: '억울함과 원망이 앞서며 강물이 거칠고 탁하게 일렁입니다.',
        sceneFeel: '탁한 붉은 물결 · 날카로운 파고',
      },
      {
        mode: 'dry',
        label: '건조 서술체',
        isOriginal: false,
        sentence: '당신은 흙발로 나를 짓밟는다.',
        effectText: '사실만 기록하는 차가운 거리감이 생기며 정서적 울림이 식습니다.',
        sceneFeel: '채도 빠진 회색빛 · 정적',
      },
      {
        mode: 'honorific',
        label: '원문 경어체',
        isOriginal: true,
        sentence: '당신은 흙발로 나를 짓밟습니다.',
        effectText: '‘-ㅂ니다’ 경어체를 써서 아픔마저 담담히 받아들이는 존경과 무조건적 사랑을 드러냅니다.',
        sceneFeel: '깊은 쪽빛 윤슬 · 잔잔한 울림',
      },
    ],
    confirmNote: '경어체 ‘-ㅂ니다’는 화자가 당신을 원망하지 않고 변함없이 존경하며 헌신하는 태도를 형상화합니다.',
  },
  s3: {
    id: 's3',
    stanzaNumber: 3,
    scaffoldLevel: 'optional-hint',
    prompt: '물만 건너고 돌아보지 않는 당신을 향한 어조를 비교해 보고, 원문의 어조를 찾아 맞춰 보세요.',
    hint: '높임 선어말 어미 ‘-시-’와 경어체 ‘-ㅂ니다’, 그리고 감탄·탄식의 ‘-그려’가 어우러져 무정함에 대한 씁쓸함을 절제된 존중으로 감쌉니다.',
    variants: [
      {
        mode: 'resentment',
        label: '원망·하대체',
        isOriginal: false,
        sentence: '당신은 물만 건너면 날 돌아보지도 않고 가 버리네.',
        effectText: '서운함과 비난이 직접 터져 나오며 기다림의 의지가 흔들립니다.',
        sceneFeel: '사나운 찬바람 · 거센 눈보라',
      },
      {
        mode: 'dry',
        label: '건조 서술체',
        isOriginal: false,
        sentence: '당신은 물만 건너면 나를 돌아보지도 않고 간다.',
        effectText: '무심한 관찰에 그쳐 화자의 애틋한 그리움이 사라집니다.',
        sceneFeel: '서늘한 무채색 안개',
      },
      {
        mode: 'honorific',
        label: '원문 경어체',
        isOriginal: true,
        sentence: '당신은 물만 건너면 나를 돌아보지도 않고 가십니다그려.',
        effectText: '무정한 태도에 대한 안타까움을 ‘-시-’와 ‘-ㅂ니다그려’의 담담한 경어체로 절제해 품어 냅니다.',
        sceneFeel: '고요히 내리는 눈비 · 깊은 인내',
      },
    ],
    confirmNote: '‘가십니다그려’는 당신의 무정한 태도를 드러내면서도 끝내 경어체를 유지해 숭고한 사랑의 어조를 지킵니다.',
  },
  s4: {
    id: 's4',
    stanzaNumber: 4,
    scaffoldLevel: 'independent',
    prompt: '시상이 전환되는 4연입니다. 이제 힌트 없이, 화자의 흔들리지 않는 믿음이 담긴 원문 어조를 조율해 보세요.',
    variants: [
      {
        mode: 'resentment',
        label: '불확실·체념체',
        isOriginal: false,
        sentence: '그러나 당신이 언젠가는 오긴 오겠지.',
        effectText: '막연한 체념과 의심이 스며들어 의지적 믿음이 약해집니다.',
        sceneFeel: '흐릿한 어둠 · 흔들리는 등불',
      },
      {
        mode: 'dry',
        label: '건조 단정체',
        isOriginal: false,
        sentence: '그러나 당신이 언제든지 올 줄만은 안다.',
        effectText: '딱딱한 선언처럼 들려 임을 향한 부드러운 간절함이 줄어듭니다.',
        sceneFeel: '차가운 새벽빛',
      },
      {
        mode: 'honorific',
        label: '원문 경어체',
        isOriginal: true,
        sentence: '그러나 당신이 언제든지 오실 줄만은 알아요.',
        effectText: '부드러운 경어체 ‘-아요’로 떠난 임은 반드시 돌아온다는 확신(거자필반)과 희망을 노래합니다.',
        sceneFeel: '어둠을 가르는 금빛 새벽 여명',
      },
    ],
    confirmNote: '4연의 ‘그러나’는 시상을 전환하며, ‘-아요’ 경어체는 의지적·희망적·긍정적 어조를 완성합니다.',
  },
};

export interface ContrastItem {
  id: string;
  stanza: 2 | 3 | 4;
  text: string;
  correctSide: ContrastSide;
  quoteHint: string;
  autoDemo?: boolean;
}

export const CONTRAST_ITEMS: ContrastItem[] = [
  {
    id: 'c2-mud',
    stanza: 2,
    text: '흙발로 짓밟음',
    correctSide: 'you',
    quoteHint: '“당신은 흙발로 나를 짓밟습니다.” — 주어가 ‘당신은’입니다.',
    autoDemo: true,
  },
  {
    id: 'c2-cross',
    stanza: 2,
    text: '안고 어떤 물이든 건너감',
    correctSide: 'self',
    quoteHint: '“나는 당신을 안으면 깊으나 얕으나 급한 여울이나 건너갑니다.” — 주어가 ‘나는’입니다.',
  },
  {
    id: 'c3-wait',
    stanza: 3,
    text: '바람·눈비 맞으며 밤낮 기다림',
    correctSide: 'self',
    quoteHint: '“나는 바람을 쐬고 눈비를 맞으며 밤에서 낮까지 당신을 기다리고 있습니다.”',
  },
  {
    id: 'c3-leave',
    stanza: 3,
    text: '물만 건너면 돌아보지 않고 가 버림',
    correctSide: 'you',
    quoteHint: '“당신은 물만 건너면 나를 돌아보지도 않고 가십니다그려.”',
  },
  {
    id: 'c4-age',
    stanza: 4,
    text: '기다리면서 날마다 낡아감',
    correctSide: 'self',
    quoteHint: '“나는 당신을 기다리면서 날마다 날마다 낡아갑니다.”',
  },
  {
    id: 'c4-return',
    stanza: 4,
    text: '무정하지만 언제든지 다시 올 사랑의 대상',
    correctSide: 'you',
    quoteHint: '“그러나 당신이 언제든지 오실 줄만은 알아요.” (거자필반의 믿음)',
  },
];

export interface ObservationNote {
  id: string;
  stanza: 1 | 2 | 3 | 4 | 5;
  title: string;
  tag: '1926 고증' | '문학 개념' | '텍스트 세밀 관찰';
  shortLabel: string;
  description: string;
  screenPos: { x: number; y: number }; // 0..100% viewport guidance for interactive pin
}

export const OBSERVATION_NOTES: ObservationNote[] = [
  {
    id: 'obs-1-plank',
    stanza: 1,
    title: '소나무 평저선 판자 이음',
    tag: '1926 고증',
    shortLabel: '평저선 선체',
    description:
      '1920년대 한국 강 나루터의 나룻배는 얕은 여울과 흙 기슭에 닿을 수 있도록 바닥이 평평한 소나무 평저선(거룻배)이었습니다. 화려한 장식 없이 오직 사람을 건네기 위해 만든 소박한 목선입니다.',
    screenPos: { x: 28, y: 58 },
  },
  {
    id: 'obs-2-mud',
    stanza: 2,
    title: '짚신·검정 고무신의 흙발 자국',
    tag: '1926 고증',
    shortLabel: '1926년 흙발',
    description:
      '『님의 침묵』이 출간된 1926년 무렵 조선의 길손들은 전통 짚신이나 당시 보급되던 검정 고무신을 신고 흙길을 걸었습니다. 배 바닥에 남은 흙발 자국은 훼손이 아니라 당신을 받아 안은 흔적입니다.',
    screenPos: { x: 46, y: 63 },
  },
  {
    id: 'obs-3-post',
    stanza: 3,
    title: '닳아 가는 삼베 밧줄과 나무 말뚝',
    tag: '문학 개념',
    shortLabel: '밤낮의 나루터',
    description:
      '‘만일 당신이 아니 오시면’은 상황의 가정이며, ‘밤에서 낮까지’는 단순히 하루가 아니라 ‘언제나, 항상, 영원히’ 이어지는 기다림의 시간을 뜻합니다.',
    screenPos: { x: 18, y: 48 },
  },
  {
    id: 'obs-4-return',
    stanza: 4,
    title: '거자필반(去者必返)의 새벽 물결',
    tag: '문학 개념',
    shortLabel: '거자필반',
    description:
      '‘그러나’로 시상이 전환되며 드러나는 “언제든지 오실 줄만은 알아요”에는 떠난 사람은 반드시 돌아온다는 불교적 진리, 거자필반(去者必返)의 깊은 믿음이 담겨 있습니다.',
    screenPos: { x: 54, y: 38 },
  },
  {
    id: 'obs-5-period',
    stanza: 5,
    title: '1연에 없던 마침표 하나(.)',
    tag: '텍스트 세밀 관찰',
    shortLabel: '마침표의 울림',
    description:
      '교과서 원문을 자세히 보면 1연 끝은 ‘당신은 행인’으로 열려 있지만, 5연 끝에는 ‘당신은 행인.’으로 마침표가 찍혀 있습니다. 수미상관의 형식적 완결성과 깊은 여운을 완성하는 작은 장치입니다.',
    screenPos: { x: 35, y: 52 },
  },
];

export interface SymbolicLens {
  id: LensId;
  title: string;
  badge: string;
  subtitle: string;
  asset: string;
  accentColor: string;
  overlayTint: string;
  meaningYou: string;
  meaningWater: string;
  meaningBoat: string;
  explanation: string;
}

export const SYMBOLIC_LENSES: SymbolicLens[] = [
  {
    id: 'lover',
    title: '연인의 렌즈',
    badge: '사랑의 시선',
    subtitle: '무조건적 희생과 기다림의 사랑',
    asset: './assets/lens-lover.webp',
    accentColor: '#A84A58',
    overlayTint: 'rgba(168, 74, 88, 0.14)',
    meaningYou: '사랑하는 임(연인)',
    meaningWater: '사랑을 가로막는 시련과 장애물',
    meaningBoat: '아픔을 감수하고 임을 품어 기다리는 화자',
    explanation:
      '상대가 무정하게 떠나더라도 원망하지 않고, 날마다 낡아가며 다시 돌아올 임을 믿는 헌신적인 사랑의 본질로 읽는 시선입니다.',
  },
  {
    id: 'nation',
    title: '조국의 렌즈',
    badge: '1926년의 시선',
    subtitle: '일제강점기 빼앗긴 조국과 광복의 믿음',
    asset: './assets/lens-nation.webp',
    accentColor: '#2B5B73',
    overlayTint: 'rgba(43, 91, 115, 0.16)',
    meaningYou: '빼앗긴 조국 · 광복',
    meaningWater: '식민지 현실의 어두운 고난과 역경',
    meaningBoat: '고통을 견디며 광복을 기다리는 독립운동가·민족',
    explanation:
      '1926년 일제강점기라는 시대 맥락에서 읽으면, 바람과 눈비를 맞으며 반드시 돌아올 ‘당신’을 믿는 태도는 조국 광복을 향한 꺾이지 않는 의지가 됩니다.',
  },
  {
    id: 'buddhism',
    title: '불교의 렌즈',
    badge: '구도(求道)의 시선',
    subtitle: '고해(苦海)를 건네는 제도(濟度)와 보시(布施)',
    asset: './assets/lens-buddhism.webp',
    accentColor: '#9C732B',
    overlayTint: 'rgba(156, 115, 43, 0.15)',
    meaningYou: '구제해야 할 중생 / 깨달음의 부처',
    meaningWater: '고통과 번뇌의 바다, 고해(苦海)',
    meaningBoat: '자신을 희생해 중생을 건네는 제도(濟度)와 보시(布施)의 실천',
    explanation:
      '승려였던 한용운의 사상을 바탕으로 보면(지도서 p.38), 나룻배가 흙발을 안고 물을 건네는 행위는 고통받는 중생을 극락으로 이끄는 불교의 제도·보시 윤리와 맞닿습니다.',
  },
];

export const METAPHOR_PRESETS = [
  {
    label: '나와 가족',
    target: '가족과 나',
    selfMetaphor: '돌아올 등불',
    youMetaphor: '지친 발걸음',
    similarity: '하루 끝에 언제든 쉬어 갈 자리를 지켜 주기 때문',
  },
  {
    label: '나와 친구',
    target: '단짝 친구와 나',
    selfMetaphor: '긴 문장의 쉼표',
    youMetaphor: '숨 가쁜 하루',
    similarity: '바쁜 학교생활 속에서 잠깐의 숨 돌릴 틈을 주기 때문',
  },
  {
    label: '나와 꿈',
    target: '나의 꿈과 나',
    selfMetaphor: '묵묵한 나침반',
    youMetaphor: '안개 낀 항로',
    similarity: '흔들려도 방향을 잃지 않고 끝내 나아가게 해 주기 때문',
  },
  {
    label: '나와 반려동물',
    target: '반려동물과 나',
    selfMetaphor: '현관 앞 작은 매트',
    youMetaphor: '반가운 발소리',
    similarity: '언제 돌아와도 변함없이 같은 자리에서 반겨 주기 때문',
  },
];

export const DEBRIEFING_QUESTIONS = [
  {
    badge: '교과서 활동 6-(2) · 작품 비교',
    question:
      '교과서에서 함께 배운 장석남 「배를 매며」의 ‘배’와 한용운 「나룻배와 행인」의 ‘배’는 모두 ‘사랑’과 관련된 상징이지만, 그 의미와 화자의 태도는 어떻게 다를까요?',
    guide:
      '힌트: 「배를 매며」의 배는 다가와 설렘을 주는 사랑의 대상인 반면, 「나룻배와 행인」의 배는 희생·인내하며 기다리는 화자 자신입니다.',
  },
  {
    badge: '상징의 다의성 · 친구와 비교',
    question:
      '나는 결과 카드에 세 가지 시선(연인 · 1926년 조국 · 불교의 중생/부처) 중 무엇을 인장으로 찍었나요? 다른 시선을 고른 친구와 서로의 근거를 나눠 봅시다.',
    guide: '비유가 1:1 대응이라면, 상징은 여러 의미로 열려 있는 다의성을 지닙니다.',
  },
  {
    badge: '어조의 효과 · 경어체',
    question:
      '어조 조율기에서 원망체·건조체로 바꾸었을 때와 원문 경어체(‘-ㅂ니다’, ‘-가십니다그려’, ‘-아요’)로 읽었을 때, 화자의 마음은 어떻게 달라졌나요?',
    guide: '경어체가 담담하고 의지적·희망적 어조와 무조건적 존경을 만들어 냄을 확인해 봅시다.',
  },
  {
    badge: '서정적 표현 공유 · 교과서 활동 5',
    question:
      '저장한 나만의 2행 은유 카드(‘나는 ___ / 당신은 ___’)를 친구들과 공유하고, 어떤 비유와 유사성이 가장 참신하거나 공감이 갔는지 이야기를 나눠 봅시다.',
    guide: '교실 패들릿이나 학급 게시판에 PNG 카드를 올려 서로 감상 댓글을 달아 보세요.',
  },
];
