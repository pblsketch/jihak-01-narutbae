import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface HoldInteractionProps {
  label: string;
  subLabel: string;
  stages: string[];
  releaseMessage: string;
  durationMs?: number;
  progress: number;
  onProgressChange: (next: number, holding: boolean) => void;
  onComplete: () => void;
  onReleaseWobble?: () => void;
}

export const HoldInteraction: React.FC<HoldInteractionProps> = ({
  label,
  subLabel,
  stages,
  releaseMessage,
  durationMs = 4400,
  progress,
  onProgressChange,
  onComplete,
  onReleaseWobble,
}) => {
  const [holding, setHolding] = useState(false);
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const progressRef = useRef(progress);
  const completedRef = useRef(progress >= 1);
  const lastPulseStage = useRef(-1);

  useEffect(() => {
    progressRef.current = progress;
    if (progress >= 1) completedRef.current = true;
  }, [progress]);

  useEffect(() => {
    if (!holding || completedRef.current) return;
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - lastTs, 80);
      lastTs = now;
      const next = Math.min(1, progressRef.current + dt / durationMs);
      progressRef.current = next;

      const stageIdx = Math.min(stages.length - 1, Math.floor(next * stages.length));
      if (stageIdx !== lastPulseStage.current) {
        lastPulseStage.current = stageIdx;
        soundEngine.playHoldPulse();
      }

      onProgressChange(next, true);

      if (next >= 1) {
        completedRef.current = true;
        setHolding(false);
        onProgressChange(1, false);
        onComplete();
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [holding, durationMs, onProgressChange, onComplete, stages.length]);

  const startHold = () => {
    if (completedRef.current) return;
    setSoftNotice(null);
    setHolding(true);
    soundEngine.startAmbientWater();
    onProgressChange(progressRef.current, true);
  };

  const stopHold = () => {
    if (!holding) return;
    setHolding(false);
    onProgressChange(progressRef.current, false);
    if (!completedRef.current && progressRef.current > 0.05 && progressRef.current < 1) {
      setSoftNotice(releaseMessage);
      onReleaseWobble?.();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        startHold();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stopHold();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  const currentStageIndex = Math.min(stages.length - 1, Math.floor(progress * stages.length));
  const pct = Math.round(progress * 100);

  return (
    <div className="hold-box">
      <div className="hold-river-track" aria-live="polite">
        {stages.map((st, i) => (
          <span
            key={st}
            className={`hold-river-stop ${i < currentStageIndex || progress >= 1 ? 'is-done' : i === currentStageIndex ? 'is-active' : ''}`}
          >
            <i className="stop-dot" aria-hidden="true" />
            {st}
          </span>
        ))}
      </div>

      <button
        type="button"
        className={`hold-btn ${holding ? 'is-holding' : ''}`}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture?.(e.pointerId);
          startHold();
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onBlur={stopHold}
      >
        <span className="hold-fill" style={{ width: `${pct}%` }} />
        <span className="hold-content">
          <strong>{holding ? `${stages[currentStageIndex]} 버티는 중 · ${pct}%` : label}</strong>
          <small>{subLabel}</small>
        </span>
      </button>

      {softNotice ? (
        <p className="marginalia-line is-stage">
          <span className="mark-stage">◇ 연출</span> {softNotice}
        </p>
      ) : null}
    </div>
  );
};
