import type {
  Market,
  SanctionKind,
  SanctionRecord,
  TransferWindow,
} from "../../../../store/api";

export const SANCTION_LABEL: Record<SanctionKind, string> = {
  buy_ban: "Ban on buying",
  sell_ban: "Ban on selling",
  lp_deduction: "LP deduction",
  transfer_ineligible: "Loss of transfer eligibility",
  match_ban: "Match ban",
};

/** Sanctions on a team vs on a player. */
export const TEAM_SANCTIONS: SanctionKind[] = [
  "buy_ban",
  "sell_ban",
  "lp_deduction",
];

export const formatWhen = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export const windowState = (w: TransferWindow, now = Date.now()) =>
  now < Date.parse(w.opensAt)
    ? "upcoming"
    : now > Date.parse(w.closesAt)
      ? "closed"
      : "open";

/** "Ban on buying — Alpha · until 3 Dec" style description. */
export const describeSanction = (
  s: SanctionRecord,
  market: Pick<Market, "teams" | "players">,
) => {
  const team = market.teams.find((t) => t._id === s.team)?.name;
  const player = market.players.find((p) => p._id === s.player)?.name;
  const subject = team ?? player ?? "—";
  const length =
    s.kind === "lp_deduction"
      ? `${s.amount} LP`
      : s.kind === "match_ban"
        ? `${s.matches} match${s.matches === 1 ? "" : "es"}`
        : s.expiresAt
          ? `until ${formatWhen(s.expiresAt)}`
          : "rest of the season";
  return { subject, length };
};

export const nameMaps = (market: Pick<Market, "teams" | "players">) => ({
  team: new Map(market.teams.map((t) => [t._id, t.name])),
  player: new Map(market.players.map((p) => [p._id, p])),
});
