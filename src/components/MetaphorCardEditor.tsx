import React from 'react';
import { Stamp, ArrowRight } from 'lucide-react';
import { METAPHOR_PRESETS } from '../data/poemData';
import { MetaphorCardData } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface MetaphorCardEditorProps {
  card: MetaphorCardData;
  onChange: (next: MetaphorCardData) => void;
  onFinish: () => void;
}

export const MetaphorCardEditor: React.FC<MetaphorCardEditorProps> = ({
  card,
  onChange,
  onFinish,
}) => {
  const applyPreset = (preset: (typeof METAPHOR_PRESETS)[number]) => {
    soundEngine.playSoftTap();
    onChange({
      ...card,
      target: preset.target,
      selfMetaphor: preset.selfMetaphor,
      youMetaphor: preset.youMetaphor,
      similarity: preset.similarity,
      stamped: false,
    });
  };

  const canStamp =
    card.selfMetaphor.trim().length > 0 && card.youMetaphor.trim().length > 0;

  return (
    <section className="folio-card metaphor-studio" aria-label="나만의 2행 은유 카드">
      <div className="folio-header">
        <div className="folio-kicker">
          <span className="seal-mini is-original">詩</span>
          <span>나만의 2행 은유 카드</span>
        </div>
        <span className="folio-step-note">교과서 p.18 활동 5</span>
      </div>

      <p className="folio-guide">
        원작을 감상한 뒤, 이제 내 일상 속 소중한 관계를 <strong>‘나는 ___ / 당신은 ___’</strong> 2행 은유로 표현해 보세요. 추천 시어를 누른 뒤 자유롭게 고쳐도 좋습니다.
      </p>

      <div className="preset-chips" aria-label="추천 예시">
        {METAPHOR_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="preset-chip"
            onClick={() => applyPreset(preset)}
          >
            + {preset.label}
          </button>
        ))}
      </div>

      <div className="metaphor-form">
        <label className="form-field">
          <span>표현할 대상 (원관념)</span>
          <input
            type="text"
            maxLength={22}
            placeholder="예: 단짝 친구와 나, 가족, 나의 꿈"
            value={card.target}
            onChange={(e) => onChange({ ...card, target: e.target.value, stamped: false })}
          />
        </label>

        <div className="two-line-inputs">
          <label className="form-field">
            <span>1행 · 나는 (보조관념)</span>
            <div className="prefix-input">
              <em>나는</em>
              <input
                type="text"
                maxLength={18}
                placeholder="긴 문장의 쉼표"
                value={card.selfMetaphor}
                onChange={(e) => onChange({ ...card, selfMetaphor: e.target.value, stamped: false })}
              />
            </div>
          </label>

          <label className="form-field">
            <span>2행 · 당신은 (보조관념)</span>
            <div className="prefix-input">
              <em>당신은</em>
              <input
                type="text"
                maxLength={18}
                placeholder="숨 가쁜 하루"
                value={card.youMetaphor}
                onChange={(e) => onChange({ ...card, youMetaphor: e.target.value, stamped: false })}
              />
            </div>
          </label>
        </div>

        <label className="form-field">
          <span>유사성 한 줄 (왜 그렇게 빗대었나요?)</span>
          <input
            type="text"
            maxLength={45}
            placeholder="예: 바쁜 하루 속에서 잠깐의 쉼을 주기 때문"
            value={card.similarity}
            onChange={(e) => onChange({ ...card, similarity: e.target.value, stamped: false })}
          />
        </label>

        <label className="form-field">
          <span>낙관에 새길 이름 또는 별명 (선택)</span>
          <input
            type="text"
            maxLength={4}
            placeholder="예: 해솔 (최대 4글자)"
            value={card.authorName}
            onChange={(e) => onChange({ ...card, authorName: e.target.value, stamped: false })}
          />
        </label>
      </div>

      <div className={`book-preview-card ${card.stamped ? 'is-stamped' : ''}`}>
        <div className="book-preview-meta">{card.target.trim() || '일상의 관계'}</div>
        <div className="book-preview-lines">
          <p>나는 {card.selfMetaphor.trim() || '＿＿＿'}</p>
          <p>당신은 {card.youMetaphor.trim() || '＿＿＿'}</p>
        </div>
        {card.similarity.trim() ? (
          <p className="book-preview-sim">“{card.similarity.trim()}”</p>
        ) : null}
        {card.stamped ? (
          <div className="red-seal-stamp" aria-label="붉은 낙관 찍힘">
            {(card.authorName.trim() || '시인').slice(0, 4)}
          </div>
        ) : null}
      </div>

      <div className="action-row">
        <button
          type="button"
          className="paper-btn"
          disabled={!canStamp}
          onClick={() => {
            soundEngine.playStamp();
            onChange({ ...card, stamped: true });
          }}
        >
          <Stamp size={17} />
          <span>{card.stamped ? '낙관 다시 찍기' : '붉은 낙관 찍기'}</span>
        </button>

        <button
          type="button"
          className="ink-btn"
          disabled={!canStamp || !card.stamped}
          onClick={() => {
            soundEngine.playGrainUnlock();
            onFinish();
          }}
        >
          <span>결과 · PNG 저장으로</span>
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
};
