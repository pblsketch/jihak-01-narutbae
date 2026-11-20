import { SYMBOLIC_LENSES } from '../data/poemData';
import { GameProgress } from '../types/game';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const chars = Array.from(text);
  let line = '';
  let currentY = y;
  let count = 0;

  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      count++;
      if (count >= maxLines) {
        ctx.fillText(line.slice(0, -1) + '…', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = chars[i];
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * 통합 1장 제출용 PNG (1080 × 1440) 생성
 * 상단: 나만의 2행 은유 시집 카드 + 붉은 낙관
 * 중단: 내 시선 인장 + 학습 요약
 * 하단: 원문 수미상관 끝연 + 출처
 */
export async function renderUnifiedCardPng(progress: GameProgress): Promise<string> {
  const width = 1080;
  const height = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. 한지 배경 프레임 로드 (없으면 프로시저럴 한지)
  const frameImg = await loadImage('./assets/hanji-card-frame.webp');
  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, width, height);
    ctx.fillStyle = 'rgba(244, 239, 230, 0.35)';
    ctx.fillRect(72, 72, width - 144, height - 144);
  } else {
    ctx.fillStyle = '#F4EFE6';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#2B312E';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, width - 96, height - 96);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(62, 62, width - 124, height - 124);
  }

  // 헤더 메타
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5D6660';
  ctx.font = '500 24px "Noto Sans KR", sans-serif';
  ctx.fillText('지학사 2022 개정 공통국어1 · 1-(1) 서정 갈래의 이해', width / 2, 134);

  ctx.fillStyle = '#1E2320';
  ctx.font = '700 42px "Hahmlet", "Gowun Batang", serif';
  ctx.fillText('《낡아가는 배: 나루터의 시간》', width / 2, 194);

  // 얇은 먹선 구분선
  ctx.strokeStyle = 'rgba(30, 35, 32, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 232);
  ctx.lineTo(width - 150, 232);
  ctx.stroke();

  // 2. 상단 영역: 나만의 2행 은유 시집 카드
  const card = progress.metaphorCard;
  ctx.fillStyle = '#A8342B';
  ctx.font = '700 24px "Gowun Batang", serif';
  ctx.fillText(
    `나의 2행 은유 · ${card.target.trim() || '일상의 관계'}`,
    width / 2,
    296,
  );

  // 시집 카드 내부 박스
  ctx.fillStyle = 'rgba(255, 253, 248, 0.82)';
  ctx.strokeStyle = 'rgba(168, 52, 43, 0.35)';
  ctx.lineWidth = 2;
  ctx.fillRect(118, 324, width - 236, 376);
  ctx.strokeRect(118, 324, width - 236, 376);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1E2320';
  ctx.font = '700 54px "Hahmlet", "Gowun Batang", serif';
  ctx.fillText(`나는 ${card.selfMetaphor.trim() || '나룻배'}`, width / 2, 434);
  ctx.fillText(`당신은 ${card.youMetaphor.trim() || '행인'}`, width / 2, 514);

  ctx.fillStyle = '#4B544F';
  ctx.font = '400 25px "Gowun Batang", serif';
  drawWrappedText(
    ctx,
    `유사성: ${card.similarity.trim() || '서로를 향한 마음이 닮아 있기 때문'}`,
    width / 2 - 20,
    584,
    550,
    36,
    2,
  );

  // 붉은 정사각 낙관 도장 (유사성 텍스트와 겹치지 않도록 우측 하단 안전 여백 확보)
  const stampX = width - 220;
  const stampY = 594;
  const stampSize = 84;
  ctx.save();
  ctx.translate(stampX + stampSize / 2, stampY + stampSize / 2);
  ctx.rotate(-0.07);
  ctx.strokeStyle = '#A8342B';
  ctx.fillStyle = 'rgba(168, 52, 43, 0.08)';
  ctx.lineWidth = 5;
  ctx.fillRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize);
  ctx.strokeRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize);
  ctx.fillStyle = '#A8342B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sealName = (card.authorName.trim() || '시인').slice(0, 4);
  ctx.font = '700 24px "Hahmlet", "Gowun Batang", serif';
  if (sealName.length <= 2) {
    ctx.fillText(sealName, 0, -10);
    ctx.fillText('之印', 0, 18);
  } else {
    ctx.fillText(sealName.slice(0, 2), 0, -14);
    ctx.fillText(sealName.slice(2, 4), 0, 16);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // 3. 중단 영역: 내가 읽은 「나룻배와 행인」 학습 요약
  const lens = SYMBOLIC_LENSES.find((l) => l.id === progress.selectedLens) ?? SYMBOLIC_LENSES[0];

  ctx.fillStyle = 'rgba(232, 224, 208, 0.65)';
  ctx.strokeStyle = 'rgba(30, 35, 32, 0.22)';
  ctx.lineWidth = 2;
  ctx.fillRect(118, 744, width - 236, 360);
  ctx.strokeRect(118, 744, width - 236, 360);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1F6F6B';
  ctx.font = '700 24px "Noto Sans KR", sans-serif';
  ctx.fillText(`내 시선 인장 · ${lens.title} (${lens.badge})`, 156, 800);

  ctx.fillStyle = '#1E2320';
  ctx.font = '700 28px "Gowun Batang", serif';
  ctx.fillText(`• 당신 = ${lens.meaningYou}`, 156, 854);
  ctx.fillText(`• 물·여울 = ${lens.meaningWater}`, 156, 898);

  // 학습 달성 배지 4개
  const toneDoneCount = Object.values(progress.toneCompleted).filter(Boolean).length;
  const stanzaDoneCount = Object.values(progress.stanzaCompleted).filter(Boolean).length;
  const badges = [
    `헌신의 결 ${progress.grainLevel}/4`,
    `경어체 어조 조율 ${toneDoneCount}/3`,
    `시상·수미상관 ${stanzaDoneCount}/5연`,
    `1926 세밀 관찰 ${progress.observationsFound.length}/5`,
  ];

  ctx.font = '700 22px "Noto Sans KR", sans-serif';
  badges.forEach((label, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 156 + col * 392;
    const by = 944 + row * 68;
    ctx.fillStyle = '#F9F6F0';
    ctx.strokeStyle = '#1F6F6B';
    ctx.lineWidth = 1.8;
    ctx.fillRect(bx, by, 372, 50);
    ctx.strokeRect(bx, by, 372, 50);
    ctx.fillStyle = '#1E2320';
    ctx.textAlign = 'center';
    ctx.fillText(label, bx + 186, by + 33);
  });

  // 4. 하단 영역: 원문 수미상관 끝연 & 완료 일시
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A8342B';
  ctx.font = '700 20px "Noto Sans KR", sans-serif';
  ctx.fillText('[원문 · 수미상관]', width / 2, 1170);

  ctx.fillStyle = '#1E2320';
  ctx.font = '700 34px "Gowun Batang", serif';
  ctx.fillText('나는 나룻배  /  당신은 행인.', width / 2, 1222);

  ctx.fillStyle = '#555E58';
  ctx.font = '400 22px "Gowun Batang", serif';
  ctx.fillText('— 한용운, 「나룻배와 행인」 (『님의 침묵』, 1926)', width / 2, 1264);

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillStyle = '#6B746E';
  ctx.font = '400 20px "Noto Sans KR", sans-serif';
  ctx.fillText(`학습 완료일: ${dateStr} · 낡아가는 배: 나루터의 시간`, width / 2, 1326);

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename = 'narutbae-metaphor-card.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
