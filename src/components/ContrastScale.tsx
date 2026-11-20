import React, { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { CONTRAST_ITEMS, ContrastItem } from '../data/poemData';
import { ContrastSide } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface ContrastScaleProps {
  stanza: 2 | 3 | 4;
  placed: Record<string, ContrastSide>;
  onPlace: (itemId: string, side: ContrastSide) => void;
  onComplete: () => void;
}

export const ContrastScale: React.FC<ContrastScaleProps> = ({
  stanza,
  placed,
  onPlace,
  onComplete,
}) => {
  const stanzaItems = CONTRAST_ITEMS.filter((item) => item.stanza === stanza);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHintId, setShowHintId] = useState<string | null>(null);
  const [checkedOk, setCheckedOk] = useState(false);

  const allAssigned = stanzaItems.every((item) => Boolean(placed[item.id]));

  const handleAssign = (item: ContrastItem, side: ContrastSide) => {
    soundEngine.playSoftTap();
    setFeedback(null);
    setCheckedOk(false);
    onPlace(item.id, side);
  };

  const handleVerify = () => {
    const wrongItems = stanzaItems.filter((item) => placed[item.id] !== item.correctSide);
    if (wrongItems.length === 0) {
      soundEngine.playGrainUnlock();
      setCheckedOk(true);
      setFeedback(null);
      onComplete();
      return;
    }
    soundEngine.playSoftTap();
    setFeedback(
      `${wrongItems.length}개 항목의 자리가 바뀌었습니다. 시구 속 주어(‘나는’ / ‘당신은’)를 다시 살펴보세요.`,
    );
    setShowHintId(wrongItems[0].id);
  };

  return (
    <section className="folio-card contrast-scale" aria-label="대조의 저울">
      <div className="folio-header">
        <div className="folio-kicker">
          <span className="seal-mini is-note">對</span>
          <span>대조의 저울 · 제{stanza}연</span>
        </div>
        {stanza === 2 ? <span className="folio-step-note">첫 항목 시범 배치됨</span> : null}
      </div>

      <p className="folio-guide">
        {stanza}연에서 관찰한 행동을 <strong>‘나(나룻배)’</strong>와 <strong>‘당신(행인)’</strong> 중 알맞은 쪽에 놓아 보세요.
      </p>

      <div className="contrast-list">
        {stanzaItems.map((item) => {
          const current = placed[item.id];
          const isLockedDemo = stanza === 2 && item.autoDemo;
          return (
            <div key={item.id} className={`contrast-row ${isLockedDemo ? 'is-demo' : ''}`}>
              <div className="contrast-item-head">
                <span className="contrast-item-text">
                  {item.text}
                  {isLockedDemo ? <em className="demo-mark">시범</em> : null}
                </span>
                {!isLockedDemo && stanza <= 3 ? (
                  <button
                    type="button"
                    className="mini-hint-btn"
                    onClick={() => setShowHintId((prev) => (prev === item.id ? null : item.id))}
                    aria-label="시구 힌트 보기"
                  >
                    <HelpCircle size={15} />
                  </button>
                ) : null}
              </div>

              {showHintId === item.id ? (
                <p className="contrast-quote-hint">
                  <span className="mark-original">■ 원문</span> {item.quoteHint}
                </p>
              ) : null}

              <div className="contrast-choice-pair">
                <button
                  type="button"
                  disabled={isLockedDemo}
                  className={`folio-choice ${current === 'self' ? 'is-selected-self' : ''}`}
                  onClick={() => handleAssign(item, 'self')}
                >
                  나 (나룻배)
                </button>
                <button
                  type="button"
                  disabled={isLockedDemo}
                  className={`folio-choice ${current === 'you' ? 'is-selected-you' : ''}`}
                  onClick={() => handleAssign(item, 'you')}
                >
                  당신 (행인)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {feedback ? (
        <p className="marginalia-line is-warn">
          <span className="mark-original">▲ 부분 피드백</span> {feedback}
        </p>
      ) : null}

      {!checkedOk ? (
        <button
          type="button"
          className="ink-btn full-width"
          disabled={!allAssigned}
          onClick={handleVerify}
        >
          <Check size={17} />
          <span>대조 축 확인하기</span>
        </button>
      ) : null}
    </section>
  );
};
