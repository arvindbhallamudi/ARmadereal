# #MadeRealHere — AR story experience

A browser-based augmented reality experience for Capgemini's **#MadeRealHere** campaign.
People scan a QR code, the page opens on their phone, and employee stories appear as
glowing cards placed around them in the room (camera view + motion sensors). No app install.

## The journey

1. **Intro** — `#MadeRealHere`, start with camera or without.
2. **Prologue** — three short narrative lines appear over the camera view.
3. **Chapters** — *The Spark → The Build → The Impact*. Each chapter's stories appear in a
   different direction around the viewer; arrows guide them to turn and find the next ones.
4. **Story sheet** — photo, name, role, quote and story. Closing it marks the story as heard.
5. **Finale** — call to action (careers / share your story).

There's also an **All stories** list (top-right menu) so every story is reachable without AR.

## Works on

- iPhone (Safari 13+) and Android (Chrome) — camera + gyroscope.
- Desktop — drag (or arrow keys) to look around a virtual space.
- Must be served over **HTTPS** (GitHub Pages is) for camera access.

## Adding the real stories

Everything editable lives in **`js/stories.js`**:

- `CAMPAIGN` — prologue lines, finale text and CTA links.
- `CHAPTERS` — chapter titles, intros and where they sit around the viewer.
- `STORIES` — one entry per person. Set `placeholder: false` to remove the "Placeholder" tag.

Photos go in `assets/people/` (square JPGs, ~800×800, under 300 KB each) and are referenced as
`photo: "assets/people/name.jpg"`. Optional `video: "assets/people/name.mp4"` adds a clip to the story.

## QR code

Open `qr.html` on the live site to get a QR code pointing at the experience (download PNG or print).
Use `qr.html?url=https://your-final-url` to encode a different address.

## Testing shortcuts

- `index.html?skip` jumps straight into the virtual experience.

## Tech

Plain HTML/CSS/JS, no build step. [three.js](https://threejs.org) r160 and
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) are vendored in `vendor/` (MIT).
