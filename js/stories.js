// =====================================================================
//  #MadeRealHere — CONTENT FILE
//  Everything editable lives here. No other code needs to change.
//
//  • Wrap a word in *asterisks* to highlight it in Capgemini vibrant blue,
//    the same way the campaign posters do.
//  • Each person has an illustrated portrait built from `look`
//    (see js/avatar.js for every option). No photos are used.
//  • `scene` is the two-colour background of their card, taken from the
//    setting of their campaign poster.
//  • `story` is optional longer text (array of paragraphs) shown under the quote.
// =====================================================================

export const CAMPAIGN = {
  hashtag: "#MadeRealHere",
  brand: "Capgemini",
  tagline: "Real people. Real stories. Made real here.",

  // Public address of the experience. QR codes point here.
  liveUrl: "https://arvindbhallamudi.github.io/ARmadereal/",

  // Official logo files (upload them to assets/brand/). White version is used
  // on the dark experience. If a file is missing, the experience simply hides it.
  logo: "assets/brand/capgemini-logo-white.svg",

  prologue: [
    "Every story here is *real*.",
    "Follow the *path of light* to meet the people who made it real.",
    "*Collect* their stories along the way.",
  ],

  finale: {
    title: "Real careers are *made* by real people.",
    // {count} becomes the number of stories this visitor collected
    body: "You've met {count} of the people who made it real at Capgemini. Yours could be next.",
    primary: { label: "Explore careers at Capgemini", url: "https://www.capgemini.com/careers/" },
    secondary: { label: "See more on LinkedIn", url: "https://www.linkedin.com/feed/hashtag/maderealhere/" },
  },

  // Optional: where people can send their own story to the campaign team
  // (e.g. a Microsoft Forms link). Leave null to hide the button.
  submit: null, // { label: "Send it to the campaign team", url: "https://forms.office.com/..." }
};

// Chapters follow the campaign pillars and unlock in order along the path.
export const CHAPTERS = [
  { id: "culture",    title: "Culture",    intro: "Some places feel like *home*, even when you come back to them." },
  { id: "growth",     title: "Growth",     intro: "Growing means getting *comfortable* with what you don't know yet." },
  { id: "pride",      title: "Pride",      intro: "Sometimes the best view is looking back at *how far* you've come." },
  { id: "innovation", title: "Innovation", intro: "Curiosity can take you somewhere you *never imagined*." },
  { id: "purpose",    title: "Purpose",    intro: "Work feels different when it has a *purpose*." },
  { id: "impact",     title: "Impact",     intro: "The work that matters most reaches *beyond* the work itself." },
];

export const STORIES = [
  {
    id: "sandeep-s", chapter: "culture",
    name: "Sandeep S.", role: "Senior Manager",
    quote: "“*Rejoining* Capgemini felt like a long-awaited *homecoming.*”",
    scene: ["#2e4a32", "#5b3b25"],
    look: { skin: "#c08354", hair: "short", hairColor: "#16110e", beard: "short",
            outfit: { type: "polo", color: "#efe6d3" } },
  },
  {
    id: "rochell-fernandes", chapter: "growth",
    name: "Rochell Fernandes", role: "ER&D Strategic Partnerships Manager",
    quote: "“I *learnt* to be *comfortable* with not *knowing* everything.”",
    scene: ["#5a3f2c", "#1f2c3b"],
    look: { skin: "#d39b74", hair: "bun", hairColor: "#2b1a12", bindi: true, lips: "#a3243b",
            glasses: { color: "#d7a39a", shape: "round" },
            outfit: { type: "saree", color: "#0f6f73", accent: "#6b1f2e", accent2: "#c9a24a" } },
  },
  {
    id: "rutika-gaikwad", chapter: "pride",
    name: "Rutika Gaikwad", role: "Workday Consultant",
    quote: "“From *entering* a whole new world of technical HR to *growing* into a Consultant, I am *proud* of how far I have come.”",
    scene: ["#b5612f", "#2b2a33"],
    look: { skin: "#d9a47c", hair: "long-straight", hairColor: "#140f0d", lips: "#d0504a",
            earrings: { style: "stud", color: "#f4efe6" },
            outfit: { type: "top", color: "#8c2f24" } },
  },
  {
    id: "anwita-bhure", chapter: "innovation",
    name: "Anwita Bhure", role: "Data Scientist",
    quote: "“*Started* with social listening, never imagined it would lead me to AI.”",
    scene: ["#3a5a78", "#16243a"],
    look: { skin: "#c48a60", hair: "shoulder-layered", hairColor: "#2a1b14", smile: "big",
            outfit: { type: "tshirt", color: "#1b1b1f" } },
  },
  {
    id: "anthony-johnson", chapter: "purpose",
    name: "Anthony Johnson", role: "IT Manager",
    quote: "“Happy to say, I've *become* the *best version* of myself here.”",
    scene: ["#5b5d66", "#1d2330"],
    look: { skin: "#7a4a2e", hair: "short", hairColor: "#0f0b09", beard: "short",
            outfit: { type: "shirt", color: "#f2b8c6" } },
  },
  {
    id: "navin-malhotra", chapter: "purpose",
    name: "Navin Malhotra", role: "Program Manager",
    quote: "“I *discovered* a new sense of *purpose* helping clients address *sustainability* challenges.”",
    scene: ["#2b3a4c", "#0f1724"],
    look: { skin: "#a86a44", hair: "short-curly", hairColor: "#141010", beard: "stubble",
            glasses: { color: "#d0304e", shape: "square" },
            outfit: { type: "tshirt", color: "#ef8a2a" } },
  },
  {
    id: "anitha-raman", chapter: "impact",
    name: "Anitha Raman", role: "Capability Manager",
    quote: "“It has been a *rewarding* experience to create *impact* beyond project delivery.”",
    scene: ["#2f6138", "#10291c"],
    look: { skin: "#b57a52", hair: "long-wavy", hairColor: "#120e0c", bindi: true, lips: "#b4475b",
            earrings: { style: "drop", color: "#5aa06a" },
            outfit: { type: "kurta-dupatta", color: "#d9a22e", pattern: "dots", accent: "#147c8a", accent2: "#6b2a1e" } },
  },
  {
    id: "smita-kumar", chapter: "impact",
    name: "Smita Kumar", role: "Agentic AI & Cloud Learning Manager",
    quote: "“While I helped shape *careers*, every learner was *shaping* me too.”",
    scene: ["#4a4f5a", "#161a22"],
    look: { skin: "#c88d66", hair: "shoulder-curly", hairColor: "#1e1410", hairTip: "#9a5a2c", lips: "#c23a4a",
            glasses: { color: "#141414", shape: "square" }, lanyard: true,
            outfit: { type: "blazer", color: "#1c1c20", accent: "#f4f4f4" } },
  },
  {
    id: "olive-saha", chapter: "impact",
    name: "Olive Saha", role: "Process Lead",
    quote: "“I went from *delivering* the work to *leading* the people who make it happen.”",
    scene: ["#355a70", "#122031"],
    look: { skin: "#a36a45", hair: "short", hairColor: "#141010", beard: "full", lanyard: true,
            outfit: { type: "shirt", color: "#1f2f5c", pattern: "ditsy" } },
  },
  {
    id: "sanjay-das-chowdhury", chapter: "impact",
    name: "Sanjay Das Chowdhury", role: "Global Communication and Transformation Manager",
    quote: "“One *opportunity* took me from training rooms to managing *global transformation.*”",
    scene: ["#2f78c0", "#2f5b2b"],
    look: { skin: "#c08458", hair: "short-up", hairColor: "#16110e",
            outfit: { type: "kurta-vest", color: "#efe4cf", pattern: "print", accent: "#c4232b", accent2: "#1a1a1a" } },
  },
];
