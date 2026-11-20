import React, { useState } from 'react';
import { HelpCircle, Check } from 'lucide-react';
import { TONE_TUNERS } from '../data/poemData';
import { ToneMode } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface ToneTunerProps {
  tunerId: 's2' | 's3' | 's4';
  completed: boolean;
  onPreviewTone: (mode: ToneMode | null) => void;
  onComplete: () => void;
}

export const ToneTuner: React.FC<ToneTunerProps> = ({
  tunerId,
  completed,
  onPreviewTone,
  onComplete,
}) => {
  const config = TONE_TUNERS[tunerId];
  const [selected, setSelected] = useState<ToneMode>(completed ? 'honorific' : 'resentment');
  const [triedModes, setTriedModes] = useState<ToneMode[]>(
    completed ? ['resentment', 'honorific'] : ['resentment'],
  );
  const [showHint, setShowHint] = useState(config.scaffoldLevel === 'worked-example');

  const currentVariant = config.variants.find((v) => v.mode === selected) ?? config.variants[0];

  const handleSelect = (mode: ToneMode) => {
    setSelected(mode);
    soundEngine.playToneSwitch(mode);
    onPreviewTone(mode);
    if (!triedModes.includes(mode)) {
      setTriedModes((prev) => [...prev, mode]);
    }
  };

  const canConfirm =
    selected === 'honorific' &&
    (config.scaffoldLevel !== 'worked-example' || triedModes.length >= 2 || completed);

  return (
    <section className="folio-card tone-tuner" aria-label="어조 조율기">
      <div className="folio-header">
        <div className="folio-kicker">
          <span className="seal-mini is-stage">調</span>
          <span>어조 조율판 · 제{config.stanzaNumber}연</span>
        </div>
        {config.scaffoldLevel === 'worked-example' ? (
          <span className="folio-step-note">시범 단계</span>
        ) : config.scaffoldLevel === 'optional-hint' ? (
          <button
            type="button"
            className="hint-link-btn"
            onClick={() => setShowHint((v) => !v)}
          >
            <HelpCircle size={15} />
            <span>{showHint ? '힌트 닫기' : '힌트 보기'}</span>
          </button>
        ) : (
          <span className="folio-step-note is-indep">스스로 조율</span>
        )}
      </div>

      <p className="folio-guide">{config.prompt}</p>

      {showHint && config.hint ? (
        <p className="marginalia-line">
          <span className="mark-note">◈ 풀이</span> {config.hint}
        </p>
      ) : null}

      {/* 칠기·목재 감성의 3단 조율기 다이얼 */}
      <div className="tuner-console" role="tablist" aria-label="어조 선택">
        {config.variants.map((variant) => (
          <button
            key={variant.mode}
            type="button"
            role="tab"
            aria-selected={selected === variant.mode}
            className={`tuner-stop ${selected === variant.mode ? 'is-active' : ''} ${variant.isOriginal ? 'is-original' : ''}`}
            onClick={() => handleSelect(variant.mode)}
          >
            <i className="tuner-notch" aria-hidden="true" />
            <span>{variant.label}</span>
          </button>
        ))}
      </div>

      <div className={`tuner-readout ${currentVariant.isOriginal ? 'is-original' : 'is-experiment'}`}>
        <div className="tuner-readout-meta">
          {currentVariant.isOriginal ? (
            <span className="mark-original">■ 원문 시구</span>
          ) : (
            <span className="mark-stage">◇ 어조 실험 · 원문 아님</span>
          )}
          <span className="scene-feel-text">{currentVariant.sceneFeel}</span>
        </div>
        <p className={currentVariant.isOriginal ? 'poem-line-original' : 'poem-line-experiment'}>
          “{currentVariant.sentence}”
        </p>
        <p className="tuner-effect-desc">{currentVariant.effectText}</p>
      </div>

      {!completed ? (
        <div className="tone-footer">
          {selected !== 'honorific' ? (
            <p className="tone-nudge">
              강물과 감정의 변화를 확인했나요? 이제 <strong>원문 경어체</strong>로 조율해 비교해 보세요.
            </p>
          ) : config.scaffoldLevel === 'worked-example' && triedModes.length < 2 ? (
            <p className="tone-nudge">
              시범 단계: 다른 어조도 1개 이상 눌러 차이를 느껴 본 뒤 확정할 수 있습니다.
            </p>
          ) : (
            <button
              type="button"
              className="ink-btn full-width"
              disabled={!canConfirm}
              onClick={() => {
                soundEngine.playGrainUnlock();
                onPreviewTone('honorific');
                onComplete();
              }}
            >
              <Check size={17} />
              <span>원문 경어체로 확정하고 다음으로</span>
            </button>
          )}
        </div>
      ) : (
        <p className="marginalia-line is-confirmed">
          <span className="mark-note">◈ 풀이</span> {config.confirmNote}
        </p>
      )}
    </section>
  );
};
