import React from 'react';
import {
  BookOpen,
  Compass,
  Volume2,
  VolumeX,
  GraduationCap,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SceneId } from '../types/game';

interface TopHudProps {
  currentScene: SceneId;
  grainLevel: number;
  observationsCount: number;
  muted: boolean;
  isFullscreen: boolean;
  teacherMode: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onOpenPoem: () => void;
  onOpenObservations: () => void;
  onOpenTeacher: () => void;
}

const SCENE_CHAPTER: Record<SceneId, { num: string; title: string }> = {
  title: { num: '', title: '나루터' },
  intro: { num: '序', title: '나루터의 시간' },
  stanza1: { num: '一', title: '1연 · 은유' },
  stanza2: { num: '二', title: '2연 · 희생과 여울' },
  stanza3: { num: '三', title: '3연 · 밤낮의 기다림' },
  stanza4: { num: '四', title: '4연 · 그러나, 낡아감' },
  stanza5: { num: '五', title: '5연 · 수미상관' },
  lenses: { num: '鏡', title: '3중 상징 렌즈' },
  metaphor: { num: '詩', title: '나의 2행 은유' },
  result: { num: '印', title: '시집 카드 · 디브리핑' },
};

/**
 * 나무 나이테(헌신의 결 0~4단계)를 동심원 SVG 인장으로 표현하는 다이애제틱 HUD
 */
const WoodGrainEmblem: React.FC<{ level: number }> = ({ level }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" className="grain-svg" aria-hidden="true">
    <circle cx="12" cy="12" r="2.2" fill={level >= 1 ? '#e5be73' : 'rgba(244,239,230,0.3)'} />
    <circle
      cx="12"
      cy="12"
      r="5.2"
      fill="none"
      stroke={level >= 2 ? '#e5be73' : 'rgba(244,239,230,0.28)'}
      strokeWidth="1.4"
    />
    <circle
      cx="12"
      cy="12"
      r="8.1"
      fill="none"
      stroke={level >= 3 ? '#e5be73' : 'rgba(244,239,230,0.25)'}
      strokeWidth="1.3"
      strokeDasharray={level >= 3 ? 'none' : '3 2'}
    />
    <circle
      cx="12"
      cy="12"
      r="10.8"
      fill="none"
      stroke={level >= 4 ? '#f2d085' : 'rgba(244,239,230,0.22)'}
      strokeWidth="1.3"
      strokeDasharray={level >= 4 ? 'none' : '4 2.5'}
    />
  </svg>
);

export const TopHud: React.FC<TopHudProps> = ({
  currentScene,
  grainLevel,
  observationsCount,
  muted,
  isFullscreen,
  teacherMode,
  onToggleMute,
  onToggleFullscreen,
  onOpenPoem,
  onOpenObservations,
  onOpenTeacher,
}) => {
  const fullscreenButton = (
    <button
      type="button"
      className="hud-circle-btn"
      onClick={onToggleFullscreen}
      aria-label={isFullscreen ? '전체 화면 종료' : '전체 화면'}
      title={isFullscreen ? '전체 화면 종료 (F)' : '전체 화면 (F)'}
    >
      {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </button>
  );

  if (currentScene === 'title') {
    return (
      <header className="hud-bar hud-minimal">
        <div className="hud-spacer" />
        <div className="hud-actions">
          {teacherMode ? (
            <button type="button" className="hud-seal-btn is-teacher" onClick={onOpenTeacher}>
              <GraduationCap size={17} />
              <span>교사</span>
            </button>
          ) : null}
          {fullscreenButton}
          <button
            type="button"
            className="hud-circle-btn"
            onClick={onToggleMute}
            aria-label={muted ? '소리 켜기' : '음소거'}
            title={muted ? '소리 켜기 (M)' : '음소거 (M)'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>
    );
  }

  const chapter = SCENE_CHAPTER[currentScene];

  return (
    <header className="hud-bar">
      <div className="hud-left">
        <div className="hud-chapter-mark">
          <span className="chapter-hanja" aria-hidden="true">
            {chapter.num}
          </span>
          <span className="chapter-title">{chapter.title}</span>
        </div>

        <div
          className="grain-medallion"
          title="역전된 내구도: 낡아감은 실패가 아니라 헌신의 결입니다."
          aria-label={`헌신의 결 ${grainLevel}단계 중 4단계`}
        >
          <WoodGrainEmblem level={grainLevel} />
          <div className="grain-meta">
            <span className="grain-label">헌신의 결</span>
            <span className="grain-count">{grainLevel} / 4</span>
          </div>
        </div>
      </div>

      <div className="hud-actions">
        <button
          type="button"
          className="hud-seal-btn"
          onClick={onOpenObservations}
          aria-label={`1926 나루터 세밀 관찰 도감 (${observationsCount}/5)`}
        >
          <Compass size={16} />
          <span className="hud-btn-text">관찰 {observationsCount}/5</span>
        </button>
        <button
          type="button"
          className="hud-seal-btn"
          onClick={onOpenPoem}
          aria-label="원문 전편 보기"
        >
          <BookOpen size={16} />
          <span className="hud-btn-text">원문</span>
        </button>
        {teacherMode ? (
          <button
            type="button"
            className="hud-seal-btn is-teacher"
            onClick={onOpenTeacher}
            aria-label="교사 모드 패널 열기"
          >
            <GraduationCap size={16} />
            <span className="hud-btn-text">교사</span>
          </button>
        ) : null}
        {fullscreenButton}
        <button
          type="button"
          className="hud-circle-btn"
          onClick={onToggleMute}
          aria-label={muted ? '소리 켜기' : '음소거'}
          title={muted ? '소리 켜기 (M)' : '음소거 (M)'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </header>
  );
};
