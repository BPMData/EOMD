/* LENS: an optional WebGL2 finish over any 2D canvas. The scene code doesn't change: each frame the 2D canvas is
   uploaded as a texture and run through the GPU:
     1. glow: bright parts pulled out at half size (soft threshold), then a chain of up to 6 levels, each half the
        size of the last, blurred back up and added together (wide, soft glow without a heavy blur). Glow is mixed in
        linear light, in half-float buffers where the GPU has them (no banding in the glow itself)
     2. halation: the glow pushed toward red, like light scattering in film
     3. streak: the glow sampled sideways (anamorphic-lens look)
     4. colour fringe that grows toward the edges (zero at the centre)
     5. tone curve (none, ACES or AgX), then a grade: contrast, saturation, lift, gain
     6. vignette, grain (strongest in the midtones), and last a dither of about one shade so smooth gradients
        don't band on 8-bit screens; pure black and pure white stay exact
   Pure function of (source pixels, t): grain and dither are seeded by floor(t * grainFps), so a seek or an MP4
   export gives the same frame. No WebGL2, a shader that won't build, or a lost context: lens.ok is false and the
   caller shows the 2D canvas as it is (the piece still plays, just without the finish).

   const L = DHS.lens.create(knobs);   // knobs: see DEFAULTS; anything left out uses the default
   if (L.ok) { canvas.after(L.canvas); canvas.style.display = 'none'; }
   L.draw(canvas, t);                  // every frame, after the 2D canvas is drawn
   L.set({ bloom: 0.5 });  L.onfail = () => {...};  L.dispose();

   Standalone: needs only the DHS namespace, so any build (CD-ROM, living posters, gen) can inline it. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});

  // A knob at 0 turns its part off (bloom, streak, halation, fringe, vignette, grain, dither).
  const DEFAULTS = {
    exposure: 1, // multiplies the picture (linear light) before tone and grade
    bloom: 0.25, // glow strength. Type is in the picture, so glow also haloes white text: keep it low and check legibility
    threshold: 0.8, // brightness (0..1, brightest channel) where glow starts
    knee: 0.15, // softness of that threshold
    radius: 0.85, // how far the glow spreads (0.5 tight .. 1 wide)
    levels: 6, // glow levels (1..6); fewer = tighter and cheaper
    halation: 0, // 0..1: glow pushed toward red, like film
    streak: 0.06, // horizontal streak from the glow; 0 = off
    streakTint: [0.7, 0.78, 1.0],
    fringe: 0.6, // colour fringe at the screen corners, in pixels; grows with distance from the centre, 0 at it
    tone: 'none', // 'none' keeps brand colours; 'aces' (alias 'film') rolls off highlights, whites ~20% darker; 'agx' softer, more neutral
    contrast: 1, // around mid-grey, after the tone curve
    saturation: 1, // 0 = grey, 1 = as is
    lift: [0, 0, 0], // raises the shadows toward this colour (0..0.1 is plenty)
    gain: [1, 1, 1], // multiplies the highlights per channel (a warm grade: [1.03, 1, 0.96])
    vignette: 0.3, // corner darkening (0..1)
    grain: 0.02, // grain amplitude in the midtones (0.02 = +/-1%)
    grainFps: 24, // how often grain and dither change; frozen under prefers-reduced-motion
    dither: 1, // final dither in 8-bit shades (1 = +/-1 shade, triangular); 0 = off
  };

  const VS = `#version 300 es
in vec2 a;out vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
  const HEAD = `#version 300 es
precision highp float;in vec2 v;out vec4 o;
vec3 toLin(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}
vec3 toSrgb(vec3 c){c=max(c,0.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
`;
  // 13-tap downsample (sRGB source on the first level, with the soft threshold); linear light after that
  const DOWN =
    HEAD +
    `uniform sampler2D S;uniform vec2 uPx;uniform float uFirst,uTh,uKnee;
vec3 s(vec2 d){vec3 c=texture(S,v+d*uPx).rgb;
 if(uFirst>.5){float m=max(c.r,max(c.g,c.b));c=toLin(c)*smoothstep(uTh-uKnee,uTh+uKnee,m);c/=1.+luma(c)*.12;}
 return c;}
void main(){vec3 c=s(vec2(0))*.125;
 c+=(s(vec2(-1,-1))+s(vec2(1,-1))+s(vec2(-1,1))+s(vec2(1,1)))*.125;
 c+=(s(vec2(-2,0))+s(vec2(2,0))+s(vec2(0,-2))+s(vec2(0,2)))*.0625;
 c+=(s(vec2(-2,-2))+s(vec2(2,-2))+s(vec2(-2,2))+s(vec2(2,2)))*.03125;
 o=vec4(c,1.);}`;
  // 3x3 tent upsample of the smaller level, added to this level's downsample
  const UP =
    HEAD +
    `uniform sampler2D S,B;uniform vec2 uPx;uniform float uR;
void main(){vec3 c=vec3(0);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){float w=(x==0?2.:1.)*(y==0?2.:1.);c+=w*texture(S,v+vec2(x,y)*uPx*uR).rgb;}
 o=vec4(texture(B,v).rgb+c/16.,1.);}`;
  const POST =
    HEAD +
    `uniform sampler2D S,B,SB;uniform vec2 R;uniform vec3 uTint,uLift,uGain;
uniform float uExp,uBloom,uHal,uStreak,uFringe,uTone,uCon,uSat,uVig,uGrain,uDither,uSeed;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 agx(vec3 v){const mat3 M=mat3(.842479062253094,.0423282422610123,.0423756549057051,.0784335999999992,.878468636469772,.0784336,.0792237451477643,.0791661274605434,.879142973793104);
 v=M*v;v=clamp(log2(max(v,1e-10)),-12.47393,4.026069);v=(v+12.47393)/(4.026069+12.47393);
 vec3 x2=v*v,x4=x2*x2;v=15.5*x4*x2-40.14*x4*v+31.96*x4-6.868*x2*v+.4298*x2+.1191*v-.00232;
 const mat3 I=mat3(1.19687900512017,-.0528968517574562,-.0529716355144438,-.0980208811401368,1.15190312990417,-.0980434501171241,-.0990297440797205,-.0989611768448433,1.15107367264116);
 return pow(max(I*v,0.),vec3(2.2));}
void main(){vec2 q=v-.5;
 vec3 src=texture(S,v).rgb,c=src;
 if(uFringe>0.){vec2 off=q*1.41421*(dot(q,q)*2.)*uFringe/R;c.r=texture(S,v+off).r;c.b=texture(S,v-off).b;}
 bool touched=uExp!=1.||uBloom>0.||uStreak>0.||uTone>.5;
 if(touched){
  c=toLin(c)*uExp;
  if(uBloom>0.)c+=texture(B,v).rgb*uBloom*vec3(1.+uHal*.35,1.-uHal*.05,1.-uHal*.35);
  if(uStreak>0.){vec3 st=vec3(0);float ws=0.;
   for(int i=1;i<17;i++){float fi=float(i),w=exp(-fi*.21);ws+=2.*w;
    st+=(texture(SB,v+vec2(fi*.009,0.)).rgb+texture(SB,v-vec2(fi*.009,0.)).rgb)*w;}
   c+=st/ws*uTint*uStreak;}
  if(uTone>1.5)c=agx(c);else if(uTone>.5)c=aces(c*.95);
  c=toSrgb(c);
 }
 if(uCon!=1.)c=(c-.5)*uCon+.5;
 if(uSat!=1.)c=mix(vec3(luma(c)),c,uSat);
 if(uGain!=vec3(1)||uLift!=vec3(0))c=c*uGain+uLift*(1.-c);
 if(uVig>0.)c*=1.-uVig*smoothstep(.25,1.05,length(q*vec2(R.x/R.y,1.)*1.1));
 c=clamp(c,0.,1.);
 if(uGrain>0.)c+=(h13(vec3(gl_FragCoord.xy,uSeed))-.5)*uGrain*(1.-abs(luma(c)-.5));
 if(uDither>0.&&!all(greaterThan(c,vec3(.9985)))&&!all(lessThan(c,vec3(.0015)))){
  float n=h13(vec3(gl_FragCoord.xy,uSeed+7.))+h13(vec3(gl_FragCoord.xy,uSeed+19.))-1.;c+=n*uDither/255.;}
 o=vec4(clamp(c,0.,1.),1.);}`;

  const reduced = () => !!(G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const TONE = { none: 0, aces: 1, film: 1, agx: 2 };

  function create(knobs = {}) {
    const k = Object.assign({}, DEFAULTS, knobs);
    const canvas = G.document ? G.document.createElement('canvas') : null;
    const api = { canvas, ok: false, knobs: k, onfail: null };
    api.set = (o) => Object.assign(k, o);
    api.draw = () => false;
    api.dispose = () => {};
    if (!canvas) return api;
    // preserveDrawingBuffer: stills and MP4 frames (page screenshots, toDataURL) always see the last frame
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return api;

    const mk = (fs) => {
      const p = gl.createProgram();
      for (const [ty, src] of [
        [gl.VERTEX_SHADER, VS],
        [gl.FRAGMENT_SHADER, fs],
      ]) {
        const sh = gl.createShader(ty);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.error('lens:', gl.getShaderInfoLog(sh));
          return null;
        }
        gl.attachShader(p, sh);
      }
      gl.bindAttribLocation(p, 0, 'a');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('lens:', gl.getProgramInfoLog(p));
        return null;
      }
      const u = {},
        n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const inf = gl.getActiveUniform(p, i);
        u[inf.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, inf.name);
      }
      return { p, u };
    };
    const tex = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    let half = false; // half-float glow buffers when the GPU can render to them (linear light needs the precision)
    const target = (w, h) => {
      const t = tex();
      if (half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { t, f, w, h };
    };
    const free = (x) => {
      if (x) {
        gl.deleteTexture(x.t);
        gl.deleteFramebuffer(x.f);
      }
    };

    const MAXL = 6;
    const BLOOM_K = 0.5; // calibration: bloom 0.25 matches the first lens next to a bright edge, with a wider, softer tail
    let P = null,
      src = null,
      down = [],
      up = [],
      W = 0,
      H = 0,
      lost = false;
    const freeAll = () => {
      down.forEach(free);
      up.forEach(free);
      down = [];
      up = [];
    };
    const init = () => {
      P = { down: mk(DOWN), up: mk(UP), post: mk(POST) };
      if (!P.down || !P.up || !P.post) return false;
      half = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
      gl.getExtension('OES_texture_float_linear');
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one triangle over the screen
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      src = tex();
      down = [];
      up = [];
      W = H = 0;
      return true;
    };
    const fail = () => {
      if (!api.ok) return;
      api.ok = false;
      if (api.onfail) api.onfail();
    };
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      lost = true;
      fail();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      lost = false;
      if (init()) api.ok = true;
    });
    if (!init()) return api;

    const setf = (u, n, ...a) => {
      const l = u[n];
      if (l != null) gl['uniform' + a.length + 'f'](l, ...a);
    };
    const pass = (pr, out, texs) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null);
      gl.viewport(0, 0, out ? out.w : W, out ? out.h : H);
      gl.useProgram(pr.p);
      texs.forEach(([name, t], i) => {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, t);
        if (pr.u[name] != null) gl.uniform1i(pr.u[name], i);
      });
    };
    const tri = () => gl.drawArrays(gl.TRIANGLES, 0, 3);

    // source: any canvas, image or video. t: seconds (seeds grain and dither).
    api.draw = (source, t = 0) => {
      if (!api.ok || lost) return false;
      const w = source.width,
        h = source.height;
      if (!w || !h) return false;
      if (w !== W || h !== H) {
        W = w;
        H = h;
        canvas.width = w;
        canvas.height = h;
        freeAll();
        for (let l = 0; l < MAXL; l++) {
          const s = 2 << l,
            lw = Math.max(1, Math.round(w / s)),
            lh = Math.max(1, Math.round(h / s));
          down.push(target(lw, lh));
          up.push(target(lw, lh));
        }
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      const glow = k.bloom > 0 || k.streak > 0,
        L = Math.max(1, Math.min(MAXL, Math.round(k.levels)));
      let glowTex = down[0].t,
        streakTex = down[0].t,
        streakN = 1;
      if (glow) {
        let prev = src,
          pw = W,
          ph = H;
        for (let l = 0; l < L; l++) {
          pass(P.down, down[l], [['S', prev]]);
          setf(P.down.u, 'uPx', 1 / pw, 1 / ph);
          setf(P.down.u, 'uFirst', l ? 0 : 1);
          setf(P.down.u, 'uTh', k.threshold);
          setf(P.down.u, 'uKnee', Math.max(1e-3, k.knee));
          tri();
          prev = down[l].t;
          pw = down[l].w;
          ph = down[l].h;
        }
        let small = down[L - 1];
        for (let l = L - 2; l >= 0; l--) {
          pass(P.up, up[l], [
            ['S', small.t],
            ['B', down[l].t],
          ]);
          setf(P.up.u, 'uPx', 1 / small.w, 1 / small.h);
          setf(P.up.u, 'uR', k.radius);
          tri();
          small = up[l];
        }
        glowTex = small.t;
        const j = L > 3 ? 2 : Math.max(0, L - 2); // a soft level, so the streak has no ghost copies
        streakTex = L > 1 ? up[j].t : down[0].t;
        streakN = L > 1 ? L - j : 1; // up[j] holds L-j levels added together
      }
      const u = P.post.u,
        seedN = reduced() ? 0 : Math.floor(Math.max(0, t) * k.grainFps);
      pass(P.post, null, [
        ['S', src],
        ['B', glowTex],
        ['SB', streakTex],
      ]);
      setf(u, 'R', W, H);
      setf(u, 'uExp', k.exposure);
      setf(u, 'uBloom', glow ? (k.bloom * BLOOM_K) / L : 0);
      setf(u, 'uHal', k.halation);
      setf(u, 'uStreak', glow ? k.streak / streakN : 0);
      setf(u, 'uTint', ...k.streakTint);
      setf(u, 'uFringe', k.fringe);
      setf(u, 'uTone', TONE[k.tone] || 0);
      setf(u, 'uCon', k.contrast);
      setf(u, 'uSat', k.saturation);
      setf(u, 'uLift', ...k.lift);
      setf(u, 'uGain', ...k.gain);
      setf(u, 'uVig', k.vignette);
      setf(u, 'uGrain', k.grain);
      setf(u, 'uDither', k.dither);
      setf(u, 'uSeed', (((seedN % 61) + 61) % 61) * 1.37);
      tri();
      return true;
    };
    api.dispose = () => {
      freeAll();
      const x = gl.getExtension('WEBGL_lose_context');
      if (x) x.loseContext();
      api.ok = false;
    };
    api.ok = true;
    return api;
  }

  // The lens setting a player starts with: ?lens=0 forces it off, ?lens=1 turns it on (the piece's own knobs, or
  // DEFAULTS), otherwise the piece's config decides (null or absent = off).
  const fromQuery = (search, configured) => {
    const v = new URLSearchParams(search || '').get('lens');
    if (v === '0') return null;
    if (v === '1') return configured || {};
    return configured || null;
  };

  // Puts a lens over a 2D canvas in the page (hides the canvas, shows the lens in its place). null if it's off or
  // can't start; the 2D canvas then stays as it is.
  const attach = (canvas, knobs) => {
    if (!knobs) return null;
    const L = create(knobs);
    if (!L.ok) return null;
    L.canvas.className = canvas.className;
    L.canvas.id = (canvas.id || 'c') + '-lens';
    L.canvas.setAttribute('aria-hidden', canvas.getAttribute('aria-hidden') || 'false');
    if (canvas.getAttribute('aria-label')) L.canvas.setAttribute('aria-label', canvas.getAttribute('aria-label'));
    canvas.after(L.canvas);
    canvas.style.display = 'none';
    L.onfail = () => {
      L.canvas.remove();
      canvas.style.display = '';
    };
    return L;
  };

  DHS.lens = { DEFAULTS, create, attach, fromQuery };
})(globalThis);
