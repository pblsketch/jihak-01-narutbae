import React from 'react';
import { AchievementSeal } from '../data/poemData';
import { ResonanceEvent } from '../types/game';

interface ResonanceOverlayProps {
  event: ResonanceEvent | null;
  sealToast: AchievementSeal | null;
}

/**
 * 감각적 피드백(수묵 금빛 파문 + 금박 입자 + 시어의 울림 플로팅 배지)
 * 및 영광의 보상(전통 낙관 획득 실시간 토스트) 비차단 오버레이
 */
export const ResonanceOverlay: React.FC<ResonanceOverlayProps> = ({ event, sealToast }) => {
  const goldParticles = event ? Math.min(12, 6 + event.chain * 2) : 0;

  return (
    <div className="resonance-layer" aria-live="polite" aria-atomic="true">
      {/* 수묵 금빛 파문 + 금박 입자 확장 이펙트 */}
      {event ? (
        <div key={event.id} className={`resonance-burst tone-${event.tone ?? 'gold'}`}>
          <span className="gold-ripple r1" />
          <span className="gold-ripple r2" />
          {event.chain >= 2 ? <span className="gold-ripple r3" /> : null}

          <div className="gold-motes" aria-hidden="true">
            {Array.from({ length: goldParticles }).map((_, idx) => {
              const angle = (idx / goldParticles) * 360;
              const dist = 54 + (idx % 3) * 26 + Math.min(30, event.chain * 6);
              return (
                <span
                  key={idx}
                  className="gold-mote"
                  style={
                    {
                      '--angle': `${angle}deg`,
                      '--dist': `${dist}px`,
                      '--delay': `${(idx % 4) * 45}ms`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>

          {/* 짤막한 '시어의 울림' 플로팅 인장 배지 */}
          <div className="resonance-floater">
            <span className="resonance-floater-mark" aria-hidden="true">
              韻
            </span>
            <div className="resonance-floater-text">
              <strong>{event.label}</strong>
              {event.detail ? <small>{event.detail}</small> : null}
            </div>
            {event.chain >= 2 ? (
              <span className="resonance-chain-mark">공명 ×{event.chain}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 영광의 보상: 3종 전통 감상 낙관 실시간 획득 알림 */}
      {sealToast ? (
        <div key={sealToast.id} className="seal-achievement-toast" role="status">
          <div className="seal-toast-stamp" aria-hidden="true">
            {sealToast.sealChars}
          </div>
          <div className="seal-toast-body">
            <span className="seal-toast-kicker">감상 낙관 획득</span>
            <strong>{sealToast.title}</strong>
            <p>{sealToast.condition}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
