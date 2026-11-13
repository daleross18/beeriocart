// Drivers and cups. This file rarely changes. Scores live in results.js.
window.BEERIO_DATA = {
  // car: which Kenney car sprite to use. tint: optional CSS filter for the sprite.
  players: [
    { id: "tommy", name: "Tommy", color: "#e60012", car: "car_red_1", tint: "hue-rotate(-24deg) saturate(1.5)" },
    { id: "dale",  name: "Dale",  color: "#00a2e8", car: "car_blue_1" },
    { id: "miles", name: "Miles", color: "#22b14c", car: "car_green_1" },
    { id: "cal",   name: "Cal",   color: "#ffc400", car: "car_yellow_1" },
    { id: "nate",  name: "Nate",  color: "#9b4dff", car: "car_blue_1", tint: "hue-rotate(62deg) saturate(1.2)" }
  ],

  // The 12 original Mario Kart 8 Deluxe cups, in the order the group is racing them:
  // column by column on the cup select screen (Mushroom, Shell, Flower, Banana, ...).
  // icon: file in assets/emoji (cups) or assets/track (tracks), or a full path.
  cups: [
    { id: "mushroom", name: "Mushroom Cup", icon: "mushroom", color: "#e60012", tracks: [
      ["Mario Kart Stadium", "stadium"], ["Water Park", "ferris_wheel"],
      ["Sweet Sweet Canyon", "lollipop"], ["Thwomp Ruins", "rock"] ] },
    { id: "shell", name: "Shell Cup", icon: "turtle", color: "#22b14c", tracks: [
      ["Wii Moo Moo Meadows", "cow_face"], ["GBA Mario Circuit", "chequered_flag"],
      ["DS Cheep Cheep Beach", "tropical_fish"], ["N64 Toad's Turnpike", "motorway"] ] },
    { id: "flower", name: "Flower Cup", icon: "blossom", color: "#ff7a00", tracks: [
      ["Mario Circuit", "racing_car"], ["Toad Harbor", "ship"],
      ["Twisted Mansion", "ghost"], ["Shy Guy Falls", "gem_stone"] ] },
    { id: "banana", name: "Banana Cup", icon: "banana", color: "#e3b600", tracks: [
      ["GCN Dry Dry Desert", "cactus"], ["SNES Donut Plains 3", "doughnut"],
      ["N64 Royal Raceway", "castle"], ["3DS DK Jungle", "gorilla"] ] },
    { id: "star", name: "Star Cup", icon: "star", color: "#f0b400", tracks: [
      ["Sunshine Airport", "airplane"], ["Dolphin Shoals", "dolphin"],
      ["Electrodrome", "mirror_ball"], ["Mount Wario", "snow_capped_mountain"] ] },
    { id: "leaf", name: "Leaf Cup", icon: "maple_leaf", color: "#c0611a", tracks: [
      ["DS Wario Stadium", "money_bag"], ["GCN Sherbet Land", "shaved_ice"],
      ["3DS Music Park", "musical_notes"], ["N64 Yoshi Valley", "national_park"] ] },
    { id: "special", name: "Special Cup", icon: "crown", color: "#7a3cff", tracks: [
      ["Cloudtop Cruise", "cloud"], ["Bone-Dry Dunes", "bone"],
      ["Bowser's Castle", "fire"], ["Rainbow Road", "rainbow"] ] },
    { id: "lightning", name: "Lightning Cup", icon: "high_voltage", color: "#00a2e8", tracks: [
      ["DS Tick-Tock Clock", "mantelpiece_clock"], ["3DS Piranha Plant Slide", "potted_plant"],
      ["Wii Grumble Volcano", "volcano"], ["N64 Rainbow Road", "comet"] ] },
    { id: "egg", name: "Egg Cup", icon: "egg", color: "#3fbf6b", tracks: [
      ["GCN Yoshi Circuit", "sauropod"], ["Excitebike Arena", "motorcycle"],
      ["Dragon Driftway", "dragon"], ["Mute City", "rocket"] ] },
    { id: "triforce", name: "Triforce Cup", icon: "assets/triforce.svg", color: "#b8930a", tracks: [
      ["Wii Wario's Gold Mine", "pick"], ["SNES Rainbow Road", "sparkles"],
      ["Ice Ice Outpost", "ice"], ["Hyrule Circuit", "crossed_swords"] ] },
    { id: "crossing", name: "Crossing Cup", icon: "leaf_fluttering_in_wind", color: "#1fae98", tracks: [
      ["GCN Baby Park", "baby_bottle"], ["GBA Cheese Land", "cheese_wedge"],
      ["Wild Woods", "evergreen_tree"], ["Animal Crossing", "house"] ] },
    { id: "bell", name: "Bell Cup", icon: "bell", color: "#e08a00", tracks: [
      ["3DS Neo Bowser City", "cityscape"], ["GBA Ribbon Road", "ribbon"],
      ["Super Bell Subway", "metro"], ["Big Blue", "water_wave"] ] }
  ]
};
