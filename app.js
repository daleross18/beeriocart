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

  // Overall table: cups won, then points, then roster order.
  function standings(list) {
    var rows = players.map(function (p, i) {
      return { p: p, order: i, pts: 0, wins: 0, won: [], played: 0, best: null };
    });
    var byId = {};
    rows.forEach(function (x) { byId[x.p.id] = x; });
    list.forEach(function (r) {
      cupRanking(r).forEach(function (e) {
        var x = byId[e.p.id];
        x.pts += e.v;
        x.played += 1;
        if (e.rank === 1) { x.wins += 1; x.won.push(r.cup); }
        if (!x.best || e.v > x.best.v) x.best = { v: e.v, cup: r.cup };
      });
    });
    rows.sort(function (a, b) { return b.wins - a.wins || b.pts - a.pts || a.order - b.order; });
    rows.forEach(function (x, i) {
      var prev = rows[i - 1];
      x.rank = prev && prev.pts === x.pts && prev.wins === x.wins ? prev.rank : i + 1;
    });
    return rows;
  }

  var table = standings(results);
  var before = results.length > 1 ? standings(results.slice(0, -1)) : null;
  // The overall leader is whoever has won the most cups. Points still get their own race.
  var leaderPts = Math.max.apply(null, table.map(function (x) { return x.pts; }));
  var byPoints = table.slice().sort(function (a, b) { return b.pts - a.pts; });

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
        if (x.played) {
          meta.push("<span><b>" + (x.pts / x.played).toFixed(1) + "</b> per cup</span>");
          if (x.played < results.length) meta.push("<span>raced <b>" + x.played + "</b> of " + results.length + "</span>");
        } else {
          meta.push("<span>hasn't raced yet</span>");
        }
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
        '<div class="stat minor pts"><b>' + x.pts + "</b><small>points</small></div>" +
        '<div class="stat major wins"><b><img src="assets/stk/cup_gold.png" alt="">' + x.wins + "</b><small>" + (x.wins === 1 ? "cup won" : "cups won") + "</small></div>" +
        "</div>";
    }).join("");

    document.getElementById("board-note").textContent = results.length ? "Ranked by cups won. Total points break ties." :
      "Everyone's on the grid. Most cups won leads, with total points as the tiebreaker.";

    document.getElementById("road").innerHTML = byPoints.map(function (x) {
      var p = leaderPts ? x.pts / leaderPts : 0;
      var gap = !results.length ? "on the grid" : x.pts === leaderPts ? "most points" : "-" + (leaderPts - x.pts);
      return '<div class="lane" style="--c:' + x.p.color + '">' +
        '<div class="lane-name">' + esc(x.p.name) + "<small>" + gap + "</small></div>" +
        '<div class="lane-road"><div class="lane-car" data-p="' + p.toFixed(4) + '" style="--p:0">' +
        carImg(x.p) + "</div></div></div>";
    }).join("");
  })();

  // ---------- season stats: title race chart, trophy cabinet, awards ----------
  var redrawChart = function () {};
  (function () {
    var wrap = document.getElementById("stats");
    if (!results.length) {
      wrap.innerHTML = '<p class="panel stats-empty"><img src="assets/emoji/wrapped_gift.png" alt="">' +
        "The points race, trophy cabinet and season awards unlock after the first cup.</p>";
      return;
    }

    function nameList(list) {
      var seen = {};
      var names = list.filter(function (n) { return seen[n] ? false : (seen[n] = true); });
      if (names.length <= 1) return names[0] || "";
      return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    }
    function cupName(id) { return cupById[id].name; }

    // --- trophy cabinet ---
    var cabinetRows = table.slice().sort(function (a, b) { return b.wins - a.wins; }).map(function (x) {
      var cupsWon = x.won.map(function (id) {
        return '<img src="' + icon(cupById[id].icon, "emoji") + '" alt="' + esc(cupName(id)) + '" title="' + esc(cupName(id)) + '">';
      }).join("");
      return '<li style="--c:' + x.p.color + '"><span class="cab-name">' + esc(x.p.name) + "</span>" +
        (cupsWon ? '<span class="cab-cups">' + cupsWon + "</span>" : '<span class="cab-none">Nothing yet</span>') +
        '<span class="cab-n">' + x.wins + "</span></li>";
    }).join("");

    // --- awards ---
    var awards = [];
    var bestV = -1, bestWho = [], bestCup = "";
    var closest = null, blowout = null;
    var lasts = {};
    results.forEach(function (r) {
      var rk = cupRanking(r);
      rk.forEach(function (e) {
        if (e.v > bestV) { bestV = e.v; bestWho = [e.p.name]; bestCup = r.cup; }
        else if (e.v === bestV) { bestWho.push(e.p.name); if (bestCup !== r.cup) bestCup = ""; }
      });
      if (rk.length < 2) return;
      var winners = rk.filter(function (e) { return e.rank === 1; }).map(function (e) { return e.p.name; });
      var m = { margin: rk[0].v - rk[1].v, cup: r.cup, first: rk[0].p.name, second: rk[1].p.name, winners: winners };
      if (!closest || m.margin < closest.margin) closest = m;
      if (!blowout || m.margin > blowout.margin) blowout = m;
      var low = rk[rk.length - 1].v;
      if (low < rk[0].v) rk.forEach(function (e) { if (e.v === low) lasts[e.p.name] = (lasts[e.p.name] || 0) + 1; });
    });

    awards.push({ icon: "hundred_points", title: "Best single cup", value: bestV + " points",
      detail: nameList(bestWho) + (bestCup ? " in the " + cupName(bestCup) : ", more than once") });

    if (closest) {
      awards.push({ icon: "stopwatch", title: "Closest finish",
        value: closest.margin === 0 ? "Dead heat" : plural(closest.margin, "point"),
        detail: closest.margin === 0 ? nameList(closest.winners) + " tied the " + cupName(closest.cup)
          : closest.first + " edged " + closest.second + " in the " + cupName(closest.cup) });
    }
    if (blowout && closest && blowout.cup !== closest.cup && blowout.margin > 0) {
      awards.push({ icon: "collision", title: "Biggest blowout", value: plural(blowout.margin, "point"),
        detail: blowout.first + " over " + blowout.second + " in the " + cupName(blowout.cup) });
    }

    if (results.length >= 3) {
      var recent = results.slice(-3), hotV = -1, hotWho = [];
      players.forEach(function (p) {
        var sum = 0, raced = false;
        recent.forEach(function (r) { if (typeof r.scores[p.id] === "number") { sum += r.scores[p.id]; raced = true; } });
        if (!raced) return;
        if (sum > hotV) { hotV = sum; hotWho = [p.name]; } else if (sum === hotV) hotWho.push(p.name);
      });
      awards.push({ icon: "fire", title: "Hot hand", value: nameList(hotWho), detail: hotV + " points over the last 3 cups" });
    } else {
      var last = results[results.length - 1], lr = cupRanking(last);
      awards.push({ icon: "fire", title: "Latest winner",
        value: nameList(lr.filter(function (e) { return e.rank === 1; }).map(function (e) { return e.p.name; })),
        detail: "Won the " + cupName(last.cup) + " with " + lr[0].v });
    }

    var lastMax = 0, lastWho = [];
    Object.keys(lasts).forEach(function (n) {
      if (lasts[n] > lastMax) { lastMax = lasts[n]; lastWho = [n]; } else if (lasts[n] === lastMax) lastWho.push(n);
    });
    if (lastMax) awards.push({ icon: "banana", title: "Most last places", value: nameList(lastWho), detail: "Last in " + plural(lastMax, "cup") });

    var left = cups.length - results.length;
    var leaders = table.filter(function (x) { return x.rank === 1; });
    var leaderName = nameList(leaders.map(function (x) { return x.p.name; }));
    if (left > 0) {
      var chasers = table.filter(function (x) { return x.rank > 1; });
      var alive = chasers.filter(function (x) { return leaders[0].wins - x.wins <= left; });
      awards.push({ icon: "coin", title: "Still up for grabs", value: plural(left, "cup"),
        detail: left * MAX_CUP_POINTS + " points left too. " + (!chasers.length ? "It's all level at the top."
          : alive.length === chasers.length ? "Everyone can still catch " + leaderName + " on paper."
          : alive.length ? nameList(alive.map(function (x) { return x.p.name; })) + " can still catch " + leaderName + " on paper."
          : "Nobody can catch " + leaderName + " now.") });
    } else {
      awards.push({ icon: "crown", title: leaders.length > 1 ? "Champions" : "Champion", value: leaderName, detail: plural(leaders[0].wins, "cup") + " won and " + leaders[0].pts + " points" });
    }

    wrap.innerHTML =
      '<div class="stats-grid">' +
        '<div class="chart-panel"><h3>Points race</h3><p class="chart-sub">Total points after each cup</p>' +
          '<div class="legend">' + table.map(function (x) {
            return '<span><i style="--c:' + x.p.color + '"></i>' + esc(x.p.name) + "</span>";
          }).join("") + "</div>" +
          '<div class="chart" id="chart"></div>' +
          '<p class="chart-foot">Hover or tap the chart for scores. Full numbers are in <a href="#points">Every point</a>.</p></div>' +
        '<div class="panel cabinet"><h3>Trophy cabinet</h3><p class="cab-sub">Cups won by each driver</p><ul>' + cabinetRows + "</ul></div>" +
      "</div>" +
      '<div class="awards">' + awards.map(function (a) {
        return '<div class="panel award"><img src="assets/emoji/' + a.icon + '.png" alt=""><h3>' + esc(a.title) + "</h3>" +
          '<p class="award-val">' + esc(a.value) + '</p><p class="award-det">' + esc(a.detail) + "</p></div>";
      }).join("") + "</div>";

    // --- points race chart: cumulative points after each cup ---
    var SURFACE = "#1d1a33";
    var n = results.length;
    var series = table.map(function (x) {
      var sum = 0, pts = [0], got = [null];
      results.forEach(function (r) {
        var v = r.scores[x.p.id];
        if (typeof v === "number") { sum += v; got.push(v); } else got.push(null);
        pts.push(sum);
      });
      return { p: x.p, pts: pts, got: got };
    });

    redrawChart = function () {
      var box = document.getElementById("chart");
      var W = Math.max(260, box.clientWidth);
      var small = W < 520;
      var H = small ? 270 : 330;
      var m = { l: 38, r: small ? 90 : 104, t: 14, b: 40 };
      var pw = W - m.l - m.r, ph = H - m.t - m.b;
      var max = Math.max.apply(null, series.map(function (s) { return s.pts[n]; })) || MAX_CUP_POINTS;
      var step = [10, 20, 25, 50, 100, 200].filter(function (s) { return max / s <= 5; })[0] || 200;
      var top = Math.ceil(max / step) * step;
      function X(i) { return m.l + (i / n) * pw; }
      function Y(v) { return m.t + ph - (v / top) * ph; }

      var svg = "";
      for (var t = 0; t <= top; t += step) {
        svg += '<line class="grid" x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>' +
          '<text class="tick" x="' + (m.l - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + t + "</text>";
      }
      var ic = Math.max(12, Math.min(24, pw / n - 3));
      if (pw / n >= 44) svg += '<text class="tick" x="' + X(0) + '" y="' + (H - m.b + 22) + '" text-anchor="middle">Start</text>';
      results.forEach(function (r, i) {
        svg += '<image href="' + icon(cupById[r.cup].icon, "emoji") + '" x="' + (X(i + 1) - ic / 2) + '" y="' + (H - m.b + 8) +
          '" width="' + ic + '" height="' + ic + '"><title>' + esc(cupName(r.cup)) + "</title></image>";
      });
      svg += '<line class="cross" id="cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ph) + '" visibility="hidden"/>';

      series.forEach(function (s) {
        var d = s.pts.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
        svg += '<path d="' + d + '" fill="none" stroke="' + s.p.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      });

      // End labels, nudged apart so close finishers stay readable.
      var GAP = 17;
      var labs = series.map(function (s) { return { s: s, y0: Y(s.pts[n]), y: Y(s.pts[n]) }; })
        .sort(function (a, b) { return a.y - b.y; });
      for (var i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < GAP) labs[i].y = labs[i - 1].y + GAP;
      var floor = m.t + ph + 4;
      for (var j = labs.length - 1; j >= 0; j--) {
        var limit = j === labs.length - 1 ? floor : labs[j + 1].y - GAP;
        if (labs[j].y > limit) labs[j].y = limit;
      }
      labs.forEach(function (l) {
        var ex = X(n);
        svg += '<line x1="' + (ex + 6) + '" y1="' + l.y0 + '" x2="' + (ex + 15) + '" y2="' + l.y + '" stroke="' + l.s.p.color + '" stroke-width="1.5"/>' +
          '<circle cx="' + ex + '" cy="' + l.y0 + '" r="5" fill="' + l.s.p.color + '" stroke="' + SURFACE + '" stroke-width="2"/>' +
          '<text class="endlab" x="' + (ex + 19) + '" y="' + (l.y + 4.5) + '">' + esc(l.s.p.name) + " " + l.s.pts[n] + "</text>";
      });
      series.forEach(function (s, k) {
        svg += '<circle class="hv" data-k="' + k + '" r="4.5" fill="' + s.p.color + '" stroke="' + SURFACE + '" stroke-width="2" visibility="hidden"/>';
      });

      box.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H +
        '" role="img" aria-label="Line chart of each driver\'s total points after each cup. ' +
        esc(table.map(function (x) { return x.p.name + " " + x.pts; }).join(", ")) + '.">' + svg + "</svg>" +
        '<div class="tip" id="tip" hidden></div>';

      var el = box.querySelector("svg"), tip = box.querySelector("#tip"), cross = box.querySelector("#cross");
      var dots = box.querySelectorAll(".hv");
      function hide() {
        tip.hidden = true;
        cross.setAttribute("visibility", "hidden");
        dots.forEach(function (c) { c.setAttribute("visibility", "hidden"); });
      }
      function show(ev) {
        var rect = el.getBoundingClientRect();
        var px = (ev.clientX - rect.left) * (W / rect.width);
        var i = Math.max(0, Math.min(n, Math.round(((px - m.l) / pw) * n)));
        cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("visibility", "visible");
        dots.forEach(function (c) {
          var s = series[+c.getAttribute("data-k")];
          c.setAttribute("cx", X(i)); c.setAttribute("cy", Y(s.pts[i])); c.setAttribute("visibility", "visible");
        });
        var rows = series.slice().sort(function (a, b) { return b.pts[i] - a.pts[i]; }).map(function (s) {
          var extra = i === 0 ? "" : s.got[i] === null ? " (sat out)" : " (+" + s.got[i] + ")";
          return '<div class="tip-row"><i style="--c:' + s.p.color + '"></i><span>' + esc(s.p.name) + "</span><span>" + s.pts[i] + extra + "</span></div>";
        }).join("");
        tip.innerHTML = "<b>" + (i === 0 ? "Start" : "After the " + esc(cupName(results[i - 1].cup))) + "</b>" + rows;
        tip.hidden = false;
        var scale = rect.width / W, tx = X(i) * scale;
        var tw = tip.offsetWidth;
        tip.style.left = Math.max(0, Math.min(rect.width - tw, tx > rect.width / 2 ? tx - tw - 12 : tx + 12)) + "px";
      }
      el.addEventListener("pointermove", show);
      el.addEventListener("pointerdown", show);
      el.addEventListener("pointerleave", hide);
    };
    redrawChart();
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
    }).join("") + '<th class="tot">Points</th><th class="cupscol">Cups</th></tr></thead>';

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
        '<td class="tot">' + x.pts + '</td><td class="cupscol">' + x.wins + "</td></tr>";
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
    resizeTimer = setTimeout(function () { redrawChart(); layStickers(); }, 200);
  });

  // ---------- music ----------
  (function () {
    var TRACKS = [
      { file: "kart_grand_prix", title: "Kart Grand Prix", by: "Weirwood" },
      { file: "supertuxkart_theme", title: "SuperTuxKart Theme", by: "Claude Werner" },
      { file: "penguin_party", title: "Penguin Party", by: "Magne Djupvik" },
      { file: "jumping_to_the_stars", title: "Jumping to the Stars", by: "Geek Penguin and Heuchi1" },
      { file: "boom_boom_boom", title: "Boom Boom Boom", by: "Keith Baylis aka Vim" }
    ];
    var toggle = document.getElementById("music-toggle");
    var next = document.getElementById("music-next");
    var now = document.getElementById("now");
    var audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.6;
    var index = 0;
    var want = true;
    try { want = localStorage.getItem("beerio-music") !== "off"; } catch (e) { /* private mode */ }

    function remember() {
      try { localStorage.setItem("beerio-music", want ? "on" : "off"); } catch (e) { /* private mode */ }
    }
    function load(i) {
      index = (i + TRACKS.length) % TRACKS.length;
      audio.src = "assets/music/" + TRACKS[index].file + ".mp3";
    }
    function start() {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { /* blocked until the first tap */ });
    }
    function render() {
      var playing = !audio.paused;
      toggle.setAttribute("aria-pressed", String(playing));
      toggle.textContent = "Music: " + (playing ? "on" : "off");
      now.hidden = !playing;
      now.textContent = "Now playing: " + TRACKS[index].title + " by " + TRACKS[index].by;
    }

    // Browsers only allow sound after a tap or key press, so the first one starts the music.
    function firstTouch(e) {
      if (e.target.closest && e.target.closest("#music")) return;
      if (want && audio.paused) start();
    }
    function stopWaiting() {
      document.removeEventListener("click", firstTouch, true);
      document.removeEventListener("keydown", firstTouch, true);
    }

    audio.addEventListener("play", function () { stopWaiting(); render(); });
    audio.addEventListener("pause", render);
    audio.addEventListener("ended", function () { load(index + 1); start(); });

    toggle.addEventListener("click", function () {
      want = audio.paused;
      remember();
      if (want) start(); else audio.pause();
    });
    next.addEventListener("click", function () {
      load(index + 1);
      want = true;
      remember();
      start();
    });

    load(0);
    render();
    if (want) {
      document.addEventListener("click", firstTouch, true);
      document.addEventListener("keydown", firstTouch, true);
      start();
    }
  })();

  // ---------- site traffic ----------
  // Counts visits with a free counter service (no cookies, no personal data).
  // A visit is one browser tab session; a device is counted the first time it shows up.
  (function () {
    var API = "https://abacus.jasoncameron.dev/";
    var NS = "bkgp-ab2c4843";
    var el = document.getElementById("visits");
    if (demo || !/\.github\.io$/.test(location.hostname) || !window.fetch) return;

    var now = new Date();
    var day = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    var newVisit = true, newDevice = false;
    try {
      newVisit = !sessionStorage.getItem("beerio-visit");
      sessionStorage.setItem("beerio-visit", "1");
      newDevice = !localStorage.getItem("beerio-seen");
      localStorage.setItem("beerio-seen", "1");
    } catch (e) { /* private mode: count the visit, skip the device */ }

    function count(key, bump) {
      return fetch(API + (bump ? "hit/" : "get/") + NS + "/" + key)
        .then(function (r) { return r.json(); })
        .then(function (j) { return j.value || 0; });
    }
    Promise.all([count("visits", newVisit), count("day-" + day, newVisit), count("devices", newDevice)])
      .then(function (v) {
        el.textContent = "Site traffic: " + plural(v[0], "visit") + ", " + v[1] + " today, " + plural(v[2], "device") + ".";
      })
      .catch(function () { /* counter unreachable: show nothing */ });
  })();

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
