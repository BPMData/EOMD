"""tools__cdrom_ambient.py: makes the AMBIENT CD-ROM screensaver from the finished one (Oct 9). Run in Thonny after tools__build_cdrom.py.

Reads dist/cdrom-player.html and writes dist/cdrom-ambient.html: the same five channels, music, boot screen, timer and
Duds, but no tip cards and so no Dud speech (the Duds only ever speak a card). Nothing else changes:
  - the card list is emptied (const CARDS=[];)
  - the next card is never due (CM.next = Infinity), which also keeps Starfield's hyperspace working: it only fires in
    card-free gaps, and with no cards at all that gap would otherwise close for good after 8 s
  - the page title and the screen-reader label lose the coding-tips wording
  - a worn red rubber stamp (STAMP_TEXT, default AMBIENT_VER) slams onto the boot card after the punch line, and
    dissolves out with it (settings below)
Still there: the music modes, the corner ding when a word hits a corner, the hyperspace whoosh, the timer and its
"SAVE YOUR WORK!" end card. The Lab Maze HUD guide never pops up (he only appears to speak a card); the zeppelin
captain and the Starfield pilot stay.
Every edit must match exactly once or nothing is written. The source files are never touched.
"""
import json, os

# ---- settings
FOLDER = os.path.dirname(os.path.abspath(__file__))           # the Build folder
SRC = os.path.join(FOLDER, 'dist', 'cdrom-player.html')       # the finished player (tools__build_cdrom.py writes it)
OUT = os.path.join(FOLDER, 'dist', 'cdrom-ambient.html')
TITLE = 'CS Lab Screensaver · Ambient'
LABEL = 'CS lab screensaver: failed virtual pets wander five retro computer worlds'
# the rubber stamp on the boot screen (Bryan, Oct 9: like an old CANCELED stamp)
STAMP_TEXT = 'AMBIENT_VER'
STAMP_ANGLE = -10            # degrees (negative = counterclockwise, right end up)
STAMP_X, STAMP_Y = 1020, 330 # centre, in the 1920x1080 screen (the marble plaque spans x 340-1580, y 80-420)
STAMP_SIZE = 40              # letter size before the chunky-pixel upscale (x3 on screen: 40 -> ~120 px letters)
STAMP_INK = (200, 16, 46)    # stamp red; worn spots use a lighter red
STAMP_INK2 = (226, 74, 84)

STAMP_JS = r'''/* ambient build (tools__cdrom_ambient.py): a worn rubber stamp slammed across the boot card */
const STAMP={text:__TEXT__,ang:__ANG__,x:__X__,y:__Y__,fs:__FS__,ink:[__INK__],ink2:[__INK2__],ps:3,alpha:.92,img:null};
// drawn rotated at 1/3 resolution, hard-edged, with blotchy ink loss on an ordered dither (like the plaque), upscaled x3 without smoothing
function stampImg(){if(STAMP.img)return STAMP.img;const S=STAMP,m=M,ch=[...S.text];m.font=`700 ${S.fs}px Atk`;
 const sp=S.fs*.08,cw=ch.map(q=>m.measureText(q).width),tw=cw.reduce((a,b)=>a+b,0)+sp*(ch.length-1),pad=Math.round(S.fs*.42),
  bw=Math.ceil(tw+2*pad),bh=Math.ceil(S.fs*1.05+2*pad),a=S.ang*Math.PI/180,ca=Math.abs(Math.cos(a)),sa=Math.abs(Math.sin(a)),
  w=Math.ceil(bw*ca+bh*sa)+4,h=Math.ceil(bw*sa+bh*ca)+4,b=buf(w,h),c=b.getContext('2d');
 const rr=(x,y,ww,hh,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+ww,y,x+ww,y+hh,r);c.arcTo(x+ww,y+hh,x,y+hh,r);c.arcTo(x,y+hh,x,y,r);c.arcTo(x,y,x+ww,y,r);c.closePath()};
 c.translate(w/2,h/2);c.rotate(a);c.fillStyle=c.strokeStyle='#000';
 c.lineWidth=Math.max(3,S.fs*.13);rr(-bw/2,-bh/2,bw,bh,S.fs*.22);c.stroke();   // thick outer border
 const ins=S.fs*.2;c.lineWidth=Math.max(1,S.fs*.04);rr(-bw/2+ins,-bh/2+ins,bw-2*ins,bh-2*ins,S.fs*.12);c.stroke();   // thin inner border
 c.font=`700 ${S.fs}px Atk`;c.textBaseline='middle';c.textAlign='left';let x=-tw/2;ch.forEach((q,i)=>{c.fillText(q,x,S.fs*.04);x+=cw[i]+sp});
 const id=c.getImageData(0,0,w,h),d=id.data,r=rng(47),P=[];for(let i=0;i<1024;i++)P.push(r());
 const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),q=(i,j)=>P[(((i*131+j*977)%1024)+1024)%1024],
  p00=q(ix,iy),p10=q(ix+1,iy),p01=q(ix,iy+1),p11=q(ix+1,iy+1);return p00+(p10-p00)*u+(p01-p00)*v+(p00-p10-p01+p11)*u*v};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]<110){d[i+3]=0;continue}
  const n=.6*vn(x*.09,y*.09)+.4*vn(x*.31+50,y*.31)-.1*x/w,th=(BAY4[(y&3)*4+(x&3)]+.5)/16;   // the right side inked a little lighter
  if(n<.27+.18*th){d[i+3]=0;continue}   // rubber that didn't take ink
  const C=n>.6+.2*th?S.ink2:S.ink;d[i]=C[0];d[i+1]=C[1];d[i+2]=C[2];d[i+3]=255}
 c.putImageData(id,0,0);return S.img=b}
// lands once the punch line has zoomed in: drops from 1.6x to full size in 0.13 s (reduced motion: just appears)
function stampAmbient(c,e){const L=BOOT_LINES[BOOT.line][0],at=RM?.9:1.6+L.length/24+.35+.45+.5;if(e<at)return;
 const S=STAMP,im=stampImg(),k=RM?1:Math.min(1,(e-at)/.13),s=1+.6*(1-k)*(1-k),w=im.width*S.ps*s,h=im.height*S.ps*s;
 c.save();c.imageSmoothingEnabled=false;c.globalAlpha=S.alpha*Math.min(1,k*1.6);c.drawImage(im,Math.round(S.x-w/2),Math.round(S.y-h/2),w,h);c.restore()}
'''
STAMP_JS = (STAMP_JS.replace('__TEXT__', json.dumps(STAMP_TEXT)).replace('__ANG__', str(STAMP_ANGLE)).replace('__X__', str(STAMP_X))
            .replace('__Y__', str(STAMP_Y)).replace('__FS__', str(STAMP_SIZE)).replace('__INK2__', ','.join(map(str, STAMP_INK2)))
            .replace('__INK__', ','.join(map(str, STAMP_INK))))

# (name, old, new, required): exact edits to the finished player
EDITS = [
    ('no card is ever due', "const CM={state:'gap',next:8,", "const CM={state:'gap',next:Infinity,", True),
    ('boot screen stamp', 'function bootFrame(c,e){',
     'function bootFrame(c,e){bootFrame0(c,e);stampAmbient(c,e)}\n' + STAMP_JS + 'function bootFrame0(c,e){', True),
    ('page title', '<title>CS Lab Screensaver</title>', '<title>%s</title>' % TITLE, False),
    ('screen-reader label', 'aria-label="CS lab screensaver: failed virtual pets wander a 90s desktop while coding tips appear in English, Spanish and Portuguese"',
     'aria-label="%s"' % LABEL, False),
]


def main():
    html = open(SRC, encoding='utf-8').read()
    if 'const STAMP=' in html or 'function stampAmbient' in html:
        print('Stopped, nothing written: the player already has a STAMP (is', SRC, 'an ambient build?)')
        return
    # 1. empty the card list (parsed as JSON, so card text can contain anything)
    k = html.find('const CARDS=')
    if k < 0 or html.count('const CARDS=') != 1:
        print('Stopped, nothing written: "const CARDS=" not found exactly once in', SRC)
        return
    a = k + len('const CARDS=')
    cards, end = json.JSONDecoder().raw_decode(html, a)
    if html[end] != ';':
        print('Stopped, nothing written: the card list does not end the way the build writes it.')
        return
    html = html[:a] + '[]' + html[end:]
    # 2. the exact edits
    for name, old, new, need in EDITS:
        n = html.count(old)
        if n == 1:
            html = html.replace(old, new, 1)
        elif need or n > 1:
            print('Stopped, nothing written: edit "%s" matched %d times (needs exactly 1).' % (name, n))
            return
        else:
            print('Skipped (not found, harmless):', name)
    open(OUT, 'w', encoding='utf-8').write(html)
    print('Removed %d cards. Wrote %s (%d KB)' % (len(cards), OUT, len(html.encode()) // 1024))


main()
