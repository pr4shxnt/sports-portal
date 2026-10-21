import { Request, Response } from "express";
import mongoose from "mongoose";
import Competition from "../models/Competition.js";
import Draw from "../models/Draw.js";
import Match from "../models/Match.js";
import Player from "../models/Player.js";
import Sanction, { ISanction } from "../models/Sanction.js";
import Team from "../models/Team.js";
import Transfer from "../models/Transfer.js";
import TransferWindow from "../models/TransferWindow.js";
import { leaguePoints, StatsMatch } from "../utils/stats.js";
import {
  checkTransfer,
  isActive,
  lpBalances,
  openWindow,
} from "../utils/transferRules.js";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ message: error.message });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  };

const same = (a: unknown, b: unknown) => String(a) === String(b);
const PLAYER_FIELDS = "team name shirtNumber position photo transferValue";

const ensureCompetition = async (id: string) => {
  if (!mongoose.isValidObjectId(id) || !(await Competition.exists({ _id: id })))
    throw new HttpError(404, "Competition not found");
};

/** Everything the market depends on, loaded once. */
const loadMarket = async (competitionId: unknown) => {
  const [windows, transfers, sanctions, players, teams, matches, knockout] =
    await Promise.all([
      TransferWindow.find({ competition: competitionId })
        .sort({ opensAt: 1 })
        .lean(),
      Transfer.find({ competition: competitionId })
        .sort({ createdAt: -1 })
        .lean(),
      Sanction.find({ competition: competitionId })
        .sort({ createdAt: -1 })
        .lean(),
      Player.find({ competition: competitionId })
        .select(PLAYER_FIELDS + " movedInWindow")
        .sort({ order: 1 })
        .lean(),
      Team.find({ competition: competitionId }).select("name").lean(),
      Match.find({ competition: competitionId }).lean(),
      Draw.exists({ competition: competitionId, format: "Knockout" }),
    ]);
  const teamIds = teams.map((t) => String(t._id));
  const earned = Object.fromEntries(
    leaguePoints(matches as unknown as StatsMatch[], teamIds).map((r) => [
      r.team,
      r.total,
    ]),
  );
  const balances = lpBalances(earned, transfers, sanctions);
  const squadSizes: Record<string, number> = {};
  players.forEach((p) => {
    squadSizes[String(p.team)] = (squadSizes[String(p.team)] ?? 0) + 1;
  });
  return {
    windows,
    transfers,
    sanctions,
    players,
    teams,
    balances,
    squadSizes,
    knockoutStarted: !!knockout,
  };
};

type Market = Awaited<ReturnType<typeof loadMarket>>;

const marketView = (m: Market, isPublic: boolean) => {
  const now = new Date();
  const open = m.knockoutStarted ? null : openWindow(m.windows, now);
  return {
    teams: m.teams,
    players: m.players.map(({ movedInWindow, ...p }) =>
      isPublic ? p : { ...p, movedInWindow },
    ),
    windows: m.windows,
    openWindow: open?._id ?? null,
    knockoutStarted: m.knockoutStarted,
    balances: m.teams.map((t) => ({
      team: String(t._id),
      squad: m.squadSizes[String(t._id)] ?? 0,
      ...(m.balances.get(String(t._id)) ?? {
        earned: 0,
        spent: 0,
        received: 0,
        deducted: 0,
        balance: 0,
      }),
    })),
    transfers: isPublic
      ? m.transfers.map(({ consentNote, approvedBy, ...t }) => t)
      : m.transfers,
    sanctions: m.sanctions.map((s) => ({
      ...(isPublic ? { ...s, createdBy: undefined } : s),
      active: isActive(s as any, now),
    })),
  };
};

const checkFor = (
  m: Market,
  playerId: string,
  toTeam: string,
  consent: boolean,
) => {
  const player = m.players.find((p) => same(p._id, playerId));
  if (!player) throw new HttpError(404, "Player not found in this competition");
  if (!m.teams.some((t) => same(t._id, toTeam)))
    throw new HttpError(400, "Choose a team in this competition");
  return {
    player,
    ...checkTransfer({
      player,
      toTeam,
      consent,
      windows: m.windows,
      knockoutStarted: m.knockoutStarted,
      squadSizes: m.squadSizes,
      balance: m.balances.get(toTeam)?.balance ?? 0,
      sanctions: m.sanctions,
      transfers: m.transfers,
    }),
  };
};

/* ───────────────────────────── Admin ───────────────────────────── */

// @desc    Windows, LP balances, transfer values, transfers and sanctions
// @route   GET /api/competitions/:id/market
export const getMarket = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  res.json(marketView(await loadMarket(req.params.id), false));
});

// @route   POST /api/competitions/:id/market/windows { name, opensAt, closesAt }
export const createWindow = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const opensAt = new Date(req.body.opensAt);
  const closesAt = new Date(req.body.closesAt);
  if (!(closesAt > opensAt))
    throw new HttpError(400, "A window must close after it opens");
  const overlap = await TransferWindow.exists({
    competition: req.params.id,
    opensAt: { $lt: closesAt },
    closesAt: { $gt: opensAt },
  });
  if (overlap) throw new HttpError(400, "Windows can't overlap");
  await TransferWindow.create({
    competition: req.params.id,
    name: req.body.name,
    opensAt,
    closesAt,
  });
  res.status(201).json(marketView(await loadMarket(req.params.id), false));
});

// @route   DELETE /api/competitions/:id/market/windows/:windowId
export const deleteWindow = handle(async (req, res) => {
  const window = await TransferWindow.findOne({
    _id: req.params.windowId,
    competition: req.params.id,
  });
  if (!window) throw new HttpError(404, "Window not found");
  if (await Transfer.exists({ window: window._id }))
    throw new HttpError(400, "This window has transfers and can't be deleted");
  await window.deleteOne();
  res.json(marketView(await loadMarket(req.params.id), false));
});

// @desc    Set Transfer Values (§17.3) — { values: { playerId: number|null } }
// @route   PUT /api/competitions/:id/market/values
export const setValues = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const values: Record<string, number | null> = req.body.values ?? {};
  const ids = Object.keys(values);
  const known = await Player.countDocuments({
    _id: { $in: ids },
    competition: req.params.id,
  });
  if (known !== ids.length) throw new HttpError(400, "Unknown player");
  if (ids.length) {
    await Player.bulkWrite(
      ids.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { transferValue: values[id] } },
        },
      })),
    );
  }
  res.json(marketView(await loadMarket(req.params.id), false));
});

// @desc    Dry-run a transfer: every rule that would block it
// @route   POST /api/competitions/:id/market/check { player, toTeam, consent }
export const checkTransferRoute = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const m = await loadMarket(req.params.id);
  const { ok, fails, fee } = checkFor(
    m,
    req.body.player,
    req.body.toTeam,
    !!req.body.consent,
  );
  res.json({ ok, fails, fee });
});

// @desc    Approve and complete a transfer (§17.4)
// @route   POST /api/competitions/:id/market/transfers { player, toTeam, consent, consentNote }
export const createTransfer = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const m = await loadMarket(req.params.id);
  const { ok, fails, window, fee, player } = checkFor(
    m,
    req.body.player,
    req.body.toTeam,
    req.body.consent === true,
  );
  if (!ok) throw new HttpError(400, fails.join(" "));

  // Claim the player atomically so two approvals can't both succeed.
  const moved = await Player.findOneAndUpdate(
    { _id: player._id, team: player.team, movedInWindow: { $ne: window!._id } },
    {
      $set: {
        team: req.body.toTeam,
        movedInWindow: window!._id,
        captaincy: null,
        order: 999,
      },
    },
  );
  if (!moved)
    throw new HttpError(409, "The player changed in the meantime; try again");
  await Transfer.create({
    competition: req.params.id,
    window: window!._id,
    player: player._id,
    fromTeam: player.team,
    toTeam: req.body.toTeam,
    fee: fee!,
    consentNote: req.body.consentNote,
    approvedBy: req.user?._id,
  });
  res.status(201).json(marketView(await loadMarket(req.params.id), false));
});

// @desc    Cancel a completed transfer (§17.6): player returns, LP refunded
// @route   POST /api/competitions/:id/market/transfers/:transferId/cancel { reason }
export const cancelTransfer = handle(async (req, res) => {
  const transfer = await Transfer.findOne({
    _id: req.params.transferId,
    competition: req.params.id,
    status: "completed",
  });
  if (!transfer) throw new HttpError(404, "Completed transfer not found");
  const back = await Player.findOneAndUpdate(
    { _id: transfer.player, team: transfer.toTeam },
    { $set: { team: transfer.fromTeam, captaincy: null, movedInWindow: null } },
  );
  if (!back)
    throw new HttpError(
      400,
      "The player is no longer at the buying team, so this transfer can't be reversed.",
    );
  transfer.status = "cancelled";
  transfer.cancelReason = req.body.reason;
  transfer.cancelledAt = new Date();
  await transfer.save();
  res.json(marketView(await loadMarket(req.params.id), false));
});

// @desc    Impose a sanction (§17.6)
// @route   POST /api/competitions/:id/market/sanctions
export const createSanction = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const { kind, team, player, amount, matches, expiresAt, reason } =
    req.body as Partial<ISanction> & { team?: string; player?: string };
  const needsTeam = ["buy_ban", "sell_ban", "lp_deduction"].includes(kind!);
  if (
    needsTeam &&
    !(await Team.exists({ _id: team, competition: req.params.id }))
  )
    throw new HttpError(400, "Choose a team in this competition");
  if (
    !needsTeam &&
    !(await Player.exists({ _id: player, competition: req.params.id }))
  )
    throw new HttpError(400, "Choose a player in this competition");
  if (kind === "lp_deduction" && !(amount! > 0))
    throw new HttpError(400, "Enter how many LP to deduct");
  if (kind === "match_ban" && !(matches! > 0))
    throw new HttpError(400, "Enter how many matches the ban lasts");
  await Sanction.create({
    competition: req.params.id,
    kind,
    team: needsTeam ? team : null,
    player: needsTeam ? null : player,
    amount: kind === "lp_deduction" ? amount : undefined,
    matches: kind === "match_ban" ? matches : undefined,
    expiresAt:
      ["buy_ban", "sell_ban", "transfer_ineligible"].includes(kind!) &&
      expiresAt
        ? new Date(expiresAt)
        : null,
    reason,
    createdBy: req.user?._id,
  });
  res.status(201).json(marketView(await loadMarket(req.params.id), false));
});

// @desc    Revoke a sanction (e.g. after a successful appeal, §17.9)
// @route   POST /api/competitions/:id/market/sanctions/:sanctionId/revoke
export const revokeSanction = handle(async (req, res) => {
  const s = await Sanction.findOneAndUpdate(
    { _id: req.params.sanctionId, competition: req.params.id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  if (!s) throw new HttpError(404, "Active sanction not found");
  res.json(marketView(await loadMarket(req.params.id), false));
});

/* ───────────────────────────── Public ───────────────────────────── */

// @desc    Public market: balances, values, transfers and sanctions
// @route   GET /api/competitions/public/:slug/market
export const getPublicMarket = handle(async (req, res) => {
  const c = await Competition.findOne({
    formSlug: String(req.params.slug).toLowerCase(),
  })
    .select("_id")
    .lean();
  if (!c) throw new HttpError(404, "Competition not found");
  res.json(marketView(await loadMarket(c._id), true));
});

/** Removes a competition's market records. */
export const deleteCompetitionMarket = (competitionId: unknown) =>
  Promise.all([
    TransferWindow.deleteMany({ competition: competitionId }),
    Transfer.deleteMany({ competition: competitionId }),
    Sanction.deleteMany({ competition: competitionId }),
  ]);
