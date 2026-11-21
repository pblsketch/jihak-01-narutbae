import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBSERVATION_NOTES, ObservationNote, SYMBOLIC_LENSES } from '../data/poemData';
import { SceneVisualState } from '../types/game';

interface FerryDioramaProps {
  visual: SceneVisualState;
  observationsFound: string[];
  onDiscoverObservation: (obs: ObservationNote) => void;
  showAllPins?: boolean;
}

/**
 * 1연과 5연의 수미상관 카메라 회귀를 보장하는 고정 좌표
 */
const CAM_STANZA_1 = {
  pos: new THREE.Vector3(0.0, 2.25, 6.1),
  lookAt: new THREE.Vector3(0.0, 0.55, -1.6),
};

const CAM_PRESETS: Record<
  SceneVisualState['scene'],
  { pos: THREE.Vector3; lookAt: THREE.Vector3 }
> = {
  title: { pos: new THREE.Vector3(0.4, 2.35, 6.7), lookAt: new THREE.Vector3(0, 0.65, -2.0) },
  intro: { pos: new THREE.Vector3(0.2, 2.28, 6.35), lookAt: new THREE.Vector3(0, 0.58, -1.8) },
  stanza1: CAM_STANZA_1,
  stanza2: { pos: new THREE.Vector3(0.0, 2.02, 4.95), lookAt: new THREE.Vector3(0, 0.62, -1.7) },
  stanza3: { pos: new THREE.Vector3(-0.55, 2.15, 5.45), lookAt: new THREE.Vector3(0.15, 0.6, -2.1) },
  stanza4: { pos: new THREE.Vector3(0.25, 2.05, 5.15), lookAt: new THREE.Vector3(0, 0.65, -2.2) },
  stanza5: CAM_STANZA_1, // 1연과 완벽히 동일한 카메라 구도 회귀 (수미상관)
  lenses: { pos: new THREE.Vector3(0.0, 2.32, 6.3), lookAt: new THREE.Vector3(0, 0.65, -1.8) },
  metaphor: { pos: new THREE.Vector3(0.25, 2.38, 6.45), lookAt: new THREE.Vector3(0, 0.68, -1.9) },
  result: { pos: new THREE.Vector3(0.0, 2.35, 6.5), lookAt: new THREE.Vector3(0, 0.68, -2.0) },
};

/**
 * Custom GLSL Sumuk-Damchae (수묵담채) River Shader
 * - 수평선 경계 없이 원경 안개로 자연스럽게 융합
 * - 유기적 FBM 수묵 물결 + 달빛/여명 윤슬 + 3연 빗방울 동심원 파문
 */
const WATER_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uWaveAmp;
  uniform float uWaveSpeed;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vElev;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float w1 = sin(pos.x * 0.42 + uTime * uWaveSpeed) * cos(pos.z * 0.35 + uTime * uWaveSpeed * 0.7);
    float w2 = sin((pos.x * 0.85 - pos.z * 0.65) + uTime * uWaveSpeed * 1.35) * 0.45;
    float elev = (w1 + w2) * uWaveAmp;
    pos.y += elev;
    vElev = elev;
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const WATER_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSkyColor;
  uniform vec3 uSunColor;
  uniform float uRainStrength;
  uniform float uRapidsStrength;
  uniform float uSunGlow;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vElev;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  float rainRipples(vec2 uv, float t) {
    vec2 grid = uv * 9.0;
    vec2 id = floor(grid);
    vec2 f = fract(grid) - 0.5;
    float rnd = hash(id);
    float phase = fract(t * 0.55 + rnd * 6.2831);
    float dist = length(f);
    float ring = smoothstep(0.04, 0.0, abs(dist - phase * 0.44)) * (1.0 - phase);
    return ring;
  }

  void main() {
    // 원근에 따른 거리 비율 (0 = 가까운 전경, 1 = 먼 수평선)
    float distFactor = clamp((4.5 - vWorldPos.z) / 16.5, 0.0, 1.0);

    // 수묵담채 붓결 느낌의 유기적 물결 노이즈
    vec2 flowUv = vec2(vWorldPos.x * 0.28, vWorldPos.z * 0.52);
    float speed = 0.22 + uRapidsStrength * 0.55;
    float n1 = fbm(flowUv + vec2(uTime * speed * 0.45, -uTime * speed * 0.35));
    float n2 = fbm(flowUv * 2.1 - vec2(uTime * speed * 0.3, uTime * speed * 0.25));
    float ripple = smoothstep(0.38, 0.72, n1 * 0.65 + n2 * 0.35);

    // 기본 수묵 강물 색 혼합
    vec3 col = mix(uDeepColor, uShallowColor, ripple * 0.65 + distFactor * 0.35);

    // 급한 여울의 흰 물보라 수묵 결
    float foam = smoothstep(0.66, 0.86, n2 + vElev * 1.8) * uRapidsStrength;
    col = mix(col, vec3(0.87, 0.90, 0.88), foam * 0.52);

    // 강물 중앙의 은은한 여명·달빛 윤슬 반사
    float sunColumn = exp(-pow(vWorldPos.x * 0.22, 2.0)) * smoothstep(0.05, 0.82, distFactor);
    float shimmer = smoothstep(0.45, 0.85, n2) * sunColumn * uSunGlow;
    col += uSunColor * shimmer * 0.48;

    // 3연 눈비 빗방울 파문
    if (uRainStrength > 0.01) {
      float rr = rainRipples(vWorldPos.xz * 0.24, uTime) + rainRipples(vWorldPos.xz * 0.37 + 3.1, uTime * 1.2);
      col += vec3(0.75, 0.82, 0.84) * rr * uRainStrength * 0.28;
    }

    // 원경 수평선 안개 자연 융합 (딱딱한 직선 경계 완벽 제거 — 원경 강물과 한 폭의 수묵화처럼 연결)
    float horizonFade = smoothstep(0.22, 0.88, distFactor);
    col = mix(col, uSkyColor, horizonFade);

    // 가장자리 미세 수묵 비네트
    float edgeFade = smoothstep(0.86, 1.0, distFactor);
    gl_FragColor = vec4(col, 1.0 - edgeFade * 0.96);
  }
`;

function buildSoftParticleCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(248, 249, 245, 0.95)');
  grad.addColorStop(0.5, 'rgba(232, 240, 238, 0.4)');
  grad.addColorStop(1, 'rgba(232, 240, 238, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}

function buildMistVeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const puffs = [
    [130, 105, 130, 56],
    [255, 92, 165, 66],
    [380, 112, 125, 52],
  ];
  puffs.forEach(([x, y, rx, ry]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 8, 0, 0, rx);
    g.addColorStop(0, 'rgba(238, 236, 228, 0.55)');
    g.addColorStop(0.55, 'rgba(225, 228, 222, 0.22)');
    g.addColorStop(1, 'rgba(225, 228, 222, 0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  return canvas;
}

function buildBoatShadowCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.save();
  ctx.translate(256, 128);
  ctx.scale(1, 0.36);
  const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 215);
  g.addColorStop(0, 'rgba(18, 32, 38, 0.46)');
  g.addColorStop(0.58, 'rgba(22, 38, 46, 0.18)');
  g.addColorStop(1, 'rgba(22, 38, 46, 0.0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 215, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return canvas;
}

export const FerryDiorama: React.FC<FerryDioramaProps> = ({
  visual,
  observationsFound,
  onDiscoverObservation,
  showAllPins = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const visualRef = useRef<SceneVisualState>(visual);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    visualRef.current = visual;
  }, [visual]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#d2dad4');
    scene.fog = new THREE.FogExp2('#d2dad4', 0.036);

    const camera = new THREE.PerspectiveCamera(
      44,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      80,
    );
    camera.position.copy(CAM_PRESETS[visualRef.current.scene].pos);
    const currentLookAt = CAM_PRESETS[visualRef.current.scene].lookAt.clone();
    camera.lookAt(currentLookAt);

    const texLoader = new THREE.TextureLoader();

    // 1. 1926 강변 원경 파노라마 평면
    const bgGeo = new THREE.PlaneGeometry(60, 22);
    const bgMat = new THREE.MeshBasicMaterial({
      color: '#e5e8e1',
      transparent: true,
      opacity: 0.98,
      fog: true,
    });
    texLoader.load('./assets/ferry-bank-bg.webp', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      bgMat.map = tex;
      bgMat.needsUpdate = true;
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(0, 4.0, -14.2);
    scene.add(bgMesh);

    // 2. Custom GLSL 수묵담채 강물 셰이더 메시
    const waterUniforms = {
      uTime: { value: 0 },
      uWaveAmp: { value: 0.06 },
      uWaveSpeed: { value: 1.0 },
      uDeepColor: { value: new THREE.Color('#2d4d59') },
      uShallowColor: { value: new THREE.Color('#6a8b94') },
      uSkyColor: { value: new THREE.Color('#d2dad4') },
      uSunColor: { value: new THREE.Color('#f0d8a8') },
      uRainStrength: { value: 0.0 },
      uRapidsStrength: { value: 0.0 },
      uSunGlow: { value: 0.55 },
    };
    const waterGeo = new THREE.PlaneGeometry(52, 28, 64, 48);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: true,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.1, -3.6);
    scene.add(waterMesh);

    // 3. 수면 위 천천히 흐르는 2.5D 먹빛 안개 베일 2겹
    const mistTex = new THREE.CanvasTexture(buildMistVeilCanvas());
    const mistMat1 = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      color: '#e9ebe4',
    });
    const mistMat2 = mistMat1.clone();
    mistMat2.opacity = 0.28;
    const mistPlane1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 5.4), mistMat1);
    mistPlane1.position.set(-2.5, 1.35, -7.8);
    scene.add(mistPlane1);
    const mistPlane2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 5.8), mistMat2);
    mistPlane2.position.set(3.2, 1.65, -9.8);
    scene.add(mistPlane2);

    // 4. 핸드페인팅 2.5D 나룻배 그룹 (조잡한 3D 박스 완전 폐기 → 1926 수묵담채 페인팅 2겹 크로스페이드 + 흙발 데칼 + 그림자)
    const boatGroup = new THREE.Group();
    boatGroup.position.set(0, 0.05, 0.35);
    scene.add(boatGroup);

    const shadowTex = new THREE.CanvasTexture(buildBoatShadowCanvas());
    const boatShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const boatShadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.7), boatShadowMat);
    boatShadowMesh.rotation.x = -Math.PI / 2;
    boatShadowMesh.position.set(0, -0.05, 0.05);
    boatGroup.add(boatShadowMesh);

    const createSpritePlane = (src: string, w: number, h: number, initialOp = 0) => {
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: initialOp,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      texLoader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.needsUpdate = true;
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      return { mesh, mat };
    };

    // 새 나룻배 (결 0) ↔ 낡아가는 나룻배 (결 1~4, 판자 위 원근 흙발 포함) 매끄러운 크로스페이드
    const boatFresh = createSpritePlane('./assets/boat-fresh.webp', 5.05, 3.35, 1.0);
    boatFresh.mesh.position.set(0, 1.05, 0.0);
    boatFresh.mesh.renderOrder = 2;
    boatGroup.add(boatFresh.mesh);

    const boatWeathered = createSpritePlane('./assets/boat-weathered.webp', 5.05, 3.35, 0.0);
    boatWeathered.mesh.position.set(0, 1.05, 0.02);
    boatWeathered.mesh.renderOrder = 3;
    boatGroup.add(boatWeathered.mesh);

    // 행인 앞/뒷모습 빌보드 (선체 갑판 중앙에 발이 자연스럽게 닿고 모자 상단 여백 확보)
    const passerbyFront = createSpritePlane('./assets/passerby-front.webp', 1.72, 2.08, 0.0);
    passerbyFront.mesh.position.set(-0.28, 1.66, 0.14);
    passerbyFront.mesh.renderOrder = 4;
    boatGroup.add(passerbyFront.mesh);

    const passerbyBack = createSpritePlane('./assets/passerby-back.webp', 1.78, 2.12, 0.0);
    passerbyBack.mesh.position.set(0.35, 1.38, -4.6);
    passerbyBack.mesh.renderOrder = 4;
    scene.add(passerbyBack.mesh);

    // 5. 눈비·여명 입자 (부드러운 원형 그라데이션)
    const particleCount = window.innerWidth < 768 ? 110 : 190;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 16;
      pPositions[i * 3 + 1] = Math.random() * 8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleTex = new THREE.CanvasTexture(buildSoftParticleCanvas());
    const pMat = new THREE.PointsMaterial({
      color: '#f2f5f2',
      map: particleTex,
      size: 0.15,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      opacity: 0.0,
    });
    const weatherParticles = new THREE.Points(pGeo, pMat);
    scene.add(weatherParticles);

    const targetSky = new THREE.Color('#d2dad4');
    const targetDeep = new THREE.Color('#2d4d59');
    const targetShallow = new THREE.Color('#6a8b94');
    const targetSun = new THREE.Color('#f0d8a8');
    const targetBgTint = new THREE.Color('#e5e8e1');
    let lastPulseSeen = visualRef.current.resonancePulse;
    let pulseBoost = 0;
    const clock = new THREE.Clock();
    let rafId = 0;

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();
      const v = visualRef.current;

      // 0) 시어 공명 펄스 감지 → 3D 수면 금빛 윤슬 확장 + 금박 입자 부상
      if (v.resonancePulse !== lastPulseSeen) {
        lastPulseSeen = v.resonancePulse;
        pulseBoost = Math.min(1.0, 0.55 + v.resonanceChain * 0.12);
      }
      if (pulseBoost > 0.005) {
        pulseBoost = Math.max(0, pulseBoost - dt * 0.72);
      }

      // 1) 헌신의 결 0~4에 따른 새 배 ↔ 낡은 배 (원근 흙발 포함) 단계적 크로스페이드
      const weatherSteps = [0.0, 0.42, 0.68, 0.86, 1.0];
      const weatherBlend = weatherSteps[Math.min(4, Math.max(0, Math.round(v.grainLevel)))] ?? 0;
      if (boatFresh.mat.map) {
        const targetFreshOp = 1.0 - weatherBlend * 0.95;
        boatFresh.mat.opacity += (targetFreshOp - boatFresh.mat.opacity) * dt * 2.8;
      }
      if (boatWeathered.mat.map) {
        boatWeathered.mat.opacity += (weatherBlend - boatWeathered.mat.opacity) * dt * 2.8;
      }

      // 2) 시간대·어조·상징 렌즈에 따른 수묵 색감/조명 실시간 보간
      let targetRain = 0;
      let targetRapids = 0;
      let targetSunGlow = 0.55;

      if (v.tonePreview === 'resentment') {
        targetSky.set('#805756');
        targetDeep.set('#46242a');
        targetShallow.set('#7a4347');
        targetSun.set('#d97d6b');
        targetBgTint.set('#a87c79');
        targetRapids = 0.85;
        targetSunGlow = 0.25;
      } else if (v.tonePreview === 'dry') {
        targetSky.set('#b4b8b8');
        targetDeep.set('#4a5357');
        targetShallow.set('#7b8386');
        targetSun.set('#cfd4d4');
        targetBgTint.set('#bfc3c2');
        targetSunGlow = 0.12;
      } else if (v.tonePreview === 'honorific') {
        targetSky.set('#ced8d4');
        targetDeep.set('#446b77');
        targetShallow.set('#8ca9ae');
        targetSun.set('#f0d8a8');
        targetBgTint.set('#e6e9e1');
        targetSunGlow = 0.72;
      } else if (v.timeOfDay === 'night') {
        const p = v.holdProgress;
        targetRain = 0.95;
        if (p < 0.5) {
          targetSky.set('#222e3d').lerp(new THREE.Color('#4a5869'), p * 2);
          targetDeep.set('#1c2c3a').lerp(new THREE.Color('#2f4759'), p * 2);
          targetShallow.set('#385063').lerp(new THREE.Color('#5a7587'), p * 2);
          targetBgTint.set('#4c5c6e').lerp(new THREE.Color('#7a8796'), p * 2);
          targetSun.set('#9cb2c9');
          targetSunGlow = 0.25 + p * 0.3;
        } else {
          const q = (p - 0.5) * 2;
          targetSky.set('#4a5869').lerp(new THREE.Color('#c2cccb'), q);
          targetDeep.set('#2f4759').lerp(new THREE.Color('#4b6e7a'), q);
          targetShallow.set('#5a7587').lerp(new THREE.Color('#8ea9b0'), q);
          targetBgTint.set('#7a8796').lerp(new THREE.Color('#d2dad4'), q);
          targetSun.set('#dbe0d8');
          targetSunGlow = 0.4 + q * 0.25;
        }
      } else if (v.timeOfDay === 'dawn') {
        targetSky.set('#2b3646').lerp(new THREE.Color('#e3c798'), v.dawnReveal);
        targetDeep.set('#233847').lerp(new THREE.Color('#4e6e7a'), v.dawnReveal);
        targetShallow.set('#465f70').lerp(new THREE.Color('#b0b39f'), v.dawnReveal);
        targetSun.set('#f2c879');
        targetBgTint.set('#5a6473').lerp(new THREE.Color('#f0dec0'), v.dawnReveal);
        targetRain = v.dawnReveal < 0.4 ? 0.55 : 0.0;
        targetSunGlow = 0.2 + v.dawnReveal * 0.95;
      } else if (v.timeOfDay === 'overcast') {
        targetSky.set('#b4bfbd');
        targetDeep.set(v.waterDepth === 'rapids' ? '#2c5160' : '#436975');
        targetShallow.set(v.waterDepth === 'rapids' ? '#6d8e98' : '#8ba8ae');
        targetBgTint.set('#d2d8d3');
        targetSun.set('#dfe2d8');
        targetRapids = v.waterDepth === 'rapids' ? 0.92 : v.waterDepth === 'deep' ? 0.42 : 0.12;
        targetSunGlow = 0.36;
      } else if (v.timeOfDay === 'clearMorning') {
        targetSky.set('#e2ddd0');
        targetDeep.set('#476f7c');
        targetShallow.set('#96b2b5');
        targetSun.set('#f5dfb0');
        targetBgTint.set('#f0ebe0');
        targetSunGlow = 0.82;
      } else {
        targetSky.set('#d6ded8');
        targetDeep.set('#496f7a');
        targetShallow.set('#93afb3');
        targetSun.set('#f2dbb0');
        targetBgTint.set('#e8ebe2');
        targetSunGlow = 0.65;
      }

      if (v.activeLens === 'lover') {
        targetSky.lerp(new THREE.Color('#dfc0c0'), 0.38);
        targetSun.set('#f4c4be');
      } else if (v.activeLens === 'nation') {
        targetSky.lerp(new THREE.Color('#7a94a8'), 0.32);
        targetSun.set('#f0c878');
      } else if (v.activeLens === 'buddhism') {
        targetSky.lerp(new THREE.Color('#ddd0ad'), 0.38);
        targetSun.set('#f2d68d');
      }

      (scene.background as THREE.Color).lerp(targetSky, dt * 2.5);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(targetSky, dt * 2.5);
      }
      bgMat.color.lerp(targetBgTint, dt * 2.5);
      waterUniforms.uDeepColor.value.lerp(targetDeep, dt * 2.5);
      waterUniforms.uShallowColor.value.lerp(targetShallow, dt * 2.5);
      waterUniforms.uSkyColor.value.lerp(targetSky, dt * 2.5);
      waterUniforms.uSunColor.value.lerp(targetSun, dt * 2.5);
      waterUniforms.uRainStrength.value += (targetRain - waterUniforms.uRainStrength.value) * dt * 2.4;
      waterUniforms.uRapidsStrength.value += (targetRapids - waterUniforms.uRapidsStrength.value) * dt * 2.4;
      const boostedSunGlow = targetSunGlow + pulseBoost * 0.75;
      waterUniforms.uSunGlow.value += (boostedSunGlow - waterUniforms.uSunGlow.value) * dt * 3.2;

      // 3) 물결 진폭·속도 & 배 부력 물리
      let waveAmp = 0.05;
      let waveSpeed = 1.05;
      if (v.tonePreview === 'resentment') {
        waveAmp = 0.16;
        waveSpeed = 2.8;
      } else if (v.tonePreview === 'dry') {
        waveAmp = 0.015;
        waveSpeed = 0.45;
      } else if (v.waterDepth === 'rapids') {
        waveAmp = v.isHolding ? 0.11 : 0.16;
        waveSpeed = 2.4;
      } else if (v.waterDepth === 'deep') {
        waveAmp = 0.09;
        waveSpeed = 1.65;
      }
      if (prefersReducedMotion) {
        waveAmp *= 0.2;
        waveSpeed *= 0.25;
      }
      waterUniforms.uTime.value = t;
      waterUniforms.uWaveAmp.value += (waveAmp - waterUniforms.uWaveAmp.value) * dt * 3;
      waterUniforms.uWaveSpeed.value += (waveSpeed - waterUniforms.uWaveSpeed.value) * dt * 3;

      const sway = prefersReducedMotion ? 0.01 : waveAmp * 0.9;
      const holdSteady = v.isHolding ? 0.5 : 1.0;
      boatGroup.position.y = 0.04 + Math.sin(t * 1.45) * sway * holdSteady;
      boatGroup.rotation.z =
        Math.sin(t * 1.15) * (sway * 0.48 * holdSteady) + v.boatTilt * 0.09;
      const targetBoatZ = v.scene === 'stanza2' ? 0.35 - v.holdProgress * 1.35 : 0.35;
      boatGroup.position.z += (targetBoatZ - boatGroup.position.z) * dt * 2.4;

      // 안개 베일 미세 표류
      if (!prefersReducedMotion) {
        mistPlane1.position.x = -2.5 + Math.sin(t * 0.14) * 1.6;
        mistPlane2.position.x = 3.2 + Math.cos(t * 0.11) * 1.8;
      }
      mistMat1.color.copy(targetSky).lerp(new THREE.Color('#ffffff'), 0.25);
      mistMat2.color.copy(mistMat1.color);

      // 4) 행인 빌보드 연출
      const showFront =
        v.passerbyState === 'distant' ||
        v.passerbyState === 'boarding' ||
        v.passerbyState === 'onboard';
      const showBack = v.passerbyState === 'departing';
      if (passerbyFront.mat.map) {
        const targetFrontOp = showFront ? 0.96 : 0;
        passerbyFront.mat.opacity += (targetFrontOp - passerbyFront.mat.opacity) * dt * 3.5;
        const targetFrontX = v.passerbyState === 'distant' ? -1.45 : -0.28;
        const targetFrontY = v.passerbyState === 'distant' ? 1.8 : 1.66;
        passerbyFront.mesh.position.x += (targetFrontX - passerbyFront.mesh.position.x) * dt * 2.4;
        passerbyFront.mesh.position.y += (targetFrontY - passerbyFront.mesh.position.y) * dt * 2.4;
      }
      if (passerbyBack.mat.map) {
        const targetBackOp = showBack ? 0.9 : 0;
        passerbyBack.mat.opacity += (targetBackOp - passerbyBack.mat.opacity) * dt * 3;
        const targetBackZ = v.scene === 'stanza3' ? -4.3 - v.holdProgress * 3.2 : -4.3;
        passerbyBack.mesh.position.z += (targetBackZ - passerbyBack.mesh.position.z) * dt * 1.5;
      }

      // 5) 눈비·여명·시어 공명 금박 입자
      const baseParticleOp =
        v.weather === 'snowRain' ? 0.72 : v.weather === 'wind' ? 0.24 : v.dawnReveal > 0.5 ? 0.32 : 0.0;
      const targetParticleOp = Math.min(0.85, baseParticleOp + pulseBoost * 0.52);
      pMat.opacity += (targetParticleOp - pMat.opacity) * dt * 3.0;
      const isGoldMotes = (pulseBoost > 0.12 || v.dawnReveal > 0.5) && v.weather !== 'snowRain';
      pMat.color.set(isGoldMotes ? '#f5d996' : '#f2f5f2');
      pMat.size = isGoldMotes ? 0.19 : 0.15;
      if (pMat.opacity > 0.02 && !prefersReducedMotion) {
        const arr = pGeo.attributes.position.array as Float32Array;
        const fallSpeed =
          v.weather === 'snowRain' ? 2.5 : isGoldMotes ? -0.55 - pulseBoost * 0.6 : 0.7;
        for (let i = 0; i < particleCount; i++) {
          arr[i * 3] -= dt * (v.weather === 'snowRain' ? 1.15 : 0.25);
          arr[i * 3 + 1] -= dt * fallSpeed;
          if (arr[i * 3 + 1] < 0) {
            arr[i * 3 + 1] = 7.5;
            arr[i * 3] = (Math.random() - 0.5) * 16;
          } else if (arr[i * 3 + 1] > 7.8) {
            arr[i * 3 + 1] = 0.2;
          }
          if (arr[i * 3] < -8) arr[i * 3] = 8;
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      // 6) 카메라 부드러운 이동 (1연 ↔ 5연 완벽 동일 구도 회귀)
      const preset = CAM_PRESETS[v.scene] ?? CAM_STANZA_1;
      const isSidePanelScene =
        container.clientWidth >= 840 && v.scene !== 'title' && v.scene !== 'result';
      const targetCamPos = preset.pos.clone();
      const targetCamLook = preset.lookAt.clone();
      if (isSidePanelScene) {
        targetCamPos.x += 1.05;
        targetCamLook.x += 1.15;
      }
      camera.position.lerp(targetCamPos, dt * 2.3);
      currentLookAt.lerp(targetCamLook, dt * 2.3);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      waterGeo.dispose();
      waterMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      mistTex.dispose();
      mistMat1.dispose();
      mistMat2.dispose();
      shadowTex.dispose();
      boatShadowMat.dispose();
      pGeo.dispose();
      particleTex.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  const activeStanzaNum =
    visual.scene === 'stanza1'
      ? 1
      : visual.scene === 'stanza2'
        ? 2
        : visual.scene === 'stanza3'
          ? 3
          : visual.scene === 'stanza4'
            ? 4
            : visual.scene === 'stanza5'
              ? 5
              : null;

  const visibleObservations = showAllPins
    ? OBSERVATION_NOTES
    : activeStanzaNum
      ? OBSERVATION_NOTES.filter((n) => n.stanza === activeStanzaNum)
      : [];

  const activeLensData = visual.activeLens
    ? SYMBOLIC_LENSES.find((l) => l.id === visual.activeLens)
    : null;

  return (
    <div className="diorama-root" aria-hidden={visibleObservations.length === 0}>
      {!webglFailed ? (
        <div ref={mountRef} className="diorama-webgl" />
      ) : (
        <div
          className={`diorama-fallback tone-${visual.tonePreview ?? 'none'} time-${visual.timeOfDay}`}
        >
          <img
            src="./assets/ferry-bank-bg.webp"
            alt="1926년 한국 강변 나루터 원경"
            className="fallback-bg"
          />
          <div className="fallback-water" />
          <img
            src={visual.grainLevel >= 2 ? './assets/boat-weathered.webp' : './assets/boat-fresh.webp'}
            alt="1926년 목조 평저선 나룻배"
            className="fallback-boat-img"
          />
          {visual.passerbyState === 'onboard' || visual.passerbyState === 'boarding' ? (
            <img src="./assets/passerby-front.webp" alt="" className="fallback-passerby" />
          ) : null}
          {visual.passerbyState === 'departing' ? (
            <img src="./assets/passerby-back.webp" alt="" className="fallback-passerby departing" />
          ) : null}
        </div>
      )}

      {/* 화면 가장자리에 자연스럽게 고정된 수묵 버드나무·갈대 전경 액자 (잘린 바닥선 없음) */}
      <img
        src="./assets/willow-frame.webp"
        alt=""
        className={`willow-vignette ${visual.weather === 'snowRain' ? 'is-windy' : ''}`}
      />

      {/* 수묵 한지 감성 미세 비네트 */}
      <div className="atmosphere-vignette" />

      {/* 3중 상징 렌즈 반투명 한지 오버레이 */}
      {activeLensData ? (
        <div
          className="lens-atmosphere-overlay"
          style={{ background: activeLensData.overlayTint }}
        />
      ) : null}

      {/* 은은한 금빛 수면 파문 관찰 지점 (검은 알약 뱃지 대신 게임 내 다이애제틱 파문) */}
      {visibleObservations.map((obs) => {
        const found = observationsFound.includes(obs.id);
        return (
          <button
            key={obs.id}
            type="button"
            className={`obs-ripple-pin ${found ? 'is-found' : ''}`}
            style={{ left: `${obs.screenPos.x}%`, top: `${obs.screenPos.y}%` }}
            onClick={() => onDiscoverObservation(obs)}
            aria-label={`1926 나루터 세밀 관찰: ${obs.shortLabel}`}
            title={obs.title}
          >
            <span className="obs-ripple-ring" />
            <span className="obs-ripple-core" />
            <span className="obs-ripple-caption">
              {found ? `✓ ${obs.shortLabel}` : obs.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
