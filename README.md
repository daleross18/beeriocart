# Beerio Kart Grand Prix

Standings for a five-driver Beerio Kart season across the 12 original
Mario Kart 8 Deluxe cups. Live at https://daleross18.github.io/beeriocart/

Drivers: Tommy, Dale, Miles, Cal, Nate.

## Updating the standings

All scores live in `results.js`. After a cup, add one entry with the Grand
Prix points from the final scoreboard, then commit and push:

```js
window.BEERIO_RESULTS = [
  { cup: "mushroom", date: "2026-11-12",
    scores: { tommy: 52, dale: 47, miles: 39, cal: 33, nate: 28 },
    photo: "scoreboards/mushroom.jpg", note: "Blue shell on the last lap." },
];
```

- `cup` is one of: mushroom, flower, star, special, shell, banana, leaf,
  lightning, egg, triforce, crossing, bell.
- Leave a driver out of `scores` if they sat that cup out.
- `photo` and `note` are optional.
- Entries stay in the order the cups were raced. The last entry drives the
  "up 1 / down 1" movement on the standings board.

Overall order is total points, then cups won.

Driver colors, car sprites and the cup and track list are in `data.js`.

## Preview

Open `index.html` in a browser. Add `?demo` to the URL to see the page with
made-up scores.

## Credits

Fan-made scoreboard. Not affiliated with or endorsed by Nintendo. Mario Kart
is a trademark of Nintendo.

- 3D emoji (`assets/emoji`, `assets/track`): Fluent Emoji by Microsoft, MIT
  license. https://github.com/microsoft/fluentui-emoji
- Item icons, trophies, penguin kart (`assets/stk`): SuperTuxKart team,
  CC BY-SA 3.0+. `crown.png` by glitch, CC0. https://supertuxkart.net
- Cars and trackside objects (`assets/kenney`): Kenney Racing Pack, CC0.
  https://kenney.nl
- `assets/commons/mk8-logo.svg` and `baby-park-map.svg` (by Captain Galaxy):
  Wikimedia Commons, public domain. The wordmark remains a Nintendo trademark.
- Photos in `assets/commons`, all from Wikimedia Commons and resized:
  - `karts-in-japan.jpg`: "Mario Kart in Japan" by Jason Scott, CC BY 2.0
  - `monkey-kart-tokyo.jpg`, `yoyogi-karts.jpg`: Syced, CC0
  - `arcade-gp2.jpg`: GuiltyGearFan37, CC0
- Type: Kanit by Cadson Demak, SIL Open Font License.
