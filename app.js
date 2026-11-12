(function () {
  "use strict";

  var data = window.BEERIO_DATA;
  var players = data.players;
  var cups = data.cups;
  var MAX_CUP_POINTS = 60;

  var cupById = {};
  cups.forEach(function (c) { cupById[c.id] = c; });
  var playerById = {};
  players.forEach(function (p) { playerById[p.id] = p; });

  var demo = new URLSearchParams(location.search).has("demo");
  var results = (demo ? demoResults() : (window.BEERIO_RESULTS || [])).filter(function (r) {
    return r && cupById[r.cup] && r.scores;
  });
  var resultByCup = {};
  results.forEach(function (r) { resultByCup[r.cup] = r; });

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function ordinal(n) {
    var suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
    return n + "<small>" + suffix + "</small>";
  }
  function icon(name, dir) {
    return name.indexOf("/") >= 0 ? name : "assets/" + dir + "/" + name + ".png";
  }
  function carImg(p) {
    return '<img src="assets/kenney/' + p.car + '.png" alt=""' +
      (p.tint ? ' style="--tint:' + p.tint + '"' : "") + ">";
  }
  function niceDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[+m[2] - 1] + " " + (+m[3]);
  }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  // Scores for one cup, best first, with shared ranks on ties.
  function cupRanking(r) {
    var rows = players.filter(function (p) { return typeof r.scores[p.id] === "number"; })
      .map(function (p) { return { p: p, v: r.scores[p.id] }; });
    rows.sort(function (a, b) { return b.v - a.v; });
    rows.forEach(function (x, i) {
      x.rank = i > 0 && rows[i - 1].v === x.v ? rows[i - 1].rank : i + 1;
    });
    return rows;
  }

  // Overall table: points, then cups won, then roster order.
  function standings(list) {
    var rows = players.map(function (p, i) {
      return { p: p, order: i, pts: 0, wins: 0, played: 0, best: null };
    });
    var byId = {};
    rows.forEach(function (x) { byId[x.p.id] = x; });
    list.forEach(function (r) {
      cupRanking(r).forEach(function (e) {
        var x = byId[e.p.id];
        x.pts += e.v;
        x.played += 1;
        if (e.rank === 1) x.wins += 1;
        if (!x.best || e.v > x.best.v) x.best = { v: e.v, cup: r.cup };
      });
    });
    rows.sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins || a.order - b.order; });
    rows.forEach(function (x, i) {
      var prev = rows[i - 1];
      x.rank = prev && prev.pts === x.pts && prev.wins === x.wins ? prev.rank : i + 1;
    });
    return rows;
  }

  var table = standings(results);
  var before = results.length > 1 ? standings(results.slice(0, -1)) : null;
  var leaderPts = table[0].pts;

  // ---------- ticker ----------
  (function () {
    var bits = [
      ["Don't drink and drive", "beer_mug"],
      ["12 cups", "trophy"],
      ["48 races", "chequered_flag"],
      ["5 drivers", "racing_car"],
      ["1 champion", "crown"],
      ["Blue shells are part of life", "turtle"],
      ["Watch for bananas", "banana"],
      ["Finish your drink before the finish line", "clinking_beer_mugs"]
    ];
    var html = bits.map(function (b) {
      return '<span>' + esc(b[0]) + '</span><img src="assets/emoji/' + b[1] + '.png" alt="">';
    }).join("");
    document.getElementById("ticker").innerHTML = html + html + html + html;
  })();

  // ---------- hero: cup nav + progress ----------
  (function () {
    document.getElementById("cupnav").innerHTML = cups.map(function (c) {
      var raced = !!resultByCup[c.id];
      return '<a href="#cup-' + c.id + '" class="' + (raced ? "raced" : "pending") + '" title="' +
        esc(c.name) + (raced ? " (raced)" : " (not raced yet)") + '">' +
        '<img src="' + icon(c.icon, "emoji") + '" alt="' + esc(c.name) + '"></a>';
    }).join("");

    var done = results.length;
    var next = cups.filter(function (c) { return !resultByCup[c.id]; })[0];
    var text;
    if (done === 0) text = "No cups raced yet. First up: " + next.name + ".";
    else if (!next) text = "All 12 cups raced. " + table[0].p.name + " takes the Grand Prix.";
    else text = done + " of 12 cups raced. Next up: " + next.name + ".";
    if (demo) text += " (Demo scores, not real.)";
    document.getElementById("progress").textContent = text;
  })();

  // ---------- overall standings ----------
  (function () {
    var prevRank = {};
    if (before) before.forEach(function (x) { prevRank[x.p.id] = x.rank; });

    document.getElementById("board").innerHTML = table.map(function (x) {
      var meta = [];
      if (results.length) {
        meta.push("<span><b>" + x.wins + "</b> " + (x.wins === 1 ? "cup" : "cups") + " won</span>");
        if (x.played) {
          meta.push("<span><b>" + (x.pts / x.played).toFixed(1) + "</b> per cup</span>");
          if (x.played < results.length) meta.push("<span>raced <b>" + x.played + "</b> of " + results.length + "</span>");
        } else {
          meta.push("<span>hasn't raced yet</span>");
        }
        if (x.rank > 1) meta.push("<span><b>" + (leaderPts - x.pts) + "</b> behind</span>");
        if (before) {
          var d = prevRank[x.p.id] - x.rank;
          if (d > 0) meta.push('<span class="move up">up ' + d + "</span>");
          if (d < 0) meta.push('<span class="move down">down ' + (-d) + "</span>");
        }
      }
      var lead = results.length && x.rank === 1;
      return '<div class="row' + (lead ? " lead" : "") + '" data-rank="' + (results.length ? x.rank : 0) +
        '" style="--c:' + x.p.color + '">' +
        '<div class="rank">' + (results.length ? ordinal(x.rank) : "&ndash;") + "</div>" +
        '<div class="carbox">' + carImg(x.p) + "</div>" +
        '<div class="who"><div class="name">' + esc(x.p.name) + "</div>" +
        (meta.length ? '<div class="meta">' + meta.join("") + "</div>" : "") + "</div>" +
        '<div class="pts">' + x.pts + "<small>pts</small></div>" +
        "</div>";
    }).join("");

    document.getElementById("board-note").textContent = results.length ? "" :
      "Everyone's on the grid. Standings fill in after the first cup.";

    document.getElementById("road").innerHTML = table.map(function (x) {
      var p = leaderPts ? x.pts / leaderPts : 0;
      var gap = !results.length ? "on the grid" : x.pts === leaderPts ? "leader" : "-" + (leaderPts - x.pts);
      return '<div class="lane" style="--c:' + x.p.color + '">' +
        '<div class="lane-name">' + esc(x.p.name) + "<small>" + gap + "</small></div>" +
        '<div class="lane-road"><div class="lane-car" data-p="' + p.toFixed(4) + '" style="--p:0">' +
        carImg(x.p) + "</div></div></div>";
    }).join("");
  })();

  // ---------- cup cards ----------
  (function () {
    document.getElementById("cup-grid").innerHTML = cups.map(function (c) {
      var r = resultByCup[c.id];
      var tracks = c.tracks.map(function (t) {
        return '<li><img src="' + icon(t[1], "track") + '" alt="" loading="lazy">' + esc(t[0]) + "</li>";
      }).join("");

      var body;
      if (r) {
        var ranked = cupRanking(r);
        var rows = ranked.map(function (e) {
          return '<li class="' + (e.rank === 1 ? "win" : "") + '" style="--c2:' + e.p.color + '">' +
            '<span class="pos">' + ordinal(e.rank) + "</span>" +
            '<span class="nm">' + esc(e.p.name) + "</span>" +
            '<span class="bar"><i style="--v:' + Math.min(1, e.v / MAX_CUP_POINTS).toFixed(3) + '"></i></span>' +
            '<span class="sc">' + e.v + "</span></li>";
        });
        players.forEach(function (p) {
          if (typeof r.scores[p.id] !== "number") {
            rows.push('<li class="out"><span class="pos">&ndash;</span><span class="nm">' + esc(p.name) +
              '</span><span>sat out</span><span class="sc">&ndash;</span></li>');
          }
        });
        body = '<ol class="cup-results">' + rows.join("") + "</ol>" +
          (r.note ? '<p class="cup-note">' + esc(r.note) + "</p>" : "") +
          (r.photo ? '<p class="cup-photo"><a href="' + esc(r.photo) + '">See the scoreboard photo</a></p>' : "");
      } else {
        body = '<p class="cup-empty"><img src="assets/emoji/vertical_traffic_light.png" alt="">' +
          "Waiting at the lights.</p>";
      }

      return '<article class="panel cup ' + (r ? "raced" : "pending") + '" id="cup-' + c.id + '" style="--c:' + c.color + '">' +
        '<header class="cup-head"><img src="' + icon(c.icon, "emoji") + '" alt="">' +
        "<div><h3>" + esc(c.name) + "</h3>" +
        '<p class="when">' + (r ? "Raced" + (r.date ? " " + niceDate(r.date) : "") : "Not raced yet") + "</p></div></header>" +
        '<ul class="tracks">' + tracks + "</ul>" +
        '<div class="cup-body">' + body + "</div></article>";
    }).join("");
  })();

  // ---------- points matrix ----------
  (function () {
    var head = "<thead><tr><th></th>" + cups.map(function (c) {
      return '<th><a href="#cup-' + c.id + '" title="' + esc(c.name) + '"><img src="' + icon(c.icon, "emoji") +
        '" alt="' + esc(c.name) + '"></a></th>';
    }).join("") + '<th class="tot">Total</th></tr></thead>';

    var body = "<tbody>" + table.map(function (x) {
      return '<tr><th scope="row" style="--c:' + x.p.color + '">' + esc(x.p.name) + "</th>" +
        cups.map(function (c) {
          var r = resultByCup[c.id];
          if (!r) return '<td class="nil">&middot;</td>';
          var v = r.scores[x.p.id];
          if (typeof v !== "number") return '<td class="nil" title="Sat out">&ndash;</td>';
          var top = cupRanking(r)[0].v;
          return "<td" + (v === top ? ' class="best"' : "") + ">" + v + "</td>";
        }).join("") +
        '<td class="tot">' + x.pts + "</td></tr>";
    }).join("") + "</tbody>";

    var el = document.getElementById("matrix");
    el.innerHTML = head + body;
    if (results.length) {
      var key = document.createElement("p");
      key.className = "matrix-key";
      key.textContent = "Yellow marks the cup winner. Each cup is worth up to 60 points.";
      el.parentNode.appendChild(key);
    }
  })();

  // ---------- chaos: stickers, drive-bys, the switch ----------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saved = null;
  try { saved = localStorage.getItem("beerio-chaos"); } catch (e) { /* private mode */ }
  var chaos = saved === null ? !reduceMotion : saved === "on";

  // Small seeded generator so the sticker layout is the same on every visit.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var STICKERS = [
    "emoji/mushroom", "emoji/banana", "emoji/turtle", "emoji/star", "emoji/glowing_star", "emoji/high_voltage",
    "emoji/beer_mug", "emoji/clinking_beer_mugs", "emoji/coin", "emoji/bomb", "emoji/squid", "emoji/collision",
    "emoji/trophy", "emoji/crown", "emoji/chequered_flag", "emoji/racing_car", "emoji/ghost", "emoji/fire",
    "emoji/egg", "emoji/bell", "emoji/maple_leaf", "emoji/blossom", "emoji/feather", "emoji/spiral_shell",
    "emoji/woozy_face", "emoji/face_with_spiral_eyes", "emoji/partying_face", "emoji/hundred_points",
    "emoji/1st_place_medal", "emoji/wrapped_gift", "emoji/oil_drum", "emoji/wheel", "emoji/rainbow",
    "emoji/motor_scooter", "emoji/police_car_light", "emoji/stopwatch", "emoji/peach", "emoji/gorilla",
    "emoji/crocodile", "emoji/penguin", "emoji/cloud", "emoji/bubbles", "emoji/party_popper",
    "stk/banana", "stk/bomb", "stk/bowling", "stk/bubblegum", "stk/cake", "stk/nitro", "stk/zipper_collect",
    "stk/cup_gold", "stk/cup_silver", "stk/cup_bronze", "stk/gift", "stk/parachute", "stk/plunger",
    "stk/swatter", "stk/shield", "stk/crown", "stk/karts",
    "kenney/cone_straight", "kenney/tires_red", "kenney/tires_white", "kenney/barrel_red"
  ];
  var SPINNERS = { "emoji/coin": 1, "emoji/star": 1, "emoji/wheel": 1, "stk/banana": 1, "kenney/tires_red": 1, "kenney/tires_white": 1 };

  function layStickers() {
    var layer = document.getElementById("stickers");
    var rand = rng(8);
    var h = document.documentElement.scrollHeight;
    var wide = window.innerWidth >= 900;
    var count = Math.round(h / (wide ? 62 : 120));
    var pool = STICKERS.slice();
    var html = "";
    for (var i = 0; i < count; i++) {
      if (!pool.length) pool = STICKERS.slice();
      var name = pool.splice(Math.floor(rand() * pool.length), 1)[0];
      var size = Math.round((wide ? 54 : 40) + rand() * (wide ? 70 : 36));
      // Keep most stickers out in the margins; a few wander behind the cards.
      var y = ((i + rand() * 0.9) / count) * h;
      var edge = y < 900 || rand() < 0.86;
      var x = edge ? (i % 2 ? rand() * 15 : 85 + rand() * 13) : 15 + rand() * 70;
      if (i % 2 === 0 && edge) x -= 4;
      if (y < 60) y += 80;
      html += '<img class="sticker' + (SPINNERS[name] ? " spin" : "") + '" src="assets/' + name + '.png" alt="" loading="lazy" style="' +
        "left:" + x.toFixed(1) + "%;top:" + Math.round(y) + "px;--s:" + size + "px;--r:" +
        Math.round(rand() * 70 - 35) + "deg;--d:-" + (rand() * 4).toFixed(2) + 's">';
    }
    layer.style.height = h + "px";
    layer.innerHTML = html;
  }

  // Things that drive, slide or get thrown across the screen.
  // flip: sprite faces left, so mirror it when travelling left to right.
  var TRAFFIC = [
    { src: "stk/karts", size: 120, flip: false, spin: false },
    { src: "emoji/racing_car", size: 92, flip: true, spin: false },
    { src: "emoji/motor_scooter", size: 84, flip: true, spin: false },
    { src: "emoji/automobile", size: 84, flip: true, spin: false },
    { src: "emoji/motorcycle", size: 84, flip: true, spin: false },
    { src: "emoji/turtle", size: 70, flip: true, spin: false },
    { src: "stk/banana", size: 60, flip: false, spin: true },
    { src: "emoji/coin", size: 56, flip: false, spin: true },
    { src: "emoji/glowing_star", size: 80, flip: false, spin: true },
    { src: "stk/bowling", size: 64, flip: false, spin: true },
    { src: "emoji/beer_mug", size: 72, flip: false, spin: false }
  ];
  var driveTimer = null;

  function driveBy() {
    var layer = document.getElementById("driveby");
    if (!chaos || document.hidden || layer.childElementCount > 3) return;
    var t = TRAFFIC[Math.floor(Math.random() * TRAFFIC.length)];
    var size = Math.round(t.size * (window.innerWidth < 640 ? 0.7 : 1));
    var ltr = t.flip ? true : Math.random() < 0.7;
    var img = document.createElement("img");
    img.src = "assets/" + t.src + ".png";
    img.alt = "";
    img.style.width = size + "px";
    img.style.top = Math.round(12 + Math.random() * 76) + "%";
    layer.appendChild(img);
    var w = window.innerWidth;
    var from = ltr ? -size * 1.5 : w + size * 0.5;
    var to = ltr ? w + size * 0.5 : -size * 1.5;
    var mirror = t.flip && ltr ? " scaleX(-1)" : "";
    var turns = t.spin ? (ltr ? 720 : -720) : 0;
    var anim = img.animate([
      { transform: "translateX(" + from + "px) rotate(0deg)" + mirror },
      { transform: "translateX(" + to + "px) rotate(" + turns + "deg)" + mirror }
    ], { duration: 2600 + Math.random() * 2600, easing: t.spin ? "linear" : "cubic-bezier(.45,.05,.6,1)" });
    anim.onfinish = anim.oncancel = function () { img.remove(); };
  }

  function scheduleDrive() {
    clearTimeout(driveTimer);
    if (!chaos) return;
    driveTimer = setTimeout(function () { driveBy(); scheduleDrive(); }, 1800 + Math.random() * 2800);
  }

  function applyChaos() {
    document.body.classList.toggle("calm", !chaos);
    var btn = document.getElementById("chaos");
    btn.setAttribute("aria-pressed", String(chaos));
    btn.textContent = "Chaos: " + (chaos ? "on" : "off");
    if (chaos) scheduleDrive();
    else { clearTimeout(driveTimer); document.getElementById("driveby").innerHTML = ""; }
  }

  document.getElementById("chaos").addEventListener("click", function () {
    chaos = !chaos;
    try { localStorage.setItem("beerio-chaos", chaos ? "on" : "off"); } catch (e) { /* private mode */ }
    applyChaos();
  });

  // Cars roll out to their gap once the road scrolls into view.
  function releaseCars() {
    document.querySelectorAll(".lane-car").forEach(function (el) {
      el.style.setProperty("--p", el.getAttribute("data-p"));
    });
  }
  var road = document.getElementById("road");
  if ("IntersectionObserver" in window && chaos) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { releaseCars(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(road);
  } else {
    releaseCars();
  }

  applyChaos();
  layStickers();
  window.addEventListener("load", layStickers);
  var resizeTimer;
  var lastWidth = window.innerWidth;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layStickers, 200);
  });

  // ---------- demo data (?demo in the URL) ----------
  function demoResults() {
    var rand = rng(41);
    var skill = { tommy: 44, dale: 46, miles: 41, cal: 38, nate: 40 };
    return cups.slice(0, 7).map(function (c, i) {
      var scores = {};
      players.forEach(function (p) {
        scores[p.id] = Math.max(12, Math.min(60, Math.round(skill[p.id] + (rand() - 0.5) * 26)));
      });
      if (i === 3) delete scores.cal;
      return { cup: c.id, date: "2026-11-" + (12 + i), scores: scores,
        note: i === 1 ? "Decided by a blue shell on the last lap." : "" };
    });
  }
})();
