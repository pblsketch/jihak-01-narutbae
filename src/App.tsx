import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Footprints, Sparkles } from 'lucide-react';
import { FerryDiorama } from './three/FerryDiorama';
import { TopHud } from './components/TopHud';
import { HoldInteraction } from './components/HoldInteraction';
import { ToneTuner } from './components/ToneTuner';
import { ContrastScale } from './components/ContrastScale';
import { TripleLensView } from './components/TripleLensView';
import { MetaphorCardEditor } from './components/MetaphorCardEditor';
import { ResultDebriefView } from './components/ResultDebriefView';
import { TeacherDrawer } from './components/TeacherDrawer';
import { ObservationModal, PoemModal } from './components/Modals';
import { OBSERVATION_NOTES, ObservationNote, POEM_STANZAS } from './data/poemData';
import { loadProgress, resetProgress, saveProgress } from './storage/progressStorage';
import { soundEngine } from './audio/soundEngine';
import { ContrastSide, GameProgress, LensId, SceneId, SceneVisualState, ToneMode } from './types/game';

export const App: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [teacherMode, setTeacherMode] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [poemOpen, setPoemOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [focusedObs, setFocusedObs] = useState<ObservationNote | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [stanza1Match, setStanza1Match] = useState<{ na: boolean; dangsin: boolean }>({
    na: false,
    dangsin: false,
  });
  const [s2Step, setS2Step] = useState<'mud' | 'hold' | 'tone' | 'contrast' | 'done'>('mud');
  const [s2Hold, setS2Hold] = useState(0);
  const [s3Step, setS3Step] = useState<'hold' | 'tone' | 'contrast' | 'done'>('hold');
  const [s3Hold, setS3Hold] = useState(0);
  const [s4Step, setS4Step] = useState<'turn' | 'tone' | 'contrast' | 'done'>('turn');
  const [s5Restore, setS5Restore] = useState<{ line1: string; line2: string; period: boolean }>({
    line1: '',
    line2: '',
    period: false,
  });
  const [s5Feedback, setS5Feedback] = useState<string | null>(null);
  const [s5Done, setS5Done] = useState(false);

  const [isHolding, setIsHolding] = useState(false);
  const [boatTilt, setBoatTilt] = useState(0);
  const [tonePreview, setTonePreview] = useState<ToneMode | null>(null);
  const [activeLens, setActiveLens] = useState<LensId>('lover');

  const logoTapsRef = useRef<number[]>([]);

  useEffect(() => {
    saveProgress(progress);
    soundEngine.setMuted(progress.muted);
  }, [progress]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTeacherMode(true);
        setTeacherOpen((prev) => !prev);
      } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setProgress((prev) => ({ ...prev, muted: !prev.muted }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const triggerWobble = useCallback(() => {
    setBoatTilt(1);
    window.setTimeout(() => setBoatTilt(-0.7), 180);
    window.setTimeout(() => setBoatTilt(0), 420);
  }, []);

  const goScene = useCallback((next: SceneId) => {
    setTonePreview(null);
    setIsHolding(false);
    setBoatTilt(0);
    setProgress((prev) => {
      const updated = { ...prev, currentScene: next };
      if (next === 'lenses' && !prev.lensesViewed.includes('lover')) {
        updated.lensesViewed = [...prev.lensesViewed, 'lover'];
      }
      if (next === 'result' && !prev.completedAt) {
        updated.completedAt = new Date().toISOString();
      }
      return updated;
    });
    if (next === 'stanza2') {
      setS2Step('mud');
      setS2Hold(0);
    } else if (next === 'stanza3') {
      setS3Step('hold');
      setS3Hold(0);
    } else if (next === 'stanza4') {
      setS4Step('turn');
    } else if (next === 'stanza5') {
      setS5Restore({ line1: '', line2: '', period: false });
      setS5Feedback(null);
      setS5Done(false);
    } else if (next === 'lenses') {
      setActiveLens('lover');
    }
  }, []);

  const handleTitleLogoTap = () => {
    const now = Date.now();
    logoTapsRef.current = [...logoTapsRef.current.filter((t) => now - t < 2500), now];
    if (logoTapsRef.current.length >= 5) {
      logoTapsRef.current = [];
      setTeacherMode(true);
      setTeacherOpen(true);
      showToast('교사 모드가 열렸습니다.');
    }
  };

  const handleDiscoverObservation = useCallback((obs: ObservationNote) => {
    soundEngine.playSoftTap();
    setFocusedObs(obs);
    setObsOpen(true);
    setProgress((prev) => {
      if (prev.observationsFound.includes(obs.id)) return prev;
      return {
        ...prev,
        observationsFound: [...prev.observationsFound, obs.id],
      };
    });
  }, []);

  const handlePlaceContrast = useCallback((itemId: string, side: ContrastSide) => {
    setProgress((prev) => ({
      ...prev,
      contrastPlaced: { ...prev.contrastPlaced, [itemId]: side },
    }));
  }, []);

  const handleRestart = useCallback(() => {
    const fresh = resetProgress();
    setProgress(fresh);
    setStanza1Match({ na: false, dangsin: false });
    setS2Step('mud');
    setS2Hold(0);
    setS3Step('hold');
    setS3Hold(0);
    setS4Step('turn');
    setS5Restore({ line1: '', line2: '', period: false });
    setS5Done(false);
    setTonePreview(null);
    showToast('나루터의 시간을 처음으로 되돌렸습니다.');
  }, [showToast]);

  const visualState = useMemo<SceneVisualState>(() => {
    const sc = progress.currentScene;
    let waterDepth: SceneVisualState['waterDepth'] = 'calm';
    let timeOfDay: SceneVisualState['timeOfDay'] = 'morning';
    let weather: SceneVisualState['weather'] = 'mist';
    let holdProgress = 0;
    let dawnReveal = 0;
    let passerbyState: SceneVisualState['passerbyState'] = 'distant';

    if (sc === 'title') {
      passerbyState = 'gone';
    } else if (sc === 'intro') {
      passerbyState = 'distant';
    } else if (sc === 'stanza1') {
      passerbyState = stanza1Match.dangsin ? 'boarding' : 'distant';
    } else if (sc === 'stanza2') {
      timeOfDay = 'overcast';
      weather = 'wind';
      holdProgress = s2Hold;
      passerbyState = s2Step === 'mud' ? 'boarding' : 'onboard';
      waterDepth = s2Hold > 0.65 ? 'rapids' : s2Hold > 0.32 ? 'deep' : 'shallow';
    } else if (sc === 'stanza3') {
      timeOfDay = 'night';
      weather = 'snowRain';
      holdProgress = s3Hold;
      passerbyState = s3Step === 'hold' ? 'gone' : 'departing';
      waterDepth = 'deep';
    } else if (sc === 'stanza4') {
      timeOfDay = 'dawn';
      weather = s4Step === 'turn' ? 'snowRain' : 'mist';
      dawnReveal = s4Step === 'turn' ? 0.08 : 1;
      passerbyState = 'gone';
      waterDepth = 'calm';
    } else if (sc === 'stanza5' || sc === 'lenses' || sc === 'metaphor' || sc === 'result') {
      timeOfDay = 'clearMorning';
      weather = 'clear';
      passerbyState = sc === 'stanza5' ? 'distant' : 'gone';
      waterDepth = 'calm';
    }

    return {
      scene: sc,
      grainLevel: progress.grainLevel,
      tonePreview,
      holdProgress,
      isHolding,
      waterDepth,
      timeOfDay,
      weather,
      dawnReveal,
      activeLens: sc === 'lenses' ? activeLens : null,
      boatTilt,
      passerbyState,
    };
  }, [
    progress.currentScene,
    progress.grainLevel,
    stanza1Match.dangsin,
    s2Step,
    s2Hold,
    s3Step,
    s3Hold,
    s4Step,
    tonePreview,
    isHolding,
    activeLens,
    boatTilt,
  ]);

  const hasSavedProgress =
    progress.currentScene !== 'title' || progress.grainLevel > 0 || progress.stanzaCompleted.stanza1;

  const verifyStanza5 = () => {
    const okLine1 = s5Restore.line1 === '나는 나룻배';
    const okLine2 = s5Restore.line2 === '당신은 행인';
    if (okLine1 && okLine2 && s5Restore.period) {
      soundEngine.playGrainUnlock();
      setS5Done(true);
      setS5Feedback(null);
      setProgress((prev) => ({
        ...prev,
        stanzaCompleted: { ...prev.stanzaCompleted, stanza5: true },
      }));
      return;
    }
    soundEngine.playSoftTap();
    if (!okLine1 || !okLine2) {
      setS5Feedback('1연의 첫 두 행을 떠올려 보세요. 화자(‘나는 나룻배’)가 먼저, 청자(‘당신은 행인’)가 뒤에 옵니다.');
    } else {
      setS5Feedback('거의 다 왔습니다! 1연과 달리 5연 끝에는 완결을 뜻하는 마침표(.)가 찍혀 있습니다.');
    }
  };

  return (
    <div className={`app-shell scene-${progress.currentScene}`}>
      <FerryDiorama
        visual={visualState}
        observationsFound={progress.observationsFound}
        onDiscoverObservation={handleDiscoverObservation}
        showAllPins={teacherMode && progress.currentScene === 'stanza5'}
      />

      <TopHud
        currentScene={progress.currentScene}
        grainLevel={progress.grainLevel}
        observationsCount={progress.observationsFound.length}
        muted={progress.muted}
        teacherMode={teacherMode}
        onToggleMute={() => setProgress((prev) => ({ ...prev, muted: !prev.muted }))}
        onOpenPoem={() => setPoemOpen(true)}
        onOpenObservations={() => {
          setFocusedObs(null);
          setObsOpen(true);
        }}
        onOpenTeacher={() => setTeacherOpen(true)}
      />

      {toast ? (
        <div className="toast-banner" role="status">
          {toast}
        </div>
      ) : null}

      <main className={`stage-layer ${progress.currentScene === 'result' ? 'is-wide' : ''}`}>
        {/* 0. 풀스크린 서정 시네마틱 타이틀 (답답한 흰 모달 박스 제거) */}
        {progress.currentScene === 'title' ? (
          <section className="title-stage">
            <div className="title-hero-block">
              <div className="title-eyebrow">지학사 2022 개정 공통국어1 · 서정 갈래의 이해</div>
              <div className="title-lockup" onClick={handleTitleLogoTap}>
                <h1 className="game-title">
                  낡아가는 배
                  <span className="game-subtitle-line">나루터의 시간</span>
                </h1>
                <span className="title-seal-vertical" aria-hidden="true">
                  一九<br />二六
                </span>
              </div>
              <p className="title-work-ref">한용운, 「나룻배와 행인」 (『님의 침묵』, 1926)</p>
              <p className="title-desc">
                흙발을 피하지 않고 받아 안으며, 거친 여울과 밤낮의 눈비를 견디는 2.5D 나루터 서정 체험
              </p>

              <div className="title-actions">
                <button
                  type="button"
                  className="title-start-btn"
                  onClick={() => {
                    soundEngine.startAmbientWater();
                    soundEngine.playGrainUnlock();
                    if (hasSavedProgress) {
                      const fresh = resetProgress();
                      setProgress({ ...fresh, currentScene: 'intro' });
                    } else {
                      goScene('intro');
                    }
                  }}
                >
                  <span>나루터에 오르기</span>
                  <ArrowRight size={18} />
                </button>

                {hasSavedProgress && progress.currentScene === 'title' ? (
                  <button
                    type="button"
                    className="title-continue-btn"
                    onClick={() => {
                      soundEngine.startAmbientWater();
                      goScene('stanza1');
                    }}
                  >
                    <span>이전 기록 이어서 보기</span>
                  </button>
                ) : null}
              </div>

              <div className="title-meta-foot">예상 소요 20분 · 스마트폰·태블릿·크롬북 지원</div>
            </div>
          </section>
        ) : null}

        {/* 도입: 1926년 시집 서문(序) */}
        {progress.currentScene === 'intro' ? (
          <section className="side-sheet">
            <div className="folio-card">
              <div className="folio-header">
                <div className="folio-kicker">
                  <span className="seal-mini is-stage">序</span>
                  <span>1926년 나루터에 오르기 전에</span>
                </div>
              </div>

              <h2 className="folio-title">낡아감은 실패가 아니라, 헌신의 결입니다</h2>
              <p className="folio-guide">
                이 나루터에는 체력바도 게임오버도 없습니다. 행인의 흙발과 급한 여울, 밤낮의 눈비를 받아 안을수록 배의 나무판이 낡아가며 시의 결이 완성됩니다.
              </p>

              <div className="legend-list">
                <div className="legend-row">
                  <span className="seal-mini is-original">原</span>
                  <div>
                    <strong>교과서 원문</strong>
                    <p>붉은 인장이 찍힌 글은 교과서 p.19 한용운의 원문 그대로입니다.</p>
                  </div>
                </div>
                <div className="legend-row">
                  <span className="seal-mini is-note">解</span>
                  <div>
                    <strong>풀이 · 서정 개념</strong>
                    <p>서첩 아래 각주(◈)에는 시어 해설과 문학 개념이 담깁니다.</p>
                  </div>
                </div>
                <div className="legend-row">
                  <span className="seal-mini is-stage">調</span>
                  <div>
                    <strong>게임 연출 · 어조 실험</strong>
                    <p>청록 표식(◇)은 체험 안내와 어조 비교용 변형 문장(원문 아님)입니다.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="ink-btn full-width"
                onClick={() => {
                  soundEngine.startAmbientWater();
                  soundEngine.playSoftTap();
                  goScene('stanza1');
                }}
              >
                <span>1연 · 나룻배의 시선으로 내려앉기</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        ) : null}

        {/* 1연: 나는 나룻배 / 당신은 행인 */}
        {progress.currentScene === 'stanza1' ? (
          <section className="side-sheet">
            <div className="folio-card">
              <div className="folio-header">
                <div className="folio-kicker">
                  <span className="seal-mini is-original">原</span>
                  <span>제1연 · 은유 설정</span>
                </div>
                <span className="folio-step-note">시범 단계</span>
              </div>

              <div className="poem-verse">
                <p>{stanza1Match.na ? '나는 나룻배' : '나는 [ ? ]'}</p>
                <p>{stanza1Match.dangsin ? '당신은 행인' : '당신은 [ ? ]'}</p>
              </div>

              <p className="folio-guide">
                안개 낀 1926년 강변 나루터입니다. 두 대상을 각각 눌러 ‘나’와 ‘당신’의 관계를 은유(A는 B)로 맺어 보세요.
              </p>

              <div className="pair-buttons">
                <button
                  type="button"
                  className={`folio-choice ${stanza1Match.na ? 'is-selected-self' : ''}`}
                  onClick={() => {
                    soundEngine.playSoftTap();
                    setStanza1Match((prev) => ({ ...prev, na: true }));
                  }}
                >
                  {stanza1Match.na ? '✓ ' : ''}나 = 나룻배 (기다리며 건네는 존재)
                </button>
                <button
                  type="button"
                  className={`folio-choice ${stanza1Match.dangsin ? 'is-selected-you' : ''}`}
                  onClick={() => {
                    soundEngine.playSoftTap();
                    setStanza1Match((prev) => ({ ...prev, dangsin: true }));
                  }}
                >
                  {stanza1Match.dangsin ? '✓ ' : ''}당신 = 행인 (강을 건너가는 길손)
                </button>
              </div>

              {stanza1Match.na && stanza1Match.dangsin ? (
                <>
                  <p className="marginalia-line is-confirmed">
                    <span className="mark-note">◈ 풀이</span> 화자는 자신을 <strong>나룻배</strong>에, 시적 대상을 <strong>행인</strong>에 빗대어(은유) 앞으로 펼쳐질 헌신과 기다림의 관계를 엽니다.
                  </p>
                  <button
                    type="button"
                    className="ink-btn full-width"
                    onClick={() => {
                      soundEngine.playGrainUnlock();
                      setProgress((prev) => ({
                        ...prev,
                        stanzaCompleted: { ...prev.stanzaCompleted, stanza1: true },
                      }));
                      goScene('stanza2');
                    }}
                  >
                    <span>2연 · 흙발로 오르는 당신 맞이하기</span>
                    <ArrowRight size={17} />
                  </button>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 2연 */}
        {progress.currentScene === 'stanza2' ? (
          <section className="side-sheet">
            {s2Step === 'mud' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-original">原</span>
                    <span>제2연 · 희생과 헌신</span>
                  </div>
                </div>
                <div className="poem-verse">
                  <p>당신은 흙발로 나를 짓밟습니다.</p>
                </div>
                <p className="folio-guide">
                  젖은 강변 흙을 묻힌 행인의 발이 배 바닥으로 내딛어집니다. 피하지 않고, 배가 되어 온몸으로 받아 안아 보세요.
                </p>
                <button
                  type="button"
                  className="ink-btn full-width"
                  onClick={() => {
                    soundEngine.playGrainUnlock();
                    setProgress((prev) => ({ ...prev, grainLevel: Math.max(prev.grainLevel, 1) }));
                    setS2Step('hold');
                    showToast('헌신의 결 1/4 — 흙발 자국이 배 바닥에 새겨졌습니다.');
                  }}
                >
                  <Footprints size={17} />
                  <span>흙발을 받아 안기 (헌신의 결 1 각인)</span>
                </button>
              </div>
            ) : null}

            {s2Step === 'hold' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-original">原</span>
                    <span>제2연 · 여울 건너기</span>
                  </div>
                </div>
                <div className="poem-verse">
                  <p>나는 당신을 안고 물을 건너갑니다.</p>
                  <p>나는 당신을 안으면 깊으나 얕으나 급한 여울이나 건너갑니다.</p>
                </div>
                <HoldInteraction
                  label="안고 버티기 (길게 누르기 / Space)"
                  subLabel="타이머·게임오버 없음 · 손을 떼도 이어서 건넙니다"
                  stages={['얕은 물', '깊은 물', '급한 여울']}
                  releaseMessage="물살이 거세어 배가 흔들렸지만, 당신을 안고 있기에 다시 중심을 잡습니다."
                  durationMs={4200}
                  progress={s2Hold}
                  onProgressChange={(next, holding) => {
                    setS2Hold(next);
                    setIsHolding(holding);
                  }}
                  onReleaseWobble={triggerWobble}
                  onComplete={() => {
                    soundEngine.playGrainUnlock();
                    setProgress((prev) => ({ ...prev, grainLevel: Math.max(prev.grainLevel, 2) }));
                    setS2Step('tone');
                    showToast('헌신의 결 2/4 — 급한 여울을 안고 건너 나무판이 젖어 들었습니다.');
                  }}
                />
              </div>
            ) : null}

            {s2Step === 'tone' ? (
              <ToneTuner
                tunerId="s2"
                completed={progress.toneCompleted.s2}
                onPreviewTone={setTonePreview}
                onComplete={() => {
                  setProgress((prev) => ({
                    ...prev,
                    toneCompleted: { ...prev.toneCompleted, s2: true },
                  }));
                  setTonePreview(null);
                  setS2Step('contrast');
                }}
              />
            ) : null}

            {s2Step === 'contrast' ? (
              <ContrastScale
                stanza={2}
                placed={progress.contrastPlaced}
                onPlace={handlePlaceContrast}
                onComplete={() => {
                  setProgress((prev) => ({
                    ...prev,
                    stanzaCompleted: { ...prev.stanzaCompleted, stanza2: true },
                  }));
                  setS2Step('done');
                }}
              />
            ) : null}

            {s2Step === 'done' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-original">原</span>
                    <span>제2연 해금 완료</span>
                  </div>
                </div>
                <div className="poem-verse">
                  {POEM_STANZAS[1].lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="marginalia-line is-confirmed">
                  <span className="mark-note">◈ 풀이</span> ‘깊으나 얕으나 급한 여울’은 시련과 고난을 뜻합니다. 화자는 흙발로 짓밟히면서도 당신을 안고 어떤 물이든 건너며 희생을 실천합니다.
                </p>
                <button
                  type="button"
                  className="ink-btn full-width"
                  onClick={() => {
                    soundEngine.playSoftTap();
                    goScene('stanza3');
                  }}
                >
                  <span>3연 · 바람과 눈비 속 기다림으로</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 3연 */}
        {progress.currentScene === 'stanza3' ? (
          <section className="side-sheet">
            {s3Step === 'hold' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-original">原</span>
                    <span>제3연 · 밤에서 낮까지</span>
                  </div>
                </div>
                <div className="poem-verse">
                  <p>
                    만일 당신이 아니 오시면 나는 바람을 쐬고 눈비를 맞으며 밤에서 낮까지 당신을 기다리고 있습니다.
                  </p>
                </div>
                <p className="marginalia-line">
                  <span className="mark-note">◈ 풀이</span> ‘만일 ~ 아니 오시면’은 상황의 가정, ‘밤에서 낮까지’는 언제나·항상·영원히 이어지는 기다림을 뜻합니다.
                </p>
                <HoldInteraction
                  label="눈비를 맞으며 기다리기 (길게 누르기 / Space)"
                  subLabel="밤에서 새벽, 낮으로 흐르는 기다림의 시간을 버텨 보세요"
                  stages={['깊은 밤 · 눈보라', '새벽 안개', '차가운 낮']}
                  releaseMessage="눈비가 차갑게 들이치지만, 나룻배는 나루터를 떠나지 않습니다."
                  durationMs={4500}
                  progress={s3Hold}
                  onProgressChange={(next, holding) => {
                    setS3Hold(next);
                    setIsHolding(holding);
                  }}
                  onReleaseWobble={triggerWobble}
                  onComplete={() => {
                    soundEngine.playGrainUnlock();
                    setProgress((prev) => ({ ...prev, grainLevel: Math.max(prev.grainLevel, 3) }));
                    setS3Step('tone');
                    showToast('헌신의 결 3/4 — 밤낮 눈비에 나무판의 결이 깊어졌습니다.');
                  }}
                />
              </div>
            ) : null}

            {s3Step === 'tone' ? (
              <ToneTuner
                tunerId="s3"
                completed={progress.toneCompleted.s3}
                onPreviewTone={setTonePreview}
                onComplete={() => {
                  setProgress((prev) => ({
                    ...prev,
                    toneCompleted: { ...prev.toneCompleted, s3: true },
                  }));
                  setTonePreview(null);
                  setS3Step('contrast');
                }}
              />
            ) : null}

            {s3Step === 'contrast' ? (
              <ContrastScale
                stanza={3}
                placed={progress.contrastPlaced}
                onPlace={handlePlaceContrast}
                onComplete={() => {
                  setProgress((prev) => ({
                    ...prev,
                    stanzaCompleted: { ...prev.stanzaCompleted, stanza3: true },
                  }));
                  setS3Step('done');
                }}
              />
            ) : null}

            {s3Step === 'done' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-original">原</span>
                    <span>제3연 해금 완료</span>
                  </div>
                </div>
                <div className="poem-verse">
                  {POEM_STANZAS[2].lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="marginalia-line is-confirmed">
                  <span className="mark-note">◈ 풀이</span> 물만 건너면 뒤돌아보지도 않고 떠나는 ‘당신’의 무정한 태도와, 밤낮 눈비를 맞으며 기다리는 ‘나’의 헌신이 선명한 대조를 이룹니다.
                </p>
                <button
                  type="button"
                  className="ink-btn full-width"
                  onClick={() => {
                    soundEngine.playSoftTap();
                    goScene('stanza4');
                  }}
                >
                  <span>4연 · 어둠을 가르는 한 마디로</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 4연 */}
        {progress.currentScene === 'stanza4' ? (
          <section className="side-sheet">
            {s4Step === 'turn' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-stage">轉</span>
                    <span>시상의 전환점</span>
                  </div>
                </div>
                <h2 className="folio-title">무정한 기다림 끝에, 시의 방향이 바뀝니다</h2>
                <p className="folio-guide">
                  돌아보지 않고 떠나가는 뒷모습 앞에서도 화자는 체념하지 않습니다. 어둠 속 강물 위로 떠오른 전환의 시어를 눌러 새벽을 열어 보세요.
                </p>
                <button
                  type="button"
                  className="turn-word-btn"
                  onClick={() => {
                    soundEngine.playGrainUnlock();
                    setS4Step('tone');
                    showToast('‘그러나’ — 시상이 체념에서 확신과 희망으로 전환됩니다.');
                  }}
                >
                  <Sparkles size={19} />
                  <span>그러나</span>
                </button>
              </div>
            ) : null}

            {s4Step === 'tone' ? (
              <ToneTuner
                tunerId="s4"
                completed={progress.toneCompleted.s4}
                onPreviewTone={setTonePreview}
                onComplete={() => {
                  setProgress((prev) => ({
                    ...prev,
                    toneCompleted: { ...prev.toneCompleted, s4: true },
                    grainLevel: 4,
                  }));
                  setTonePreview(null);
                  setS4Step('contrast');
                  showToast('헌신의 결 4/4 완성 — 날마다 날마다 낡아가는 세월의 빛이 스몄습니다.');
                }}
              />
            ) : null}

            {s4Step === 'contrast' ? (
              <ContrastScale
                stanza={4}
                placed={progress.contrastPlaced}
                onPlace={handlePlaceContrast}
                onComplete={() => {
                  setProgress((prev) => ({
                    ...prev,
                    stanzaCompleted: { ...prev.stanzaCompleted, stanza4: true },
                    grainLevel: 4,
                  }));
                  setS4Step('done');
                }}
              />
            ) : null}

            {s4Step === 'done' ? (
              <div className="folio-card">
                <div className="folio-header">
                  <div className="folio-kicker">
                    <span className="seal-mini is-original">原</span>
                    <span>제4연 해금 · 헌신의 결 4/4 완성</span>
                  </div>
                </div>
                <div className="poem-verse">
                  {POEM_STANZAS[3].lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="marginalia-line is-confirmed">
                  <span className="mark-note">◈ 거자필반(去者必返)</span> 떠난 사람은 반드시 돌아온다는 믿음 아래, ‘날마다 날마다 낡아감’은 소멸이 아니라 변함없는 사랑의 증거가 됩니다.
                </p>
                <button
                  type="button"
                  className="ink-btn full-width"
                  onClick={() => {
                    soundEngine.playSoftTap();
                    goScene('stanza5');
                  }}
                >
                  <span>5연 · 1연의 나루터 구도로 회귀하기</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 5연: 수미상관 */}
        {progress.currentScene === 'stanza5' ? (
          <section className="side-sheet">
            <div className="folio-card">
              <div className="folio-header">
                <div className="folio-kicker">
                  <span className="seal-mini is-original">原</span>
                  <span>제5연 · 수미상관 복원</span>
                </div>
                <span className="folio-step-note is-indep">기억 인출</span>
              </div>

              <p className="folio-guide">
                카메라가 <strong>1연과 완전히 같은 나루터 구도</strong>로 돌아왔습니다. 다만 배에는 4단계 헌신의 결이 깊게 새겨져 있습니다. 5연의 마지막 두 행과 <strong>마침표</strong>를 직접 복원해 시를 완성해 보세요.
              </p>

              <div className="poem-verse">
                <p>{s5Restore.line1 || '[ 1행 선택 ]'}</p>
                <p>
                  {s5Restore.line2 || '[ 2행 선택 ]'}
                  {s5Restore.period ? <strong className="period-highlight">.</strong> : ''}
                </p>
              </div>

              {!s5Done ? (
                <>
                  <div className="restore-bank">
                    <div className="restore-row">
                      <span className="restore-label">1행</span>
                      <div className="restore-choices">
                        {['나는 나룻배', '당신은 행인'].map((opt) => (
                          <button
                            key={`l1-${opt}`}
                            type="button"
                            className={`folio-choice ${s5Restore.line1 === opt ? 'is-selected-self' : ''}`}
                            onClick={() => {
                              soundEngine.playSoftTap();
                              setS5Feedback(null);
                              setS5Restore((prev) => ({ ...prev, line1: opt }));
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="restore-row">
                      <span className="restore-label">2행</span>
                      <div className="restore-choices">
                        {['나는 나룻배', '당신은 행인'].map((opt) => (
                          <button
                            key={`l2-${opt}`}
                            type="button"
                            className={`folio-choice ${s5Restore.line2 === opt ? 'is-selected-you' : ''}`}
                            onClick={() => {
                              soundEngine.playSoftTap();
                              setS5Feedback(null);
                              setS5Restore((prev) => ({ ...prev, line2: opt }));
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="restore-row">
                      <span className="restore-label">종결</span>
                      <button
                        type="button"
                        className={`folio-choice full-flex ${s5Restore.period ? 'is-selected-lens' : ''}`}
                        onClick={() => {
                          soundEngine.playStamp();
                          setS5Feedback(null);
                          setS5Restore((prev) => ({ ...prev, period: !prev.period }));
                        }}
                      >
                        {s5Restore.period ? '✓ 마침표(.) 찍힘' : '마지막 마침표(.) 찍기'}
                      </button>
                    </div>
                  </div>

                  {s5Feedback ? (
                    <p className="marginalia-line is-warn">
                      <span className="mark-original">▲ 부분 피드백</span> {s5Feedback}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="ink-btn full-width"
                    disabled={!s5Restore.line1 || !s5Restore.line2}
                    onClick={verifyStanza5}
                  >
                    <Check size={17} />
                    <span>수미상관 5연 완성하기</span>
                  </button>
                </>
              ) : (
                <>
                  <p className="marginalia-line is-confirmed">
                    <span className="mark-note">◈ 수미상관의 효과</span> 1연과 5연을 같게 배치하여 <strong>① 주제 강조 ② 형태적 완결성과 안정감 ③ 운율 형성</strong>의 효과를 얻습니다. 1연엔 없던 마침표(.)가 5연에 찍혀 깊은 여운을 남깁니다.
                  </p>
                  <button
                    type="button"
                    className="ink-btn full-width"
                    onClick={() => {
                      soundEngine.playSoftTap();
                      goScene('lenses');
                    }}
                  >
                    <span>3중 상징 렌즈로 시 겹쳐 읽기</span>
                    <ArrowRight size={17} />
                  </button>
                </>
              )}
            </div>
          </section>
        ) : null}

        {/* 6. 3중 상징 렌즈 */}
        {progress.currentScene === 'lenses' ? (
          <section className="side-sheet is-lens">
            <TripleLensView
              activeLens={activeLens}
              lensesViewed={progress.lensesViewed}
              selectedLens={progress.selectedLens}
              onSelectActiveLens={(lens) => {
                setActiveLens(lens);
                setProgress((prev) => ({
                  ...prev,
                  lensesViewed: prev.lensesViewed.includes(lens)
                    ? prev.lensesViewed
                    : [...prev.lensesViewed, lens],
                }));
              }}
              onCommitPersonalLens={(lens) => {
                setActiveLens(lens);
                setProgress((prev) => ({ ...prev, selectedLens: lens }));
                showToast('결과 카드에 담을 내 시선 인장을 선택했습니다.');
              }}
              onProceed={() => goScene('metaphor')}
            />
          </section>
        ) : null}

        {/* 7. 나만의 2행 은유 카드 */}
        {progress.currentScene === 'metaphor' ? (
          <section className="side-sheet is-lens">
            <MetaphorCardEditor
              card={progress.metaphorCard}
              onChange={(nextCard) => setProgress((prev) => ({ ...prev, metaphorCard: nextCard }))}
              onFinish={() => goScene('result')}
            />
          </section>
        ) : null}

        {/* 8. 결과 화면 */}
        {progress.currentScene === 'result' ? (
          <ResultDebriefView
            progress={progress}
            onOpenPoem={() => setPoemOpen(true)}
            onOpenObservations={() => {
              setFocusedObs(null);
              setObsOpen(true);
            }}
            onRestart={handleRestart}
          />
        ) : null}
      </main>

      <PoemModal open={poemOpen} onClose={() => setPoemOpen(false)} />
      <ObservationModal
        open={obsOpen}
        foundIds={progress.observationsFound}
        focusedNote={focusedObs}
        onClose={() => setObsOpen(false)}
      />
      <TeacherDrawer
        open={teacherOpen}
        currentScene={progress.currentScene}
        grainLevel={progress.grainLevel}
        onClose={() => setTeacherOpen(false)}
        onJumpScene={(scene) => goScene(scene)}
        onSetGrain={(level) => setProgress((prev) => ({ ...prev, grainLevel: level }))}
        onUnlockAllObservations={() => {
          setProgress((prev) => ({
            ...prev,
            observationsFound: OBSERVATION_NOTES.map((n) => n.id),
          }));
          showToast('1926 세밀 관찰 5종이 모두 열렸습니다.');
        }}
        onResetAll={() => {
          handleRestart();
          setTeacherOpen(false);
        }}
      />
    </div>
  );
};
