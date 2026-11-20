import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { SYMBOLIC_LENSES } from '../data/poemData';
import { LensId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface TripleLensViewProps {
  activeLens: LensId;
  lensesViewed: LensId[];
  selectedLens: LensId | null;
  onSelectActiveLens: (lens: LensId) => void;
  onCommitPersonalLens: (lens: LensId) => void;
  onProceed: () => void;
}

export const TripleLensView: React.FC<TripleLensViewProps> = ({
  activeLens,
  lensesViewed,
  selectedLens,
  onSelectActiveLens,
  onCommitPersonalLens,
  onProceed,
}) => {
  const current = SYMBOLIC_LENSES.find((l) => l.id === activeLens) ?? SYMBOLIC_LENSES[0];
  const allViewed = SYMBOLIC_LENSES.every((l) => lensesViewed.includes(l.id));

  return (
    <section className="folio-card lens-panel" aria-label="3중 상징 렌즈">
      <div className="folio-header">
        <div className="folio-kicker">
          <span className="seal-mini is-note">鏡</span>
          <span>3중 상징 렌즈 · 해석 개방(비채점)</span>
        </div>
        <span className="folio-step-note">열람 {lensesViewed.length}/3</span>
      </div>

      <p className="folio-guide">
        같은 시 위에 세 장의 한지 렌즈를 모두 겹쳐 읽어 보세요. <strong>상징</strong>은 하나의 정답이 아니라 여러 의미로 열려 있습니다.
      </p>

      <div className="lens-tabs" role="tablist" aria-label="상징 렌즈 선택">
        {SYMBOLIC_LENSES.map((lens) => {
          const viewed = lensesViewed.includes(lens.id);
          return (
            <button
              key={lens.id}
              type="button"
              role="tab"
              aria-selected={activeLens === lens.id}
              className={`lens-tab ${activeLens === lens.id ? 'is-active' : ''}`}
              style={
                activeLens === lens.id
                  ? { borderBottomColor: lens.accentColor, color: lens.accentColor }
                  : undefined
              }
              onClick={() => {
                soundEngine.playToneSwitch('honorific');
                onSelectActiveLens(lens.id);
              }}
            >
              <span>{lens.title}</span>
              {viewed ? <Check size={14} /> : null}
            </button>
          );
        })}
      </div>

      <div className="lens-card-body">
        <div className="lens-art-wrap">
          <img
            src={current.asset}
            alt={`${current.title} 수묵담채 한지 일러스트`}
            className="lens-art-img"
          />
          <span className="lens-art-caption" style={{ background: current.accentColor }}>
            {current.badge}
          </span>
        </div>

        <div className="lens-meta">
          <h3 style={{ color: current.accentColor }}>{current.subtitle}</h3>
          <dl className="symbol-map">
            <div>
              <dt>당신(행인)</dt>
              <dd>{current.meaningYou}</dd>
            </div>
            <div>
              <dt>물 · 급한 여울</dt>
              <dd>{current.meaningWater}</dd>
            </div>
            <div>
              <dt>나룻배의 행위</dt>
              <dd>{current.meaningBoat}</dd>
            </div>
          </dl>
          <p className="lens-explanation">{current.explanation}</p>
        </div>
      </div>

      {allViewed ? (
        <div className="personal-lens-picker">
          <p className="marginalia-line">
            <span className="mark-note">◈ 비유 vs 상징</span> 비유는 원관념과 보조관념이 1:1로 대응하지만, 상징은 이처럼 암시적·다의적 의미를 지닙니다.
          </p>

          <p className="picker-question">
            <Sparkles size={15} className="picker-icon" />
            <span>
              오늘 나에게 가장 깊게 와닿는 <strong>‘당신’의 얼굴</strong>을 하나 골라 결과 카드 인장으로 남겨 보세요.
            </span>
          </p>

          <div className="personal-lens-buttons">
            {SYMBOLIC_LENSES.map((lens) => (
              <button
                key={lens.id}
                type="button"
                className={`folio-choice ${selectedLens === lens.id ? 'is-selected-lens' : ''}`}
                onClick={() => {
                  soundEngine.playStamp();
                  onCommitPersonalLens(lens.id);
                }}
              >
                {selectedLens === lens.id ? '✓ ' : ''}
                {lens.title}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ink-btn full-width"
            disabled={!selectedLens}
            onClick={() => {
              soundEngine.playSoftTap();
              onProceed();
            }}
          >
            <span>내 시선 인장 담고 ‘나만의 2행 은유 카드’ 만들기</span>
          </button>
        </div>
      ) : (
        <p className="tone-nudge">
          세 장의 렌즈(연인 · 조국 · 불교)를 모두 눌러 겹쳐 읽으면 다음 단계가 열립니다.
        </p>
      )}
    </section>
  );
};
