import React from 'react';
import { X, Eye, RotateCcw } from 'lucide-react';
import { SceneId } from '../types/game';

interface TeacherDrawerProps {
  open: boolean;
  currentScene: SceneId;
  grainLevel: number;
  onClose: () => void;
  onJumpScene: (scene: SceneId) => void;
  onSetGrain: (level: number) => void;
  onUnlockAllObservations: () => void;
  onResetAll: () => void;
}

const SCENES: { id: SceneId; label: string }[] = [
  { id: 'title', label: '0. 타이틀' },
  { id: 'intro', label: '도입 · 표식 안내' },
  { id: 'stanza1', label: '1연 · 나룻배와 행인' },
  { id: 'stanza2', label: '2연 · 흙발·여울·어조(시범)' },
  { id: 'stanza3', label: '3연 · 밤낮 눈비·어조·대조' },
  { id: 'stanza4', label: '4연 · 그러나·거자필반' },
  { id: 'stanza5', label: '5연 · 수미상관 카메라 회귀' },
  { id: 'lenses', label: '3중 상징 렌즈' },
  { id: 'metaphor', label: '나만의 2행 은유 카드' },
  { id: 'result', label: '결과 · PNG · 디브리핑' },
];

export const TeacherDrawer: React.FC<TeacherDrawerProps> = ({
  open,
  currentScene,
  grainLevel,
  onClose,
  onJumpScene,
  onSetGrain,
  onUnlockAllObservations,
  onResetAll,
}) => {
  if (!open) return null;

  return (
    <aside className="modal-backdrop" role="dialog" aria-label="교사 모드">
      <div className="teacher-drawer">
        <div className="modal-head">
          <div>
            <div className="folio-kicker">
              <span className="seal-mini is-original">師</span>
              <span>교사 모드 · 수업 시연</span>
            </div>
            <h2>전 구간 즉시 이동 및 미리보기</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <p className="folio-guide">
          단축키 <code>Shift+T</code> 또는 타이틀 로고 5회 연타로 열 수 있습니다. 원하는 연·갈래로 즉시 이동해 수업 중 시연하세요.
        </p>

        <div className="teacher-section">
          <h3>씬 즉시 이동</h3>
          <div className="teacher-scene-grid">
            {SCENES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`teacher-jump-btn ${currentScene === s.id ? 'is-current' : ''}`}
                onClick={() => {
                  onJumpScene(s.id);
                  onClose();
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="teacher-section">
          <h3>선체 노화(헌신의 결) 미리보기</h3>
          <div className="teacher-grain-row">
            {[0, 1, 2, 3, 4].map((g) => (
              <button
                key={g}
                type="button"
                className={`folio-choice ${grainLevel === g ? 'is-selected-self' : ''}`}
                onClick={() => onSetGrain(g)}
              >
                결 {g}
              </button>
            ))}
          </div>
        </div>

        <div className="teacher-footer-actions">
          <button type="button" className="paper-btn" onClick={onUnlockAllObservations}>
            <Eye size={16} />
            <span>세밀 관찰 5종 모두 열람</span>
          </button>
          <button type="button" className="paper-btn" onClick={onResetAll}>
            <RotateCcw size={16} />
            <span>진행 초기화</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
