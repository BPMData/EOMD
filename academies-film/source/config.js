/* ============================================================================
   THE ACADEMIES OF DANBURY HIGH SCHOOL — HALLWAY LOOP
   ONE config file for every name, color, pathway, and line of on-screen copy.
   Edit here, then re-render (see README.md). Scene code never hardcodes copy.
   ============================================================================ */
(function (G) {
  const DHS = (G.DHS = G.DHS || {});

  DHS.config = {
    // ---- Film + music grid ------------------------------------------------
    // 96 BPM, 4/4. One bar = 2.5 s. 24 bars = 60.0 s loop (1800 frames @ 30, 3600 @ 60).
    film: { bpm: 96, bars: 24, beatsPerBar: 4, sampleRate: 48000 },

    // Section plan in BARS (sums to 24). Changing these reflows the whole film.
    sections: {
      exploration: { startBar: 2, bars: 3 },   // 5.0 – 12.5 s
      academies:   { startBar: 5, barsEach: 2 }, // 12.5 – 47.5 s (7 × 5 s)
      hub:         { startBar: 19, bars: 7 },  // 47.5 s → wraps → 5.0 s (end card, rewind, title, unwind)
    },

    // ---- Brand -------------------------------------------------------------
    colors: {
      danburyBlue: '#0033A0',  // anchor color
      hatGray: '#A2AAAD',      // large shapes only, never text
      white: '#FFFFFF',
      ink: '#0A1633',          // dark text for yellow + teal backgrounds
      exploration: '#009CA6',  // Exploration Academy teal (loop start/return)
    },

    school: {
      name: 'The Academies of Danbury High School',
      nameLines: ['The Academies of', 'Danbury High School'],
      nickname: 'Hatters',
    },

    campuses: {
      west: { label: 'DHS West', address: '40 Apple Ridge Road' },
      main: { label: 'Main Campus', address: '43 Clapboard Ridge Road' },
    },

    // ---- On-screen copy ----------------------------------------------------
    copy: {
      greeting: ['Hello', 'Hola', 'Olá'],                    // EN / ES / PT-BR
      introSub: '7 career academies. 21 pathways.',
      exploration: {
        a: { lead: 'Every 9th grader starts in the', lines: ['Exploration', 'Academy'] },
        b: { lead: 'Get to know all', lines: ['7 academies', 'and 21 pathways'] },
        c: { lines: ['Explore.', 'Rank carefully.'],
             sub: ['Pathways are open to every student', 'and assigned by lottery, so your', 'ranking matters.'] },
        rankLabel: 'Your ranking',
      },
      academyKicker: 'Career academy, grades 10–12',
      footerLeft: 'The Academies of Danbury High School',
      footerRight: 'Explore. Find your fit.',
      end: {
        kicker: 'Your next step',
        lines: ['Explore.', 'Find your fit.'],
        body: ['Explore all 7 academies in 9th grade.', 'Rank your academy choices with care.', 'Questions? Talk to your counselor.'],
        lockupSub: 'Home of the Hatters',
      },
    },

    // ---- The seven career academies (grades 10–12) -------------------------
    // nameLines = how the hero name breaks; icon = procedural line icon id (src/draw/icons.js)
    // motif = background animation id (src/scenes/motifs.js); instrument = lead instrument id (src/audio/music.js)
    // flourish = optional cognate morph (EN / ES / PT-BR), max 3–4 per loop incl. greeting
    academies: [
      {
        id: 'etec', name: 'Emerging Technology & Entrepreneurship', nameLines: ['Emerging', 'Technology &', 'Entrepreneurship'],
        color: '#527A8A', campus: 'west', motif: 'ticker', instrument: 'tine',
        flourish: ['Technology', 'Tecnología', 'Tecnologia'],
        pathways: [
          { name: 'Business & Entrepreneurship', icon: 'bulb' },
          { name: 'Investment & Finance', icon: 'chart' },
          { name: 'Medical Technology & Engineering', icon: 'heartPulse' },
        ],
      },
      {
        id: 'sim', name: 'Scientific Innovation & Medicine', nameLines: ['Scientific', 'Innovation &', 'Medicine'],
        color: '#DC4405', campus: 'west', motif: 'ecg', instrument: 'marimba',
        pathways: [
          { name: 'Biomedical', icon: 'dna' },
          { name: 'Sports & Human Performance', icon: 'stopwatch' },
          { name: 'Allied Health Services', icon: 'cross' },
        ],
      },
      {
        id: 'ceg', name: 'Clean Energy & Green Design', nameLines: ['Clean Energy &', 'Green Design'],
        color: '#006341', campus: 'west', motif: 'skylight', instrument: 'pluck',
        flourish: ['Energy', 'Energía', 'Energia'],
        pathways: [
          { name: 'Clean & Renewable Energy', icon: 'turbine' },
          { name: 'Green Design & Environmental Stewardship', icon: 'leafHouse' },
          { name: 'Sustainable Food & Living Systems', icon: 'sprout' },
        ],
      },
      {
        id: 'itc', name: 'Information Technology & Cybersecurity', nameLines: ['Information', 'Technology &', 'Cybersecurity'],
        color: '#D50032', campus: 'main', motif: 'network', instrument: 'pulse',
        pathways: [
          { name: 'Networking', icon: 'network' },
          { name: 'Computer Programming & Gaming', icon: 'code' },
          { name: 'Cybersecurity', icon: 'shield' },
        ],
      },
      {
        id: 'pps', name: 'Professional & Public Service', nameLines: ['Professional &', 'Public Service'],
        color: '#FFD100', campus: 'main', motif: 'steam', instrument: 'keys',
        pathways: [
          { name: 'Justice & Law', icon: 'scales' },
          { name: 'Education & Human Development', icon: 'book' },
          { name: 'Culinary Arts & Hospitality Management', icon: 'toque' },
        ],
      },
      {
        id: 'aed', name: 'Art, Engineering & Design', nameLines: ['Art, Engineering', '& Design'],
        color: '#0033A0', campus: 'main', motif: 'blueprint', instrument: 'mallet',
        flourish: ['Art', 'Arte'],
        pathways: [
          { name: 'Art, Architecture & Civil Engineering', icon: 'bridge' },
          { name: 'Computer Integrated Manufacturing', icon: 'robotArm' },
          { name: 'Applied Engineering', icon: 'gear' },
        ],
      },
      {
        id: 'cd', name: 'Communication & Design', nameLines: ['Communication', '& Design'],
        color: '#5C068C', campus: 'main', motif: 'waves', instrument: 'voice',
        pathways: [
          { name: 'Broadcasting & Multimedia', icon: 'tower' },
          { name: 'Audio Engineering & Design', icon: 'headphones' },
          { name: 'Graphic & Digital Design', icon: 'bezier' },
        ],
      },
    ],

    // Exploration Academy (all 9th graders) — loop start/return point
    exploration: { name: 'Exploration Academy', color: '#009CA6' },
  };
})(globalThis);
