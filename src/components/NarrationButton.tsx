import React, { useEffect, useState } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface NarrationButtonProps {
  audioKey: string; // e.g., 'stanza1'..'stanza5', 'full-poem'
  text: string;
  label?: string;
}

/**
 * 1926 서첩 스타일 원문 낭송 버튼
 * - public/assets/audio/<audioKey>.mp3 (Fish Audio 생성 파일)이 있으면 즉시 성우 음원 재생
 * - 파일이 아직 없으면 브라우저 한국어 TTS로 자연스럽게 폴백
 */
export const NarrationButton: React.FC<NarrationButtonProps> = ({
  audioKey,
  text,
  label = '낭송 듣기',
}) => {
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  useEffect(() => {
    return soundEngine.subscribeNarration(setPlayingKey);
  }, []);

  const isPlaying = playingKey === audioKey;

  return (
    <button
      type="button"
      className={`narration-btn ${isPlaying ? 'is-playing' : ''}`}
      onClick={() => soundEngine.toggleNarration(audioKey, text)}
      aria-label={isPlaying ? '낭송 멈춤' : label}
    >
      {isPlaying ? <Square size={13} /> : <Volume2 size={14} />}
      <span>{isPlaying ? '낭송 멈춤' : label}</span>
    </button>
  );
};
