# DetentionSimulator

A lightweight browser game prototype with a top-down detention room.

## Current prototype features
- Move a player sprite with arrow keys.
- Press `Space` to advance scenes, stand up/sit down, and interact with the door.
- Click classmates or the teacher for RPG-style conversations and escalating socializing consequences.
- A one-hour detention timer gates door access and adds time if you keep breaking the rules.
- Keyboard-focus polish for the canvas and dialogue buttons.

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
