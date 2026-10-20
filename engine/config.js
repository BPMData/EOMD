/* ONE FILE FOR ALL CONTENT. Edit words, colors, section order and length here.
   Timing is in bars: at 96 BPM, 1 bar = 2.5 s. Total film = sum of section bars. */
(function (G) {
  const DHS = (G.DHS = G.DHS || {});
  DHS.config = {
    film: { bpm: 96, beatsPerBar: 4, sampleRate: 48000, fps: 30 },
    colors: { bg: '#0A1633', white: '#FFFFFF', ink: '#0A1633' },
    footer: { left: 'Your Organization', right: 'Your tagline here.' },
    // instrument: tine | marimba | pluck | pulse | keys | mallet | voice | whistle | chime
    // icons: see src/draw/icons.js (bulb, chart, heartPulse, dna, stopwatch, cross, turbine, leafHouse,
    //        sprout, network, code, shield, scales, book, toque, bridge, robotArm, gear, tower, headphones, bezier)
    sections: [
      { id: 'title', bars: 4, color: '#0033A0', instrument: 'chime', kicker: 'Welcome to', lines: ['Your Big', 'Headline'], sub: ['One short supporting line.'], icons: ['bulb', 'book', 'gear'] },
      { id: 'one', bars: 4, color: '#009CA6', instrument: 'marimba', kicker: 'Part one', lines: ['First Idea'], sub: ['Keep it glanceable.'], icons: ['chart', 'network', 'code'] },
      { id: 'two', bars: 4, color: '#DC4405', instrument: 'pluck', kicker: 'Part two', lines: ['Second Idea'], sub: ['Readable from 12 feet.'], icons: ['sprout', 'turbine', 'leafHouse'] },
      { id: 'end', bars: 4, color: '#5C068C', instrument: 'voice', kicker: 'Next step', lines: ['Call to', 'Action.'], sub: ['Who to talk to, where to go.'], icons: ['headphones', 'bezier', 'tower'] },
    ],
  };
  const c = DHS.config; c.film.bars = c.sections.reduce((n, s) => n + s.bars, 0);
})(globalThis);
