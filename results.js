// Beerio Kart results. One entry per finished cup, in the order they were raced.
//
// cup:    mushroom | flower | star | special | shell | banana | leaf | lightning |
//         egg | triforce | crossing | bell
// date:   YYYY-MM-DD
// scores: Grand Prix points off the final scoreboard (max 60). Leave a driver out
//         if they sat that cup out.
// photo:  optional path to the scoreboard photo, e.g. "scoreboards/mushroom.jpg"
// note:   optional one-liner shown on the cup card
//
// Example:
// { cup: "mushroom", date: "2026-11-12",
//   scores: { tommy: 52, dale: 47, miles: 39, cal: 33, nate: 28 },
//   photo: "scoreboards/mushroom.jpg", note: "Blue shell on the last lap." },

window.BEERIO_RESULTS = [
  // Dale = Morton, Cal = Yoshi, Miles = Ludwig, Tommy = Link, Nate = Tanooki Mario
  { cup: "mushroom", date: "2026-11-12",
    scores: { dale: 46, cal: 46, miles: 45, tommy: 44, nate: 32 },
    photo: "scoreboards/mushroom.jpg" },
  { cup: "shell", date: "2026-11-12",
    scores: { cal: 52, tommy: 46, miles: 42, dale: 41, nate: 31 },
    photo: "scoreboards/shell.jpg" },
  { cup: "flower", date: "2026-11-12",
    scores: { cal: 54, dale: 44, tommy: 43, miles: 41, nate: 29 },
    photo: "scoreboards/flower.jpg" },
  { cup: "banana", date: "2026-11-12",
    scores: { cal: 47, dale: 43, tommy: 40, miles: 36, nate: 25 },
    photo: "scoreboards/banana.jpg" },
  { cup: "star", date: "2026-11-12",
    scores: { cal: 55, tommy: 46, dale: 38, miles: 35, nate: 24 },
    photo: "scoreboards/star.jpg" },
  { cup: "leaf", date: "2026-11-12",
    scores: { cal: 51, dale: 50, tommy: 39, miles: 32, nate: 28 },
    photo: "scoreboards/leaf.jpg" },
  { cup: "special", date: "2026-11-12",
    scores: { tommy: 57, dale: 46, cal: 37, miles: 33, nate: 26 },
    photo: "scoreboards/special.jpg" },
];
