# DetentionSimulator

A lightweight browser game prototype with a top-down detention room.

## Current prototype features
- Move a player sprite with arrow keys.
- Press `Space` to stand up/sit down, and to interact with the door.
- A one-hour detention timer gates door access (teacher can pause it if you wander).
- RPG-style HUD + dialogue panel.

## Run locally
Because this is plain HTML/CSS/JS, you can open `index.html` directly in a browser.

For best results, serve with a local static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Next steps
- Swap placeholder room/player art for your real assets.
- Add more interactable props and consequences for rule-breaking.
- Expand dialogue + branching events for the gameplay loop.
