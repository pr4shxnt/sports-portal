/**
 * seedTeams.ts
 * Seeds one event per sport + teams (5-8 random members each).
 * Each team's `event` field points to its sport's event ObjectId,
 * and each event's `registeredTeams` lists all teams for that sport.
 *
 * Safe to re-run — removes previously seeded events/teams first.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "../models/Event.js";
import Team from "../models/Team.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/sports_club";

// ─── Name pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Aarav",
  "Bikash",
  "Chirag",
  "Dipesh",
  "Emon",
  "Farhan",
  "Gagan",
  "Hari",
  "Ishan",
  "Jayesh",
  "Kiran",
  "Lokesh",
  "Manish",
  "Nabin",
  "Om",
  "Prabhat",
  "Rajan",
  "Suresh",
  "Tilak",
  "Ujjwal",
  "Vivek",
  "Anish",
  "Binod",
  "Chetan",
  "Durgesh",
  "Eshan",
  "Firoj",
  "Gaurav",
  "Hemant",
  "Indra",
  "Jagat",
  "Kamal",
  "Lalit",
  "Madan",
  "Nobel",
  "Oscar",
  "Prakash",
  "Ranjit",
  "Sagar",
  "Tej",
  "Umesh",
  "Varun",
  "Santosh",
  "Rabin",
  "Pawan",
  "Nirajan",
  "Milan",
  "Laxman",
];

const LAST_NAMES = [
  "Sharma",
  "Thapa",
  "Rai",
  "KC",
  "Gurung",
  "Magar",
  "Panta",
  "Bhattarai",
  "Lama",
  "Basnet",
  "Dahal",
  "Sah",
  "Joshi",
  "Subedi",
  "Pokhrel",
  "Tamang",
  "Bhandari",
  "Ghimire",
  "Shrestha",
  "Acharya",
  "Pandey",
  "Koirala",
  "Regmi",
  "Yadav",
  "Oli",
  "Khadka",
  "Limbu",
  "Adhikari",
  "Budhathoki",
  "Chaudhary",
  "Giri",
  "Neupane",
  "Raut",
  "Silwal",
  "Bista",
  "Tiwari",
  "Paudel",
  "Khatiwada",
  "Maharjan",
  "Luitel",
  "Ghale",
  "Pudasaini",
  "Chaulagain",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let phoneCounter = 9800000001;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomName = () =>
  `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ` +
  `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;

const generateMembers = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const name = randomName();
    const slug = name.toLowerCase().replace(/\s+/g, ".") + i + Date.now();
    return {
      name,
      email: `${slug}@example.com`,
      phone: String(phoneCounter++),
    };
  });

// ─── Sport config ─────────────────────────────────────────────────────────────
// Each sport gets its own event. The event title contains the sport name
// so AllTeams.tsx's title.toLowerCase().includes(sportLower) match works.

const SPORT_EVENTS: {
  sport: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate: string;
  teams: string[];
}[] = [
  {
    sport: "Football",
    eventTitle: "Inter-College Football Tournament 2025",
    eventDate: "2025-04-10",
    eventEndDate: "2025-04-15",
    teams: [
      "Red Devils FC",
      "Everest Strikers",
      "Himalayan Eagles",
      "Kathmandu Kings",
      "Bagmati United",
      "Pokhara Warriors",
    ],
  },
  {
    sport: "Basketball",
    eventTitle: "SSRC Basketball Championship 2025",
    eventDate: "2025-04-17",
    eventEndDate: "2025-04-20",
    teams: [
      "Hoop Masters",
      "Slam Dunk Squad",
      "Net Breakers",
      "Thunder Ballers",
    ],
  },
  {
    sport: "Futsal",
    eventTitle: "Futsal Premier Cup 2025",
    eventDate: "2025-04-22",
    eventEndDate: "2025-04-24",
    teams: ["Flash Five", "Rapid Boots", "Street Kings", "Goal Getters"],
  },
];

const SEED_EVENT_TITLES = SPORT_EVENTS.map((s) => s.eventTitle);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  // ── Clean up previous seeded events & their teams ───────────────────────────
  for (const title of SEED_EVENT_TITLES) {
    const old = await Event.findOne({ title });
    if (old) {
      const { deletedCount } = await Team.deleteMany({ event: old._id });
      await Event.deleteOne({ _id: old._id });
      console.log(`🗑️  Removed "${title}" + ${deletedCount} team(s)`);
    }
  }
  console.log();

  let totalTeams = 0;

  for (const config of SPORT_EVENTS) {
    // ── Create sport event ────────────────────────────────────────────────────
    const event = await Event.create({
      title: config.eventTitle,
      description: `Official ${config.sport} tournament hosted by SSRC Sports Club.`,
      date: new Date(config.eventDate),
      endDate: new Date(config.eventEndDate),
      location: "SSRC Sports Complex, Kathmandu",
      registeredTeams: [],
      participants: [],
    });
    console.log(`🎉 Event: "${event.title}" (${event._id})`);

    // ── Create teams linked to event ──────────────────────────────────────────
    const teamIds: mongoose.Types.ObjectId[] = [];

    for (const teamName of config.teams) {
      const memberCount = randomInt(5, 8);
      const team = await Team.create({
        name: teamName,
        sport: config.sport,
        teamType: "event",
        event: event._id, // team → event
        members: generateMembers(memberCount),
      });
      teamIds.push(team._id as mongoose.Types.ObjectId);
      console.log(`   ✅ ${teamName.padEnd(22)} — ${memberCount} player(s)`);
      totalTeams++;
    }

    // ── Back-link teams into event ────────────────────────────────────────────
    await Event.findByIdAndUpdate(event._id, {
      registeredTeams: teamIds, // event → teams
    });

    console.log(`   🔗 Linked ${teamIds.length} team(s) to event\n`);
  }

  console.log(
    `🏁 Done! ${SPORT_EVENTS.length} event(s) • ${totalTeams} team(s) seeded.`,
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
