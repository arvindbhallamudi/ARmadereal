// =====================================================================
//  #MadeRealHere — CONTENT FILE
//  Edit this file to change the narrative and the stories.
//
//  Wrap a word in *asterisks* to highlight it in Capgemini vibrant blue,
//  the same way the campaign posters do.
//
//  `poster` is the campaign creative shown as the floating card in AR and
//  at the top of the story sheet (4:5, e.g. 1024x1280 JPG).
//  `story` is optional longer text (array of paragraphs) shown under the quote.
// =====================================================================

export const CAMPAIGN = {
  hashtag: "#MadeRealHere",
  brand: "Capgemini",
  tagline: "Real people. Real stories. Made real here.",

  // Public address of the experience. The QR code shown on desktop points here.
  liveUrl: "https://arvindbhallamudi.github.io/ARmadereal/",

  // Lines shown one by one when the experience opens.
  prologue: [
    "Every story here is *real*.",
    "Each one was *made* by someone at Capgemini.",
    "Look around you. Each light is *one of them*.",
  ],

  finale: {
    title: "Real careers are *made* by real people.",
    body: "You've met five of the people behind the work. Thousands more are making it real every day. Your story could be next.",
    primary: { label: "Explore careers at Capgemini", url: "https://www.capgemini.com/careers/" },
    secondary: { label: "See more on LinkedIn", url: "https://www.linkedin.com/feed/hashtag/maderealhere/" },
  },
};

// Chapters follow the campaign pillars and unlock in order. Each chapter's
// stories appear in a new direction, so the narrative is a walk around the room.
export const CHAPTERS = [
  {
    id: "culture",
    title: "Culture",
    intro: "Some places feel like *home*, even when you come back to them.",
    direction: 0,     // degrees around the viewer (0 = straight ahead)
  },
  {
    id: "growth",
    title: "Growth",
    intro: "Growing means getting *comfortable* with what you don't know yet.",
    direction: -90,   // to the right
  },
  {
    id: "pride",
    title: "Pride",
    intro: "Sometimes the best view is looking back at *how far* you've come.",
    direction: 180,   // behind
  },
  {
    id: "impact",
    title: "Impact",
    intro: "The work that matters most reaches *beyond* the work itself.",
    direction: 90,    // to the left
  },
];

export const STORIES = [
  {
    id: "sandeep-s",
    chapter: "culture",
    name: "Sandeep S.",
    role: "Senior Manager",
    poster: "assets/people/sandeep-s.jpg",
    hook: "A long-awaited homecoming",
    quote: "*Rejoining* Capgemini felt like a long-awaited *homecoming.*",
    story: [],
  },
  {
    id: "rochell-fernandes",
    chapter: "growth",
    name: "Rochell Fernandes",
    role: "ER&D Strategic Partnerships Manager",
    poster: "assets/people/rochell-fernandes.jpg",
    hook: "Comfortable with not knowing",
    quote: "I *learnt* to be *comfortable* with not *knowing* everything.",
    story: [],
  },
  {
    id: "rutika-gaikwad",
    chapter: "pride",
    name: "Rutika Gaikwad",
    role: "Workday Consultant",
    poster: "assets/people/rutika-gaikwad.jpg",
    hook: "From technical HR to Consultant",
    quote: "From *entering* a whole new world of technical HR to *growing* into a Consultant, I am *proud* of how far I have come.",
    story: [],
  },
  {
    id: "anitha-raman",
    chapter: "impact",
    name: "Anitha Raman",
    role: "Capability Manager",
    poster: "assets/people/anitha-raman.jpg",
    hook: "Impact beyond project delivery",
    quote: "It has been a *rewarding* experience to create *impact* beyond project delivery.",
    story: [],
  },
  {
    id: "smita-kumar",
    chapter: "impact",
    name: "Smita Kumar",
    role: "Agentic AI & Cloud Learning Manager",
    poster: "assets/people/smita-kumar.jpg",
    hook: "Every learner shaped me too",
    quote: "While I helped shape *careers*, every learner was *shaping* me too.",
    story: [],
  },
];
