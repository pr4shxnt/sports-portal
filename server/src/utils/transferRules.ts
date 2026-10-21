/**
 * Transfer market rules (Rules §17). Pure: callers pass the current state.
 */
type Id = { toString(): string };
const key = (id?: Id | null) => (id ? id.toString() : "");

export const SQUAD_MIN = 7;
export const SQUAD_MAX = 10;

export interface WindowLike {
  _id: Id;
  opensAt: Date;
  closesAt: Date;
}

export interface SanctionLike {
  kind: string;
  team?: Id | null;
  player?: Id | null;
  amount?: number;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
}

export interface TransferLike {
  window: Id;
  player: Id;
  fromTeam: Id;
  toTeam: Id;
  fee: number;
  status: string;
}

/** In force at `now`: not revoked and not expired. */
export const isActive = (s: SanctionLike, now = new Date()) =>
  !s.revokedAt && (!s.expiresAt || s.expiresAt > now);

/** The window open at `now`, if any. */
export const openWindow = <W extends WindowLike>(
  windows: W[],
  now = new Date(),
) => windows.find((w) => w.opensAt <= now && now <= w.closesAt) ?? null;

/**
 * LP balance per team: earned − paid + received − deductions (§17.4,
 * §17.6). Cancelled transfers are refunded by leaving them out.
 */
export const lpBalances = (
  earned: Record<string, number>,
  transfers: TransferLike[],
  sanctions: SanctionLike[],
) => {
  const rows = new Map<
    string,
    {
      earned: number;
      spent: number;
      received: number;
      deducted: number;
      balance: number;
    }
  >();
  const row = (team: string) => {
    if (!rows.has(team))
      rows.set(team, {
        earned: earned[team] ?? 0,
        spent: 0,
        received: 0,
        deducted: 0,
        balance: 0,
      });
    return rows.get(team)!;
  };
  Object.keys(earned).forEach(row);
  for (const t of transfers) {
    if (t.status !== "completed") continue;
    row(key(t.toTeam)).spent += t.fee;
    row(key(t.fromTeam)).received += t.fee;
  }
  for (const s of sanctions) {
    if (s.kind === "lp_deduction" && !s.revokedAt && s.team)
      row(key(s.team)).deducted += s.amount ?? 0;
  }
  rows.forEach(
    (r) => (r.balance = r.earned - r.spent + r.received - r.deducted),
  );
  return rows;
};

export interface TransferCheckInput {
  now?: Date;
  player: {
    _id: Id;
    team: Id;
    transferValue?: number | null;
    movedInWindow?: Id | null;
  };
  toTeam: Id;
  consent: boolean;
  windows: WindowLike[];
  knockoutStarted: boolean;
  squadSizes: Record<string, number>;
  balance: number;
  sanctions: SanctionLike[];
  transfers: TransferLike[];
}

/**
 * Every §17.4/§17.5 condition, as human-readable failures (empty = allowed).
 */
export const checkTransfer = (input: TransferCheckInput) => {
  const now = input.now ?? new Date();
  const fails: string[] = [];
  const from = key(input.player.team);
  const to = key(input.toTeam);
  const fee = input.player.transferValue;
  const active = input.sanctions.filter((s) => isActive(s, now));
  const window = openWindow(input.windows, now);

  if (from === to) fails.push("The player is already in that team.");
  if (input.knockoutStarted)
    fails.push("No transfers once the knockout stage has begun (§17.5).");
  else if (!window) fails.push("No transfer window is open (§17.5).");
  if (fee == null)
    fails.push("The player has no Transfer Value set yet (§17.3).");
  else if (input.balance < fee)
    fails.push(
      `The buying team has ${input.balance} LP; the Transfer Value is ${fee} LP (§17.4).`,
    );
  if (!input.consent)
    fails.push("The player's written consent must be confirmed (§17.4).");
  if ((input.squadSizes[to] ?? 0) + 1 > SQUAD_MAX)
    fails.push(`The buying team would exceed ${SQUAD_MAX} players (§8.1).`);
  if ((input.squadSizes[from] ?? 0) - 1 < SQUAD_MIN)
    fails.push(
      `The selling team would drop below ${SQUAD_MIN} players (§8.1).`,
    );
  if (
    active.some(
      (s) =>
        s.kind === "transfer_ineligible" &&
        key(s.player) === key(input.player._id),
    )
  )
    fails.push("The player has lost transfer eligibility (§17.6).");
  if (active.some((s) => s.kind === "buy_ban" && key(s.team) === to))
    fails.push("The buying team is banned from buying (§17.6).");
  if (active.some((s) => s.kind === "sell_ban" && key(s.team) === from))
    fails.push("The selling team is banned from selling (§17.6).");
  if (window) {
    if (key(input.player.movedInWindow) === key(window._id))
      fails.push("The player already moved in this window (§17.4).");
    const lost = input.transfers.some(
      (t) =>
        t.status === "completed" &&
        key(t.window) === key(window._id) &&
        key(t.fromTeam) === from,
    );
    if (lost)
      fails.push(
        "The selling team has already lost a player in this window (§17.4).",
      );
  }
  return { ok: fails.length === 0, fails, window, fee: fee ?? null };
};
