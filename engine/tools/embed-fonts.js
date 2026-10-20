// Embeds the two licensed font instances (OFL, see fonts/OFL.txt) as base64 into src/core/fontdata.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const out = ['(function(G){const D=G.DHS=G.DHS||{};D.fontData={'];
for (const n of ['DHSDisplay', 'DHSText']) out.push(`${n}:"${fs.readFileSync(path.join(root, 'fonts', n + '.ttf')).toString('base64')}",`);
out.push('};})(globalThis);');
fs.writeFileSync(path.join(root, 'src/core/fontdata.js'), out.join('\n'));
console.log('fontdata.js written');
