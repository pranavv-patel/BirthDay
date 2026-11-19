# Birthday Memory Wall v2 — Modular GitHub Pages Edition

## Modular File Structure
```text
├── index.html          # Clean semantic markup
├── config.json         # Commented config (edit text, theme, photos, cutouts, notes)
├── .gitignore          # Clean Git ignore rules
├── README.md           # Publishing instructions
├── css/
│   ├── base.css        # Variables, typography, buttons & layout base
│   ├── wall.css        # Wall textures, scroll-pinned wall photos, auto-frames & cutouts
│   └── components.css  # Vault, hero, live counter, cake, cards, 2 notes, letter & modal
├── js/
│   ├── config.js       # Comment-stripping JSON loader & HTML escaper
│   ├── fx.js           # Party popper confetti & firecracker rockets/sparks engine
│   └── main.js         # UI rendering, wall scroll pinning, roaming cutouts & audio
└── assets/
    ├── photos/         # Place p1.jpg through p6.jpg (small age to till now)
    ├── cutouts/        # Place c1.png, c2.png, c3.png (transparent PNG cutouts)
    └── music/          # Place song.mp3 (falls back automatically to synth melody)
```

## Publish with Git & GitHub Pages
```bash
git init
git add .
git commit -m "Birthday memory wall v2"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Then open **Settings → Pages** in your GitHub repository and deploy from **main** (`/root`).
