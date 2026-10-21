import type {
  MatchDetail,
  NewsCategory,
  NewsInput,
} from "../../../../store/api";
import { formatKickoff } from "../match/eventMeta";

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  match_report: "Match report",
  announcement: "Announcement",
  feature: "Feature",
};

export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

/** Body text → paragraphs (blank lines) with single line breaks kept. */
export const paragraphs = (body = "") =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * A draft match report from a finished match: headline, summary and the
 * goals, cards and shootout with their minutes, ready to be written up.
 */
export const matchReportDraft = (detail: MatchDetail): NewsInput => {
  const { match, home, away } = detail;
  const players = new Map(detail.players.map((p) => [p._id, p]));
  const teamName = (id: string) => (id === home._id ? home.name : away.name);
  const [regulation, pens] = detail.score.split(" (");
  const shootout = pens?.replace(" pens)", "");
  const [h, a] = regulation.split(" - ").map(Number);
  const score = `${h}–${a}`;

  const winner =
    detail.result && detail.result !== "DRAW" ? teamName(detail.result) : null;
  const loser = winner ? (winner === home.name ? away.name : home.name) : null;
  const title = match.forfeitedBy
    ? `${winner} awarded the win as ${loser} forfeit`
    : shootout
      ? `${winner} edge ${loser} on penalties`
      : winner
        ? `${winner} beat ${loser} ${Math.max(h, a)}–${Math.min(h, a)}`
        : `${home.name} and ${away.name} draw ${score}`;

  const who = (playerId?: string, teamId?: string) => {
    const p = playerId ? players.get(playerId) : undefined;
    return `${p?.name ?? "Unknown player"} (${teamName(teamId ?? "")})`;
  };
  const events = [...match.events].sort((x, y) => x.minute - y.minute);
  const goals = events
    .filter((e) => ["goal", "penalty_goal", "own_goal"].includes(e.type))
    .map(
      (e) =>
        `${e.minute}' ${who(e.player, e.team)}${e.type === "penalty_goal" ? " – penalty" : e.type === "own_goal" ? " – own goal" : ""}`,
    );
  const cards = events
    .filter((e) => e.type === "yellow" || e.type === "red")
    .map(
      (e) =>
        `${e.minute}' ${e.type === "yellow" ? "Yellow" : "Red"} card – ${who(e.player, e.team)}${e.secondYellow ? ", second yellow" : ""}`,
    );
  const missed = events
    .filter((e) => e.type === "penalty_missed")
    .map(
      (e) =>
        `${e.minute}' Penalty ${e.saved ? "saved" : "missed"} – ${who(e.player, e.team)}`,
    );

  const where = [detail.stage, formatKickoff(match.kickoff), match.venue]
    .filter((x) => x && x !== "Time TBC")
    .join(" · ");
  const body = [
    `Full time: ${home.name} ${score} ${away.name}${shootout ? ` (${shootout} on penalties)` : ""}.${where ? `\n${where}` : ""}`,
    goals.length ? `Goals\n${goals.join("\n")}` : "No goals.",
    cards.length ? `Cards\n${cards.join("\n")}` : "",
    missed.length ? `Penalties\n${missed.join("\n")}` : "",
    "Write the story of the match here.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title,
    category: "match_report",
    summary: `${home.name} ${score} ${away.name}${shootout ? ` (${shootout} pens)` : ""}${detail.stage ? ` · ${detail.stage}` : ""}`,
    body,
    match: match._id,
    status: "draft",
  };
};
