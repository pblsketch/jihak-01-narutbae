import { ACHIEVEMENT_SEALS, SYMBOLIC_LENSES } from '../data/poemData';
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
 * 상단: 나만의 2행 은유 시집 카드 + 작성자 붉은 낙관
 * 중단: 내 시선 인장 + 학습 요약 + 획득한 감상 낙관 업적 날인
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
  ctx.font = '500 23px "Noto Sans KR", sans-serif';
  ctx.fillText('지학사 2022 개정 공통국어1 · 1-(1) 서정 갈래의 이해', width / 2, 126);

  ctx.fillStyle = '#1E2320';
  ctx.font = '700 40px "Hahmlet", "Gowun Batang", serif';
  ctx.fillText('《낡아가는 배: 나루터의 시간》', width / 2, 184);

  // 얇은 먹선 구분선
  ctx.strokeStyle = 'rgba(30, 35, 32, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 218);
  ctx.lineTo(width - 150, 218);
  ctx.stroke();

  // 2. 상단 영역: 나만의 2행 은유 시집 카드
  const card = progress.metaphorCard;
  ctx.fillStyle = '#A8342B';
  ctx.font = '700 23px "Gowun Batang", serif';
  ctx.fillText(
    `나의 2행 은유 · ${card.target.trim() || '일상의 관계'}`,
    width / 2,
    274,
  );

  ctx.fillStyle = 'rgba(255, 253, 248, 0.84)';
  ctx.strokeStyle = 'rgba(168, 52, 43, 0.35)';
  ctx.lineWidth = 2;
  ctx.fillRect(118, 300, width - 236, 356);
  ctx.strokeRect(118, 300, width - 236, 356);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1E2320';
  ctx.font = '700 52px "Hahmlet", "Gowun Batang", serif';
  ctx.fillText(`나는 ${card.selfMetaphor.trim() || '나룻배'}`, width / 2, 404);
  ctx.fillText(`당신은 ${card.youMetaphor.trim() || '행인'}`, width / 2, 480);

  ctx.fillStyle = '#4B544F';
  ctx.font = '400 24px "Gowun Batang", serif';
  drawWrappedText(
    ctx,
    `유사성: ${card.similarity.trim() || '서로를 향한 마음이 닮아 있기 때문'}`,
    width / 2 - 24,
    546,
    540,
    34,
    2,
  );

  // 작성자 붉은 정사각 낙관 도장
  const stampX = width - 218;
  const stampY = 552;
  const stampSize = 82;
  ctx.save();
  ctx.translate(stampX + stampSize / 2, stampY + stampSize / 2);
  ctx.rotate(-0.07);
  ctx.strokeStyle = '#A8342B';
  ctx.fillStyle = 'rgba(168, 52, 43, 0.08)';
  ctx.lineWidth = 4.5;
  ctx.fillRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize);
  ctx.strokeRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize);
  ctx.fillStyle = '#A8342B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sealName = (card.authorName.trim() || '시인').slice(0, 4);
  ctx.font = '700 23px "Hahmlet", "Gowun Batang", serif';
  if (sealName.length <= 2) {
    ctx.fillText(sealName, 0, -10);
    ctx.fillText('之印', 0, 17);
  } else {
    ctx.fillText(sealName.slice(0, 2), 0, -13);
    ctx.fillText(sealName.slice(2, 4), 0, 15);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // 3. 중단 영역: 내가 읽은 「나룻배와 행인」 학습 요약 + 감상 낙관 컬렉션 날인
  const lens = SYMBOLIC_LENSES.find((l) => l.id === progress.selectedLens) ?? SYMBOLIC_LENSES[0];

  ctx.fillStyle = 'rgba(232, 224, 208, 0.62)';
  ctx.strokeStyle = 'rgba(30, 35, 32, 0.24)';
  ctx.lineWidth = 2;
  ctx.fillRect(118, 688, width - 236, 444);
  ctx.strokeRect(118, 688, width - 236, 444);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1E6460';
  ctx.font = '700 23px "Noto Sans KR", sans-serif';
  ctx.fillText(`내 시선 인장 · ${lens.title} (${lens.badge})`, 154, 738);

  ctx.fillStyle = '#1E2320';
  ctx.font = '700 25px "Gowun Batang", serif';
  ctx.fillText(`• 당신 = ${lens.meaningYou}`, 154, 784);
  ctx.fillText(`• 물·여울 = ${lens.meaningWater}`, 154, 822);

  // 학습 요약 4개
  const toneDoneCount = Object.values(progress.toneCompleted).filter(Boolean).length;
  const stanzaDoneCount = Object.values(progress.stanzaCompleted).filter(Boolean).length;
  const badges = [
    `헌신의 결 ${progress.grainLevel}/4`,
    `경어체 어조 조율 ${toneDoneCount}/3`,
    `시상·수미상관 ${stanzaDoneCount}/5연`,
    `1926 세밀 관찰 ${progress.observationsFound.length}/5`,
  ];

  ctx.font = '700 21px "Noto Sans KR", sans-serif';
  badges.forEach((label, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 154 + col * 392;
    const by = 852 + row * 56;
    ctx.fillStyle = '#F9F6F0';
    ctx.strokeStyle = 'rgba(30, 100, 96, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.fillRect(bx, by, 372, 44);
    ctx.strokeRect(bx, by, 372, 44);
    ctx.fillStyle = '#1E2320';
    ctx.textAlign = 'center';
    ctx.fillText(label, bx + 186, by + 29);
  });

  // 감상 낙관 업적 날인 영역 (3종)
  const earnedSet = new Set(progress.unlockedSeals ?? []);
  ctx.strokeStyle = 'rgba(30, 35, 32, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(154, 982);
  ctx.lineTo(width - 154, 982);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#5D6660';
  ctx.font = '700 19px "Noto Sans KR", sans-serif';
  ctx.fillText(`감상 낙관 (${earnedSet.size}/3 날인)`, 154, 1014);

  ACHIEVEMENT_SEALS.forEach((seal, idx) => {
    const earned = earnedSet.has(seal.id);
    const sx = 154 + idx * 262;
    const sy = 1030;
    const sw = 248;
    const sh = 78;

    ctx.fillStyle = earned ? 'rgba(255, 252, 246, 0.92)' : 'rgba(232, 224, 208, 0.45)';
    ctx.strokeStyle = earned ? 'rgba(164, 50, 40, 0.55)' : 'rgba(30, 35, 32, 0.18)';
    ctx.lineWidth = earned ? 2 : 1.2;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeRect(sx, sy, sw, sh);

    // 정사각 낙관 인장
    const boxX = sx + 14;
    const boxY = sy + 13;
    const boxS = 52;
    ctx.save();
    ctx.translate(boxX + boxS / 2, boxY + boxS / 2);
    ctx.rotate(earned ? -0.05 : 0);
    ctx.strokeStyle = earned ? '#A43228' : 'rgba(78, 86, 80, 0.35)';
    ctx.fillStyle = earned ? 'rgba(164, 50, 40, 0.09)' : 'transparent';
    ctx.lineWidth = earned ? 3 : 1.5;
    ctx.fillRect(-boxS / 2, -boxS / 2, boxS, boxS);
    ctx.strokeRect(-boxS / 2, -boxS / 2, boxS, boxS);
    ctx.fillStyle = earned ? '#A43228' : 'rgba(78, 86, 80, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 20px "Hahmlet", "Gowun Batang", serif';
    ctx.fillText(seal.sealChars, 0, 1);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';

    // 낙관 명칭
    ctx.textAlign = 'left';
    ctx.fillStyle = earned ? '#1E2320' : 'rgba(78, 86, 80, 0.52)';
    ctx.font = '700 20px "Hahmlet", "Gowun Batang", serif';
    ctx.fillText(seal.title, sx + 78, sy + 37);

    ctx.fillStyle = earned ? '#A43228' : 'rgba(78, 86, 80, 0.45)';
    ctx.font = '600 15px "Noto Sans KR", sans-serif';
    ctx.fillText(earned ? '날인 완료' : '미획득', sx + 78, sy + 61);
  });

  // 4. 하단 영역: 원문 수미상관 끝연 & 완료 일시
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A8342B';
  ctx.font = '700 19px "Noto Sans KR", sans-serif';
  ctx.fillText('원문 · 수미상관', width / 2, 1184);

  ctx.fillStyle = '#1E2320';
  ctx.font = '700 33px "Gowun Batang", serif';
  ctx.fillText('나는 나룻배  /  당신은 행인.', width / 2, 1232);

  ctx.fillStyle = '#555E58';
  ctx.font = '400 21px "Gowun Batang", serif';
  ctx.fillText('— 한용운, 「나룻배와 행인」 (『님의 침묵』, 1926)', width / 2, 1272);

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillStyle = '#6B746E';
  ctx.font = '400 19px "Noto Sans KR", sans-serif';
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
