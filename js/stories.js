// =====================================================================
//  #MadeRealHere — CONTENT FILE
//  Edit this file to change the narrative and the stories.
//  No other code needs to change when real stories/photos arrive.
//
//  Photos: drop images in /assets/people/ and set `photo` to the path,
//  e.g. photo: "assets/people/priya.jpg". Square images (800x800+) work best.
//  If `photo` is null, an initials avatar is generated.
// =====================================================================

export const CAMPAIGN = {
  hashtag: "#MadeRealHere",
  brand: "Capgemini",
  tagline: "Stories from the people who make it real.",

  // Lines shown one by one when the experience opens.
  prologue: [
    "Every idea starts as a spark.",
    "But it only becomes real when people make it real.",
    "Look around you. Each light is one of them.",
  ],

  finale: {
    title: "Real things are made by real people.",
    body: "You've met a few of the people behind the work. Thousands more are making it real right now — maybe you're next.",
    primary: { label: "Explore careers", url: "https://www.capgemini.com/careers/" },
    secondary: { label: "Share your #MadeRealHere story", url: "mailto:?subject=My%20%23MadeRealHere%20story" },
  },
};

// Chapters unlock in order. Each chapter's stories appear in a new
// direction around the viewer, so the narrative is a journey around the room.
export const CHAPTERS = [
  {
    id: "spark",
    title: "The Spark",
    intro: "Where it started — the moment an idea felt possible.",
    direction: 0,     // degrees around the viewer (0 = straight ahead)
  },
  {
    id: "build",
    title: "The Build",
    intro: "The late nights, the teams, the breakthroughs.",
    direction: -100,  // to the right
  },
  {
    id: "impact",
    title: "The Impact",
    intro: "What changed because they made it real.",
    direction: 135,   // behind-left
  },
];

export const STORIES = [
  {
    id: "story-1",
    chapter: "spark",
    placeholder: true,
    name: "Employee Name",
    role: "Senior Consultant",
    team: "Insights & Data",
    location: "Mumbai, India",
    since: 2019,
    photo: null,
    color: "#12ABDB",
    hook: "An idea sketched on a napkin",
    quote: "I never thought a side idea would end up in front of a client — but here, people listened.",
    story: [
      "Placeholder story. Replace this with the employee's own words about where their idea began.",
      "Two or three short paragraphs work best on a phone screen — keep each under 60 words.",
    ],
  },
  {
    id: "story-2",
    chapter: "spark",
    placeholder: true,
    name: "Employee Name",
    role: "Software Engineer",
    team: "Cloud Infrastructure Services",
    location: "Paris, France",
    since: 2022,
    photo: null,
    color: "#0070AD",
    hook: "First week, first big question",
    quote: "On day three someone asked me what I thought. That's when I knew I could build something here.",
    story: [
      "Placeholder story. Describe the first moment this person felt they could make something real.",
      "Concrete details — a place, a person, a moment — make it feel true.",
    ],
  },
  {
    id: "story-3",
    chapter: "build",
    placeholder: true,
    name: "Employee Name",
    role: "Engineering Manager",
    team: "Engineering & R&D",
    location: "Munich, Germany",
    since: 2016,
    photo: null,
    color: "#2B0A3D",
    accent: "#FF304C",
    hook: "Twelve people, three countries, one deadline",
    quote: "We were in three time zones and it still felt like one room.",
    story: [
      "Placeholder story. Tell how the team built it — the obstacles, the collaboration, the turning point.",
      "This chapter is about the 'how': the work behind the result.",
    ],
  },
  {
    id: "story-4",
    chapter: "build",
    placeholder: true,
    name: "Employee Name",
    role: "UX Designer",
    team: "frog, part of Capgemini Invent",
    location: "London, UK",
    since: 2020,
    photo: null,
    color: "#12ABDB",
    hook: "Designing for people who'd never been asked",
    quote: "We sat with the people who'd actually use it. Everything changed after that.",
    story: [
      "Placeholder story. Describe what it took to build — and who they built it with.",
      "Quotes from colleagues or mentors can make this richer.",
    ],
  },
  {
    id: "story-5",
    chapter: "impact",
    placeholder: true,
    name: "Employee Name",
    role: "Sustainability Lead",
    team: "Capgemini Invent",
    location: "Bengaluru, India",
    since: 2018,
    photo: null,
    color: "#0070AD",
    hook: "A project that cut emissions in half",
    quote: "When the numbers came in, the whole team went quiet. Then we celebrated.",
    story: [
      "Placeholder story. What changed in the world, for a client, a community or for them personally?",
      "End on a feeling — this is the payoff of the narrative.",
    ],
  },
  {
    id: "story-6",
    chapter: "impact",
    placeholder: true,
    name: "Employee Name",
    role: "Delivery Lead",
    team: "Financial Services",
    location: "New York, USA",
    since: 2014,
    photo: null,
    color: "#12ABDB",
    hook: "From intern to leading the team",
    quote: "I came here to learn. I stayed because I got to build things that matter.",
    story: [
      "Placeholder story. A personal growth arc works well to close the experience.",
      "Keep it human, specific and in their own voice.",
    ],
  },
];
