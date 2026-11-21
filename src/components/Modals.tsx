import React from 'react';
import { X, Lock, Sparkles } from 'lucide-react';
import {
  HIDDEN_MARGIN_NOTE_1926,
  OBSERVATION_NOTES,
  ObservationNote,
  POEM_STANZAS,
} from '../data/poemData';
import { NarrationButton } from './NarrationButton';

interface PoemModalProps {
  open: boolean;
  onClose: () => void;
}

export const PoemModal: React.FC<PoemModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  const fullPoemText = POEM_STANZAS.map((s) => s.lines.join(' ')).join('. ');
  return (
    <div className="modal-backdrop" role="dialog" aria-label="나룻배와 행인 원문 전편" onClick={onClose}>
      <div className="hanji-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="folio-kicker">
              <span className="seal-mini is-original">原</span>
              <span>지학사 공통국어1 p.19 · 원문 전편</span>
            </div>
            <h2>나룻배와 행인 — 한용운</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        <div className="poem-modal-bar">
          <p className="poem-source-note">『님의 침묵』 (1926) 수록 · 교과서 원문 문장부호 그대로 수록</p>
          <NarrationButton audioKey="full-poem" text={fullPoemText} label="전편 낭송" />
        </div>

        <div className="poem-full-body">
          {POEM_STANZAS.map((stanza) => (
            <div key={stanza.id} className="poem-stanza-block">
              <div className="poem-stanza-num">{stanza.number}연</div>
              <div className="poem-stanza-lines">
                {stanza.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ObservationModalProps {
  open: boolean;
  foundIds: string[];
  focusedNote: ObservationNote | null;
  onClose: () => void;
  onOpenHiddenNote?: () => void;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  open,
  foundIds,
  focusedNote,
  onClose,
  onOpenHiddenNote,
}) => {
  if (!open) return null;
  const allFound = foundIds.length >= OBSERVATION_NOTES.length;

  return (
    <div className="modal-backdrop" role="dialog" aria-label="1926 나루터 세밀 관찰 도감" onClick={onClose}>
      <div className="hanji-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="folio-kicker">
              <span className="seal-mini is-note">錄</span>
              <span>1926 나루터 세밀 관찰 ({foundIds.length}/5)</span>
            </div>
            <h2>강변에 숨은 고증과 시어의 결</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="obs-list">
          {OBSERVATION_NOTES.map((note) => {
            const isFound = foundIds.includes(note.id);
            const isFocused = focusedNote?.id === note.id;
            return (
              <div
                key={note.id}
                className={`obs-entry ${isFound ? 'is-unlocked' : 'is-locked'} ${isFocused ? 'is-focused' : ''}`}
              >
                <div className="obs-entry-head">
                  <span className="obs-stanza-mark">제{note.stanza}연</span>
                  <span className="obs-tag-text">{note.tag}</span>
                </div>
                {isFound ? (
                  <>
                    <h3>{note.title}</h3>
                    <p>{note.description}</p>
                  </>
                ) : (
                  <div className="obs-locked-body">
                    <Lock size={15} />
                    <span>{note.stanza}연 나루터 화면에서 은은한 금빛 파문을 눌러 보세요.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 접근의 보상: 5/5 관찰 완료 시 해금되는 1926년 초간본 여백 노트 */}
        <div className={`hidden-note-gate ${allFound ? 'is-unlocked' : 'is-locked'}`}>
          <div className="hidden-note-gate-head">
            <span className={`seal-mini ${allFound ? 'is-original' : 'is-note'}`}>
              {allFound ? '秘' : '鎖'}
            </span>
            <div>
              <strong>1926년 『님의 침묵』 초간본 여백 노트</strong>
              <p>
                {allFound
                  ? '나루터 관찰 5/5를 모두 마쳐 히든 원문 감상 해설이 해금되었습니다.'
                  : `나루터 관찰 포인트 5곳을 모두 발견하면 해금됩니다. (현재 ${foundIds.length}/5)`}
              </p>
            </div>
          </div>
          {allFound && onOpenHiddenNote ? (
            <button
              type="button"
              className="ink-btn full-width"
              onClick={() => {
                onClose();
                onOpenHiddenNote();
              }}
            >
              <Sparkles size={16} />
              <span>1926 초간본 여백 노트 펼쳐 읽기</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

interface HiddenNoteModalProps {
  open: boolean;
  onClose: () => void;
}

export const HiddenNoteModal: React.FC<HiddenNoteModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-label="1926년 님의 침묵 초간본 여백 노트"
      onClick={onClose}
    >
      <div className="hanji-modal hidden-note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="folio-kicker">
              <span className="seal-mini is-original">秘</span>
              <span>{HIDDEN_MARGIN_NOTE_1926.kicker}</span>
            </div>
            <h2>{HIDDEN_MARGIN_NOTE_1926.title}</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <p className="poem-source-note">{HIDDEN_MARGIN_NOTE_1926.subtitle}</p>

        <div className="hidden-note-sections">
          {HIDDEN_MARGIN_NOTE_1926.sections.map((sec) => (
            <article key={sec.heading} className="hidden-note-article">
              <h3>{sec.heading}</h3>
              <p>{sec.body}</p>
            </article>
          ))}
        </div>

        <p className="hidden-note-quote">{HIDDEN_MARGIN_NOTE_1926.closingQuote}</p>
      </div>
    </div>
  );
};
