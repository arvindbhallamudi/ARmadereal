# #MadeRealHere — AR story experience

A browser-based augmented reality experience for Capgemini's **#MadeRealHere** campaign.
People scan a QR code, the page opens on their phone, and employee stories appear as
glowing cards placed around them in the room (camera view + motion sensors). No app install.

## The journey

1. **Intro**: `#MadeRealHere`, start with camera (AR) or without (virtual space).
2. **Prologue**: three short lines over the camera view.
3. **Path of light**: ten story cards sit on a glowing path that winds around the viewer.
   Chapters follow the campaign pillars: Culture → Growth → Pride → Innovation → Purpose → Impact.
   Undiscovered stops show as small beacons; the path lights up as each chapter unlocks.
4. **Guide**: when the next story is off-screen, a "Turn left / Turn right" pill points to it (tap it to turn there).
5. **Collect**: opening a story adds it to *My collection* (kept on the device). Undiscovered people show as silhouettes.
6. **Share / save**: every story can be shared or saved as a 1080×1350 card image.
7. **Add your story**: visitors build their own card (name, role, pillar, quote, illustrated look),
   place it on their path, and save or share it with #MadeRealHere.
8. **Chapters**: the chip under the top bar (and "Preview the six chapters" on the intro) opens a list of
   all six chapters with their one-liners, the people in each, and progress. Tap a reached chapter to go there.
   Each chapter also has a signpost floating above its first card.
9. **Finale**: careers link, LinkedIn hashtag, and an invitation to add your own story.

In AR mode, **Background: Clear / Soft / Focus** sets how much the camera view is tinted and blurred behind the cards.

## Works on

- iPhone (Safari 13+) and Android (Chrome), with camera + motion sensors.
- Desktop: drag (or arrow keys) to look around; the intro shows a QR code to open it on a phone.
- Must be served over **HTTPS** (GitHub Pages is) for camera access.

## Editing the stories

Everything editable lives in **`js/stories.js`**:

- `CAMPAIGN`: prologue lines, finale text and links, logo path, optional `submit` link for user stories.
- `CHAPTERS`: pillar titles and intro lines, in path order.
- `STORIES`: one entry per person: name, role, quote (wrap words in `*stars*` to highlight),
  `scene` (two background colours), and `look` (portrait traits, options listed in `js/avatar.js`).

No photos are used; portraits are illustrated from `look`.

## Brand files

Put the official white Capgemini logo at `assets/brand/capgemini-logo-white.svg`.
It then appears on the intro/final screens, the top bar and every card.

## QR code

Open `qr.html` on the live site to get a QR code pointing at the experience (download PNG or print).
Use `qr.html?url=https://your-final-url` to encode a different address.

## Testing shortcuts

- `index.html?skip` jumps straight into the virtual experience.

## Tech

Plain HTML/CSS/JS, no build step. [three.js](https://threejs.org) r160 and
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) are vendored in `vendor/` (MIT).
