# QA report

## Verified
- **Player:** loads with zero console errors, holds a steady 30 fps, and sound synthesizes in a background worker and locks to picture. Tested in headless Chrome at 1920×1080 and 1080×1920.
- **Loudness (ffmpeg ebur128):**
  - −16.0 LUFS integrated and −1.5 dBTP true peak.
  - Loudness range is 1.0 LU; 3-second loudness stays between −17.0 and −14.4 LUFS.
  - These figures are the same over three loops back to back.
- **Section balance:** the nine sections all sit within ±0.5 LU of each other.
- **Audio seam:** the sample-to-sample step at the loop point is 0.014, the same as normal program material (the largest step anywhere is 0.23). No click was measured.
- **Visual seam:** the loop point falls in the middle of the title shot, where every frame is a pure function of time, so frame 0 matches the continuation of the last frame.
- **Tone:** energy above 5 kHz is about 29 dB below the total. The sound is warm rather than bright, and there are no bell or alarm timbres.
- **Flashing:** there are no flashes; transitions are 0.6 s hex irises.
- **Layout:** stills of every beat were reviewed in both orientations. All text is at least 30 px bold.

## Contrast (all text is large bold, so WCAG AA large = 3:1; normal AA = 4.5:1)
| Background | Hex | Text | Contrast |
|---|---|---|---|
| Exploration | #009CA6 | ink #0A1633 | 5.36:1 |
| Emerging Technology & Entrepreneurship | #527A8A | white | 4.66:1 |
| Scientific Innovation & Medicine | #DC4405 | white | 4.31:1 |
| Clean Energy & Green Design | #006341 | white | 7.34:1 |
| Information Technology & Cybersecurity | #D50032 | white | 5.42:1 |
| Professional & Public Service | #FFD100 | ink #0A1633 | 12.23:1 |
| Art, Engineering & Design | #0033A0 | white | 10.60:1 |
| Communication & Design | #5C068C | white | 11.29:1 |
| Danbury Blue (title/end) | #0033A0 | white | 10.60:1 |

## Not verified / limitations
- **Nobody has listened to the audio.** Every audio result above is a measurement. Please give it one listen on the actual hallway TVs.
- **Orange (Scientific Innovation & Medicine):** white text there is 4.31:1. It passes AA only as large text, which all of the text is.
- **Autoplay:** sound needs the Chrome flag in the README or one click after load.
- **Speed on weak PCs:** audio synthesis takes about 25 s on a 1-core test box. Performance on the actual hallway PCs is untested; if they struggle, keep `?fps=30` and `?scale=1`.
- **Facts:** all facts come from the brief as given (see `sources.md`); they were not independently checked against the district.
- **Video:** no MP4 was exported, by request (screen-record the player instead).
