import React from 'react';
import { X, Lock } from 'lucide-react';
import { OBSERVATION_NOTES, ObservationNote, POEM_STANZAS } from '../data/poemData';

interface PoemModalProps {
  open: boolean;
  onClose: () => void;
}

export const PoemModal: React.FC<PoemModalProps> = ({ open, onClose }) => {
  if (!open) return null;
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
        <p className="poem-source-note">『님의 침묵』 (1926) 수록 · 교과서 원문 문장부호 그대로 수록</p>

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
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  open,
  foundIds,
  focusedNote,
  onClose,
}) => {
  if (!open) return null;
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
      </div>
    </div>
  );
};
