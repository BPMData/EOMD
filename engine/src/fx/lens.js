/* LENS: an optional WebGL2 finish over any 2D canvas (glow, horizontal streak, colour fringe at the edges,
   tone curve, vignette, grain). The scene code doesn't change: each frame the 2D canvas is uploaded as a texture
   and run through four small passes:
     1. bright parts pulled out at quarter size (soft threshold)
     2. blurred twice each way (separable Gaussian)        -> glow
     3. the glow sampled sideways                          -> streak
     4. the original + glow + streak, fringe, tone curve, vignette, grain -> screen
   Pure function of (source pixels, t): grain is seeded by floor(t * grainFps), so a seek or an MP4 export gives the
   same frame. No WebGL2, a shader that won't build, or a lost context: lens.ok is false and the caller shows the
   2D canvas as it is (the piece still plays, just without the finish).

   const L = DHS.lens.create(knobs);   // knobs: see DEFAULTS; anything left out uses the default
   if (L.ok) { canvas.after(L.canvas); canvas.style.display = 'none'; }
   L.draw(canvas, t);                  // every frame, after the 2D canvas is drawn
   L.set({ bloom: 0.5 });  L.onfail = () => {...};  L.dispose();

   Standalone: needs only the DHS namespace, so any build (CD-ROM, living posters, gen) can inline it. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});

  // Every knob at 0 (fringe, vignette, grain, bloom, streak) turns that part off.
  const DEFAULTS = {
    exposure: 1, // multiplies the picture before the glow is added
    bloom: 0.25, // glow strength. Type is in the picture, so glow also haloes white text: keep it low and check legibility
    threshold: 0.8, // brightness (0..1) where glow starts
    knee: 0.15, // softness of that threshold
    radius: 1, // glow spread (1 = about 1% of the width)
    streak: 0.06, // horizontal streak from the glow (anamorphic-lens look); 0 = off
    streakTint: [0.7, 0.78, 1.0],
    fringe: 0.6, // colour fringe at the screen edge, in pixels (red and blue split outward); 0 at the centre
    vignette: 0.3, // corner darkening (0..1)
    grain: 0.02, // grain amplitude (0.02 = +/-1%)
    grainFps: 24, // how often the grain changes; frozen under prefers-reduced-motion
    tone: 'none', // 'none' keeps brand colours; 'film' = ACES curve (rolls off highlights, darkens whites ~20%)
    contrast: 1, // around mid-grey
  };

  const VS = `#version 300 es
in vec2 a;out vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
  const HEAD = `#version 300 es
precision highp float;in vec2 v;out vec4 o;`;
  const BRIGHT =
    HEAD +
    `uniform sampler2D S;uniform float uTh,uKnee;
void main(){vec2 t=1./vec2(textureSize(S,0));
 vec3 c=(texture(S,v+t*vec2(-1,-1)).rgb+texture(S,v+t*vec2(1,-1)).rgb+texture(S,v+t*vec2(-1,1)).rgb+texture(S,v+t*vec2(1,1)).rgb)*.25;
 float l=dot(c,vec3(.2126,.7152,.0722));o=vec4(c*smoothstep(uTh-uKnee,uTh+uKnee,l),1.);}`;
  const BLUR =
    HEAD +
    `uniform sampler2D S;uniform vec2 D;
void main(){vec3 s=texture(S,v).rgb*.227;
 s+=(texture(S,v+D*1.385).rgb+texture(S,v-D*1.385).rgb)*.316;
 s+=(texture(S,v+D*3.231).rgb+texture(S,v-D*3.231).rgb)*.07;o=vec4(s,1.);}`;
  const POST =
    HEAD +
    `uniform sampler2D S,B;uniform vec2 R;uniform vec3 uTint;
uniform float uExp,uBloom,uStreak,uFringe,uVig,uGrain,uSeed,uTone,uCon;
float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec2 q=v-.5;
 vec3 c=texture(S,v).rgb;
 if(uFringe>0.){vec2 off=q*2.*uFringe/R;c.r=texture(S,v+off).r;c.b=texture(S,v-off).b;}
 c*=uExp;
 if(uBloom>0.)c+=texture(B,v).rgb*uBloom;
 if(uStreak>0.){vec3 st=vec3(0);float ws=0.;
  for(int i=1;i<9;i++){float fi=float(i),w=exp(-fi*.42);ws+=2.*w;
   st+=(texture(B,v+vec2(fi*.018,0.)).rgb+texture(B,v-vec2(fi*.018,0.)).rgb)*w;}
  c+=st/ws*uTint*uStreak;}
 c=uTone>.5?aces(c*.95):clamp(c,0.,1.);
 c=(c-.5)*uCon+.5;
 c*=1.-uVig*dot(q,q)*2.;
 if(uGrain>0.)c+=(h21(gl_FragCoord.xy+uSeed)-.5)*uGrain;
 o=vec4(clamp(c,0.,1.),1.);}`;

  const reduced = () => !!(G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
        u[inf.name] = gl.getUniformLocation(p, inf.name);
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
    const target = (w, h) => {
      const t = tex();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
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

    let P = null,
      src = null,
      D = null,
      E = null,
      W = 0,
      H = 0,
      lost = false;
    const init = () => {
      P = { bright: mk(BRIGHT), blur: mk(BLUR), post: mk(POST) };
      if (!P.bright || !P.blur || !P.post) return false;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one triangle over the screen
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      src = tex();
      D = E = null;
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

    const set1 = (u, n, ...a) => {
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

    // source: any canvas, image or video. t: seconds (seeds the grain).
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
        free(D);
        free(E);
        const bw = Math.max(1, Math.round(w / 4)),
          bh = Math.max(1, Math.round(h / 4));
        D = target(bw, bh);
        E = target(bw, bh);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      const glow = k.bloom > 0 || k.streak > 0;
      if (glow) {
        pass(P.bright, D, [['S', src]]);
        set1(P.bright.u, 'uTh', k.threshold);
        set1(P.bright.u, 'uKnee', Math.max(1e-3, k.knee));
        tri();
        const r = k.radius * (D.w / 480); // same spread (as a share of the width) at any size
        for (let i = 1; i <= 2; i++) {
          pass(P.blur, E, [['S', D.t]]);
          set1(P.blur.u, 'D', (i * r) / D.w, 0);
          tri();
          pass(P.blur, D, [['S', E.t]]);
          set1(P.blur.u, 'D', 0, (i * r) / D.h);
          tri();
        }
      }
      const u = P.post.u;
      pass(P.post, null, [
        ['S', src],
        ['B', D.t],
      ]);
      set1(u, 'R', W, H);
      set1(u, 'uExp', k.exposure);
      set1(u, 'uBloom', glow ? k.bloom : 0);
      set1(u, 'uStreak', glow ? k.streak : 0);
      set1(u, 'uTint', ...k.streakTint);
      set1(u, 'uFringe', k.fringe);
      set1(u, 'uVig', k.vignette);
      set1(u, 'uGrain', k.grain);
      set1(u, 'uTone', k.tone === 'film' ? 1 : 0);
      set1(u, 'uCon', k.contrast);
      const n = reduced() ? 0 : Math.floor(Math.max(0, t) * k.grainFps);
      set1(u, 'uSeed', (((n % 61) + 61) % 61) * 37.17);
      tri();
      return true;
    };
    api.dispose = () => {
      free(D);
      free(E);
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
