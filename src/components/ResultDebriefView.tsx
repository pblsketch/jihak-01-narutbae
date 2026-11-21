import React, { useEffect, useState } from 'react';
import { Download, RotateCcw, BookOpen, Compass, Copy, Check, Sparkles, Lock } from 'lucide-react';
import {
  ACHIEVEMENT_SEALS,
  DEBRIEFING_QUESTIONS,
  OBSERVATION_NOTES,
  SYMBOLIC_LENSES,
} from '../data/poemData';
import { GameProgress } from '../types/game';
import { downloadDataUrl, renderUnifiedCardPng } from '../utils/cardExporter';
import { soundEngine } from '../audio/soundEngine';

interface ResultDebriefViewProps {
  progress: GameProgress;
  onOpenPoem: () => void;
  onOpenObservations: () => void;
  onOpenHiddenNote: () => void;
  onRestart: () => void;
}

export const ResultDebriefView: React.FC<ResultDebriefViewProps> = ({
  progress,
  onOpenPoem,
  onOpenObservations,
  onOpenHiddenNote,
  onRestart,
}) => {
  const [pngUrl, setPngUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    renderUnifiedCardPng(progress).then((url) => {
      if (alive) setPngUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [progress]);

  const selectedLens =
    SYMBOLIC_LENSES.find((l) => l.id === progress.selectedLens) ?? SYMBOLIC_LENSES[0];
  const earnedSeals = new Set(progress.unlockedSeals ?? []);
  const allObservationsFound = progress.observationsFound.length >= OBSERVATION_NOTES.length;

  const handleCopyDebrief = async () => {
    const text = DEBRIEFING_QUESTIONS.map((q, idx) => `${idx + 1}. [${q.badge}] ${q.question}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <section className="result-wrapper" aria-label="학습 결과 및 수업 디브리핑">
      <div className="result-grid">
        <div className="folio-card result-card-col">
          <div className="folio-header">
            <div className="folio-kicker">
              <span className="seal-mini is-original">印</span>
              <span>제출용 통합 시집 카드</span>
            </div>
            <span className="folio-step-note">{selectedLens.title} 인장</span>
          </div>

          <div className="png-preview-frame">
            {pngUrl ? (
              <img
                src={pngUrl}
                alt="나만의 2행 은유와 「나룻배와 행인」 학습 요약 통합 카드"
                className="png-preview-img"
              />
            ) : (
              <div className="png-loading">한지 시집 카드를 인쇄하는 중…</div>
            )}
          </div>

          <button
            type="button"
            className="ink-btn full-width"
            disabled={!pngUrl}
            onClick={() => {
              soundEngine.playStamp();
              downloadDataUrl(pngUrl, 'narutbae-metaphor-card.png');
            }}
          >
            <Download size={18} />
            <span>제출용 통합 1장 PNG 저장</span>
          </button>

          <div className="result-sub-actions">
            <button type="button" className="paper-btn" onClick={onOpenPoem}>
              <BookOpen size={15} />
              <span>원문 전편</span>
            </button>
            <button type="button" className="paper-btn" onClick={onOpenObservations}>
              <Compass size={15} />
              <span>관찰 ({progress.observationsFound.length}/5)</span>
            </button>
            <button type="button" className="paper-btn" onClick={onRestart}>
              <RotateCcw size={15} />
              <span>처음부터</span>
            </button>
          </div>
        </div>

        <div className="result-right-stack">
          {/* 영광의 보상: 3종 감상 낙관 컬렉션 (비등급) */}
          <div className="folio-card seals-collection-card" aria-label="감상 낙관 컬렉션">
            <div className="folio-header">
              <div className="folio-kicker">
                <span className="seal-mini is-original">章</span>
                <span>감상 낙관 컬렉션</span>
              </div>
              <span className="folio-step-note">날인 {earnedSeals.size} / 3</span>
            </div>

            <div className="seal-collection-grid">
              {ACHIEVEMENT_SEALS.map((seal) => {
                const earned = earnedSeals.has(seal.id);
                return (
                  <div
                    key={seal.id}
                    className={`seal-collect-item ${earned ? 'is-earned' : 'is-unearned'}`}
                  >
                    <div className="seal-carved-emblem" aria-hidden="true">
                      {seal.sealChars}
                    </div>
                    <div className="seal-collect-info">
                      <strong>{seal.title}</strong>
                      <span>{earned ? seal.flavor : seal.condition}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 접근의 보상: 1926년 『님의 침묵』 초간본 여백 노트 */}
            <div className={`hidden-note-banner ${allObservationsFound ? 'is-unlocked' : 'is-locked'}`}>
              <div className="hidden-note-banner-copy">
                <span className="hidden-note-kicker">
                  {allObservationsFound ? '해금된 여백 해설' : `관찰 ${progress.observationsFound.length}/5`}
                </span>
                <strong>1926년 『님의 침묵』 초간본 여백 노트</strong>
                <p>
                  {allObservationsFound
                    ? '나루터 5곳의 세밀 관찰을 모두 마쳐 히든 원문 감상 해설이 열렸습니다.'
                    : '1~5연 나루터 화면의 금빛 수면 파문 5곳을 모두 발견하면 히든 해설이 해금됩니다.'}
                </p>
              </div>
              {allObservationsFound ? (
                <button
                  type="button"
                  className="ink-btn"
                  onClick={() => {
                    soundEngine.playResonanceChord(4);
                    onOpenHiddenNote();
                  }}
                >
                  <Sparkles size={16} />
                  <span>여백 노트 읽기</span>
                </button>
              ) : (
                <button type="button" className="paper-btn" onClick={onOpenObservations}>
                  <Lock size={15} />
                  <span>관찰 도감 보기</span>
                </button>
              )}
            </div>
          </div>

          {/* 수업 디브리핑 질문 4선 */}
          <div className="folio-card debrief-col">
            <div className="folio-header">
              <div className="folio-kicker">
                <span className="seal-mini is-note">問</span>
                <span>수업 디브리핑 · 함께 나눌 질문 4선</span>
              </div>
              <button type="button" className="hint-link-btn" onClick={handleCopyDebrief}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? '복사됨' : '질문 복사'}</span>
              </button>
            </div>

            <p className="folio-guide">
              게임은 여기서 마무리되지만, 진짜 감상은 친구들과 서로 다른 시선과 은유를 나눌 때 깊어집니다.
            </p>

            <ol className="debrief-list">
              {DEBRIEFING_QUESTIONS.map((item, idx) => (
                <li key={item.badge} className="debrief-item">
                  <div className="debrief-meta">
                    <span className="debrief-num">0{idx + 1}</span>
                    <span className="debrief-topic">{item.badge}</span>
                  </div>
                  <p className="debrief-q">{item.question}</p>
                  <p className="debrief-guide">{item.guide}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};
