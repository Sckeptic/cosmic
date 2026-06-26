/* portal.js — WebGL cosmic portal for the Star Map center connection */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_music;

/* ─── HASH & NOISE ─────────────────────────────────────────────── */
float h11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  return fract(p * (p + p));
}
float h21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 h22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = h21(i), b = h21(i + vec2(1,0));
  float c = h21(i + vec2(0,1)), d = h21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}

/* ─── STAR FIELD ────────────────────────────────────────────────── */
float starField(vec2 uv, float scale, float seed) {
  vec2 cell  = floor(uv * scale);
  vec2 local = fract(uv * scale) - 0.5;
  float h = h21(cell + seed * 13.7);
  if (h < 0.82) return 0.0;
  vec2  pos  = (h22(cell + seed * 7.1) - 0.5) * 0.85;
  float dist = length(local - pos);
  float bright  = (h - 0.82) / 0.18;
  float twinkle = 0.55 + 0.45 * sin(u_time * (1.5 + h * 5.0) + h * 6.28318);
  return bright * twinkle * exp(-dist * (25.0 + bright * 55.0));
}

/* ─── MAIN ──────────────────────────────────────────────────────── */
void main() {
  /* Pixel-space coordinates — makes circle math resolution-independent */
  vec2 center = u_res * 0.5;
  vec2 pix    = gl_FragCoord.xy - center;
  float R     = min(u_res.x, u_res.y) * 0.44;
  float r     = length(pix);
  float nr    = r / R;           /* 0=center, 1=portal edge */
  vec2  uv    = pix / R;         /* aspect-correct, portal boundary = length 1 */
  float ang   = atan(uv.y, uv.x);

  float t  = u_time;
  vec2  m  = u_mouse * 0.10;    /* camera tilt from mouse */

  /* ═══════════════════════════════════════════════════════════════ */
  /* OUTSIDE PORTAL                                                   */
  /* ═══════════════════════════════════════════════════════════════ */
  if (nr > 1.0) {
    float d = nr - 1.0;
    /* Inner golden rim */
    float rim      = exp(-d * R * 0.55) * (0.65 + 0.35 * sin(t * 1.7 + 0.5));
    /* Outer diffused glow */
    float outerPink  = exp(-d * R * 0.10) * 0.28;
    float outerBlue  = exp(-d * R * 0.07) * 0.15;
    /* Rotating sparkles */
    float sp1 = pow(max(0.0, sin(ang * 7.0  + t * 2.8)), 14.0) * 0.55;
    float sp2 = pow(max(0.0, sin(ang * 11.0 - t * 1.9)), 18.0) * 0.35;
    float sp3 = pow(max(0.0, sin(ang * 4.0  + t * 1.1)), 10.0) * 0.20;

    vec3 col = vec3(1.0, 0.88, 0.26) * (rim + sp1 + sp2 + sp3);
    col += vec3(0.68, 0.12, 0.42) * outerPink;
    col += vec3(0.25, 0.20, 0.65) * outerBlue;

    float a = clamp(rim * 2.2 + outerPink + sp1 + sp2, 0.0, 1.0);
    gl_FragColor = vec4(col * a, a);
    return;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* INSIDE PORTAL — the living universe                              */
  /* ═══════════════════════════════════════════════════════════════ */
  vec3 col = vec3(0.0);

  /* Breathing / camera motion */
  float breathe = 0.006 * sin(t * 0.68) + 0.004 * sin(t * 1.23);
  vec2  cam     = m + vec2(breathe, breathe * 0.7);

  /* ─ DEEP BACKGROUND NEBULA (very far, large scale) ─────────────── */
  {
    float rot = t * 0.009;
    float cr = cos(rot), sr = sin(rot);
    vec2 p = vec2(cr*uv.x - sr*uv.y, sr*uv.x + cr*uv.y) * 0.38 + cam * 0.15;
    float n1 = fbm(p + 0.5);
    float n2 = fbm(p * 1.6 + vec2(3.73, 1.18));
    float n3 = fbm(p * 0.55 + vec2(1.1, 5.3) + t * 0.006);
    col += vec3(0.04, 0.01, 0.10) * n1 * 2.0;
    col += vec3(0.02, 0.04, 0.14) * n2 * 1.6;
    col += vec3(0.10, 0.02, 0.07) * n3 * 1.8;
  }

  /* ─ MID NEBULA (flowing, rosette) ──────────────────────────────── */
  {
    float rot = t * 0.022;
    float cr = cos(rot), sr = sin(rot);
    vec2 p = vec2(cr*uv.x - sr*uv.y, sr*uv.x + cr*uv.y) * 0.68 + cam * 0.45;
    p += vec2(sin(t*0.031)*0.25, cos(t*0.019)*0.22);
    float n  = fbm(p);
    float n2 = fbm(p * 1.9 + vec2(2.3, 0.7));
    float mask = smoothstep(0.28, 0.72, n);
    col += vec3(0.28, 0.05, 0.18) * mask * 1.1;
    col += vec3(0.07, 0.03, 0.22) * n2 * 0.75;
    col += vec3(0.16, 0.10, 0.30) * n * n * 0.65;
  }

  /* ─ CLOSE NEBULA (bright, streaks) ─────────────────────────────── */
  {
    float rot = -t * 0.016;
    float cr = cos(rot), sr = sin(rot);
    vec2 p = vec2(cr*uv.x - sr*uv.y, sr*uv.x + cr*uv.y) * 1.15 + cam * 0.75;
    p += vec2(1.7, 0.3);
    float n  = fbm(p);
    float n2 = fbm(p * 0.75 + vec2(2.0, 0.5));
    float streak = pow(max(0.0, n - 0.38) * (1.0/0.62), 2.2);
    col += vec3(0.38, 0.10, 0.22) * streak * 0.85;
    col += vec3(0.12, 0.22, 0.48) * max(0.0, n2 - 0.48) * 0.95;
  }

  /* ─ GALAXY SPIRAL ───────────────────────────────────────────────── */
  {
    float gRot = t * 0.055 + m.x * 1.8;
    vec2  gUV  = uv + cam * 0.55;
    float gAng = atan(gUV.y, gUV.x) + gRot;
    float gR   = length(gUV);

    /* Two spiral arms using wrapped-gaussian on angle */
    float arm = 0.0;
    for (int a = 0; a < 2; a++) {
      float aOff   = float(a) * 3.14159265;
      float dAng   = mod(gAng + aOff - gR * 2.8, 6.28318) - 3.14159265;
      float density = exp(-dAng * dAng * 4.5);
      arm = max(arm, density);
    }
    /* Radial falloff */
    float radFade = exp(-gR * 1.9) * smoothstep(1.3, 0.05, gR);
    float spiral  = arm * radFade;

    /* Core bulge */
    float core = exp(-gR * 4.5) * (0.85 + 0.15 * sin(t * 1.8));

    /* Arm color: golden core → blue-violet arms */
    vec3 armCol  = mix(vec3(0.85, 0.70, 1.0), vec3(0.4, 0.28, 0.85), clamp(gR*2.0,0.0,1.0));
    vec3 coreCol = mix(vec3(1.0, 0.92, 0.60), vec3(1.0, 0.75, 0.35), clamp(gR*3.0,0.0,1.0));

    col += coreCol * core * 3.0;
    col += armCol  * spiral * 1.6;

    /* Inter-arm dust darkening */
    col *= 1.0 - arm * 0.18;
  }

  /* ─ STAR LAYERS (6 depth slices) ───────────────────────────────── */
  {
    vec2 sBase = uv + cam;
    /* Very deep stars — tiny, blue-white */
    col += vec3(0.65, 0.78, 1.00) * starField(sBase * 0.45, 14.0, 0.0) * 0.55;
    col += vec3(0.80, 0.88, 1.00) * starField(sBase * 0.55, 10.0, 1.0) * 0.65;
    /* Mid stars */
    col += vec3(0.92, 0.94, 1.00) * starField(sBase * 0.85,  7.0, 2.0) * 0.85;
    col += vec3(1.00, 0.93, 0.75) * starField(sBase * 1.00,  5.0, 3.0) * 0.90;
    /* Close stars — warm/bright */
    col += vec3(1.00, 0.97, 0.90) * starField(sBase * 1.40,  3.5, 4.0) * 1.20;
    /* Foreground bright stars */
    float fs = starField(sBase * 1.85, 2.5, 5.0);
    col += vec3(1.00, 1.00, 0.95) * fs * 1.80;
    /* Cross-diffraction on the brightest foreground stars */
    if (fs > 0.35) {
      vec2 toStar = uv + cam;   /* approximate — works well for sparse stars */
      float spike = exp(-abs(toStar.y) * 28.0) * exp(-abs(length(toStar)-0.18)*12.0)
                  + exp(-abs(toStar.x) * 28.0) * exp(-abs(length(toStar)-0.18)*12.0);
      col += vec3(0.85, 0.92, 1.0) * spike * fs * 0.30;
    }
  }

  /* ─ GOLDEN ENERGY PARTICLES ─────────────────────────────────────── */
  {
    float mR = 1.0 + u_music * 0.35;
    for (int i = 0; i < 8; i++) {
      float fi  = float(i);
      float ph  = h11(fi * 0.1372 + 0.05);
      float spd = 0.07 + ph * 0.07;
      float life = fract(t * spd + ph);

      /* Spiral outward from center */
      float pAng = ph * 6.28318 + life * 3.5 + t * 0.18;
      float pR   = life * 0.82 * mR;
      vec2  pPos = vec2(cos(pAng), sin(pAng)) * pR + cam * 0.25;

      float pd   = length(uv - pPos);
      float sz   = 0.035 + ph * 0.035;
      float glow = exp(-pd / sz) * (1.0 - life * life) * (0.55 + u_music * 0.55);

      vec3 pCol = mix(vec3(1.00, 0.68, 0.08), vec3(1.00, 0.95, 0.55), life);
      col += pCol * glow * 1.0;
    }
  }

  /* ─ ORBITING PLANETS ────────────────────────────────────────────── */
  {
    /* Planet 1 — icy blue, inner orbit */
    float p1A = t * 0.11 + 1.2;
    vec2  p1  = vec2(cos(p1A), sin(p1A)) * 0.38 + cam * 0.35;
    float p1D = length(uv - p1);
    float p1R = 0.055;
    if (p1D < p1R * 3.0) {
      float body = smoothstep(p1R, p1R * 0.75, p1D);
      float atmo = exp(-p1D / (p1R * 1.2)) * 0.45;
      col += vec3(0.25, 0.50, 0.92) * body * 1.3;
      col += vec3(0.45, 0.65, 1.00) * atmo;
    }
    /* Moon of planet 1 */
    float mA = t * 0.55 + 0.8;
    vec2  mPos = p1 + vec2(cos(mA), sin(mA)) * p1R * 2.2;
    float mD = length(uv - mPos);
    float mR = p1R * 0.30;
    col += vec3(0.8, 0.82, 0.84) * smoothstep(mR, mR*0.5, mD) * 0.8;

    /* Planet 2 — warm amber, outer elliptic orbit */
    float p2A = -t * 0.065 + 3.5;
    vec2  p2  = vec2(cos(p2A) * 0.65, sin(p2A) * 0.42) + cam * 0.55;
    float p2D = length(uv - p2);
    float p2R = 0.040;
    if (p2D < p2R * 3.0) {
      float body = smoothstep(p2R, p2R * 0.75, p2D);
      float atmo = exp(-p2D / (p2R * 1.3)) * 0.35;
      col += vec3(0.82, 0.42, 0.18) * body * 1.2;
      col += vec3(0.92, 0.55, 0.22) * atmo;
    }

    /* Planet 3 — violet gas giant, slow distant orbit */
    float p3A = t * 0.038 + 5.8;
    vec2  p3  = vec2(cos(p3A) * 0.72, sin(p3A) * 0.68) + cam * 0.70;
    float p3D = length(uv - p3);
    float p3R = 0.062;
    if (p3D < p3R * 3.0) {
      float body = smoothstep(p3R, p3R * 0.78, p3D);
      float atmo = exp(-p3D / (p3R * 1.4)) * 0.40;
      /* Ring — elliptical disc around planet */
      float ringR = length(vec2(uv.x - p3.x, (uv.y - p3.y) * 2.2));
      float ring  = smoothstep(p3R*1.6, p3R*1.55, ringR)
                  * smoothstep(p3R*2.1, p3R*2.15, ringR);
      col += vec3(0.45, 0.20, 0.72) * body * 1.3;
      col += vec3(0.58, 0.35, 0.85) * atmo;
      col += vec3(0.72, 0.60, 0.88) * ring * 0.65;
    }
  }

  /* ─ COMET (occasional fly-through) ─────────────────────────────── */
  {
    float cT    = fract(t * 0.038 + 0.55);
    vec2  cDir  = normalize(vec2(2.0, -0.8));
    vec2  cPos  = vec2(-1.3, 0.55 + sin(t * 0.09) * 0.15) + cDir * cT * 3.2;
    cPos += cam * 0.4;
    float cD    = length(uv - cPos);
    float cTail = max(0.0, dot(uv - cPos, -cDir));
    float head  = exp(-cD * 40.0);
    float tail  = exp(-(cD + cTail * 0.18) * 13.0) * 0.45;
    float cVis  = smoothstep(0.0, 0.08, cT) * smoothstep(1.0, 0.92, cT);
    col += vec3(0.85, 0.93, 1.0) * (head + tail) * cVis * 0.95;
  }

  /* ─ ASTEROIDS (tiny drifting rocks) ────────────────────────────── */
  {
    for (int i = 0; i < 4; i++) {
      float fi  = float(i);
      float ph  = h11(fi * 0.237 + 0.3);
      float aA  = t * (0.04 + ph * 0.06) + ph * 6.28318;
      float aR  = 0.45 + ph * 0.35;
      vec2  aPos = vec2(cos(aA) * aR, sin(aA) * aR * 0.7) + cam * 0.5;
      float aD  = length(uv - aPos);
      float aSz = 0.012 + ph * 0.010;
      col += vec3(0.55, 0.50, 0.45) * smoothstep(aSz, aSz*0.3, aD) * 0.7;
    }
  }

  /* ─ COSMIC DUST STREAMS ─────────────────────────────────────────── */
  {
    vec2  dp = uv * 2.0 + cam * 1.2;
    float du = fbm(dp + t * 0.015);
    float dv = fbm(dp + vec2(du * 0.4, 0.3) + t * 0.012);
    float dust = pow(max(0.0, dv - 0.42), 1.8) * 0.6;
    col += vec3(0.40, 0.28, 0.55) * dust;
  }

  /* ─ GRAVITATIONAL LENSING NEAR RIM ─────────────────────────────── */
  {
    float lensZone = smoothstep(0.62, 1.0, nr);
    if (lensZone > 0.0) {
      /* Sample slightly displaced UV — distortion increases toward rim */
      float distStr = lensZone * lensZone * 0.08;
      vec2  distUV  = uv * (1.0 + distStr * sin(ang * 3.0 + t * 0.5));
      float dN = fbm(distUV * 1.3 + t * 0.018);
      col += vec3(0.28, 0.10, 0.18) * dN * lensZone * 0.5;
    }
  }

  /* ─ INNER RIM GLOW ──────────────────────────────────────────────── */
  {
    float inner = exp(-pow((nr - 0.90) * 18.0, 2.0))
                * (0.65 + 0.35 * sin(t * 2.1 + ang * 3.0));
    col += vec3(1.00, 0.87, 0.35) * inner * 0.75;
    /* Thin bright ring at edge */
    float edge = exp(-pow((nr - 0.97) * 40.0, 2.0)) * 1.2;
    col += vec3(1.0, 0.95, 0.60) * edge;
  }

  /* ─ CENTER EYE GLOW ─────────────────────────────────────────────── */
  {
    float eye = exp(-nr * nr * 2.2) * (0.12 + 0.05 * sin(t * 0.82));
    col += vec3(0.75, 0.65, 1.0) * eye;
  }

  /* ─ PORTAL VIGNETTE (depth falloff toward edge) ─────────────────── */
  float vig = smoothstep(1.0, 0.35, nr);
  col *= 0.18 + 0.82 * vig;

  /* ─ BREATHING BRIGHTNESS + MUSIC PULSE ─────────────────────────── */
  col *= 1.0 + 0.05 * sin(t * 0.65) + u_music * 0.18;

  /* ─ FILMIC TONE MAPPING ─────────────────────────────────────────── */
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = clamp(col, 0.0, 1.0);
  /* Slight gamma lift for luminosity */
  col = pow(col, vec3(0.88));

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ─── 2D CANVAS FALLBACK ────────────────────────────────────────────────── */
function initPortal2D(canvas, getShared) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let running = true;
  let t0 = performance.now();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(canvas.clientWidth  * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  }
  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  resize();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R  = Math.min(W, H) * 0.42;
    const t  = (performance.now() - t0) / 1000;
    const music = getShared?.()?.musicReactive ?? 0;
    const pulse = 0.75 + 0.25 * Math.sin(t * 1.2) + music * 0.2;

    ctx.clearRect(0, 0, W, H);

    /* Deep space fill inside circle */
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0,    `rgba(30,10,55,${0.9 * pulse})`);
    bg.addColorStop(0.4,  `rgba(15,5,35,0.95)`);
    bg.addColorStop(0.75, `rgba(8,3,20,0.98)`);
    bg.addColorStop(1,    `rgba(3,1,10,1)`);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();

    /* Nebula swirls */
    for (let i = 0; i < 3; i++) {
      const a = t * (0.08 + i * 0.03) + (i * Math.PI * 2) / 3;
      const nx = cx + Math.cos(a) * R * 0.28;
      const ny = cy + Math.sin(a) * R * 0.22;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, R * 0.55);
      const c  = i === 0 ? '90,20,60' : i === 1 ? '20,15,80' : '50,10,70';
      ng.addColorStop(0,   `rgba(${c},0.18)`);
      ng.addColorStop(0.5, `rgba(${c},0.07)`);
      ng.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = ng;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }

    /* Stars */
    for (let i = 0; i < 60; i++) {
      const h   = (Math.sin(i * 127.1) * 0.5 + 0.5);
      const sx  = cx + (Math.sin(i * 43.3) * 0.85) * R;
      const sy  = cy + (Math.cos(i * 59.7) * 0.85) * R;
      const sr  = 0.5 + h * 1.2;
      const twk = 0.5 + 0.5 * Math.sin(t * (1.5 + h * 4) + h * 6.28);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${0.6 * twk})`;
      ctx.fill();
    }

    /* Golden energy particles */
    for (let i = 0; i < 5; i++) {
      const ph   = (i / 5);
      const life = (t * 0.12 + ph) % 1;
      const ang  = ph * Math.PI * 2 + life * 3 + t * 0.2;
      const pr   = life * R * 0.75;
      const px   = cx + Math.cos(ang) * pr;
      const py   = cy + Math.sin(ang) * pr;
      const pg   = ctx.createRadialGradient(px, py, 0, px, py, 6);
      pg.addColorStop(0,   `rgba(255,200,60,${(1 - life) * 0.9})`);
      pg.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();
    }

    ctx.restore();

    /* Portal rim — golden ring */
    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.12);
    rimGrad.addColorStop(0,    'transparent');
    rimGrad.addColorStop(0.35, `rgba(247,201,72,${0.6 * pulse})`);
    rimGrad.addColorStop(0.55, `rgba(255,230,100,${0.9 * pulse})`);
    rimGrad.addColorStop(0.75, `rgba(247,201,72,${0.5 * pulse})`);
    rimGrad.addColorStop(1,    'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    /* Outer glow */
    const outerGlow = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.45);
    outerGlow.addColorStop(0,   `rgba(180,50,120,${0.18 * pulse})`);
    outerGlow.addColorStop(0.5, `rgba(100,30,160,0.08)`);
    outerGlow.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();
  }

  requestAnimationFrame(frame);
  return {
    destroy() { running = false; ro?.disconnect(); },
  };
}

/* ─── WEBGL PORTAL ──────────────────────────────────────────────────────── */
export function initPortal(canvas, getShared) {
  if (!canvas) return null;

  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: false,
    antialias: false,
    powerPreference: 'high-performance',
  });
  if (!gl) {
    return initPortal2D(canvas, getShared);
  }

  /* ── Compile ── */
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[portal] shader error:', gl.getShaderInfoLog(s));
    }
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  /* ── Fullscreen quad ── */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  /* ── Uniform locations ── */
  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uTime  = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uMusic = gl.getUniformLocation(prog, 'u_music');

  /* ── State ── */
  let running    = true;
  let visible    = true;
  let startTime  = performance.now();
  let mouse      = [0, 0];
  let targetMouse = [0, 0];

  /* ── Resize ── */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw  = canvas.clientWidth;
    const ch  = canvas.clientHeight;
    if (canvas.width  !== Math.round(cw * dpr) ||
        canvas.height !== Math.round(ch * dpr)) {
      canvas.width  = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }
  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  resize();

  /* ── Mouse interaction — listen on the starmap section ── */
  const section = canvas.closest('.starmap-section') ||
                  document.getElementById('starmap');
  if (section) {
    section.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      targetMouse = [
         (e.clientX - cx) / Math.min(rect.width, rect.height),
        -(e.clientY - cy) / Math.min(rect.width, rect.height),
      ];
    }, { passive: true });
    section.addEventListener('mouseleave', () => {
      targetMouse = [0, 0];
    }, { passive: true });
  }

  /* ── Visibility (pause when off-screen) ── */
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
    : null;
  io?.observe(canvas);

  /* ── Render loop ── */
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) return;

    resize();

    /* Smooth mouse */
    mouse[0] += (targetMouse[0] - mouse[0]) * 0.045;
    mouse[1] += (targetMouse[1] - mouse[1]) * 0.045;

    const t     = (performance.now() - startTime) / 1000;
    const music = (getShared?.()?.musicReactive ?? 0);

    gl.uniform2f(uRes,   canvas.width, canvas.height);
    gl.uniform1f(uTime,  t);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.uniform1f(uMusic, music);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  requestAnimationFrame(frame);

  return {
    destroy() {
      running = false;
      ro?.disconnect();
      io?.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
