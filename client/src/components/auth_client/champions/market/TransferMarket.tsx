import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  errorMessage,
  useCheckTransferMutation,
  useGetCompetitionQuery,
  useGetMarketQuery,
  useMarketActionMutation,
  type Market,
  type MarketAction,
  type SanctionKind,
  type TransferCheck,
} from "../../../../store/api";
import PlayerAvatar from "../PlayerAvatar";
import {
  SANCTION_LABEL,
  TEAM_SANCTIONS,
  describeSanction,
  formatWhen,
  nameMaps,
  windowState,
} from "./marketMeta";

const card =
  "p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800";
const field =
  "w-full min-w-0 px-2.5 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#DD1D25]/40";
const label = "block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1";
const th =
  "pb-2 px-2 text-[10px] font-black uppercase tracking-wider text-zinc-400";
const btn =
  "px-4 py-2 rounded-lg text-xs font-bold bg-[#DD1D25] text-white hover:bg-[#C41920] disabled:opacity-40";

/** Local datetime-local value → ISO string. */
const toIso = (local: string) => new Date(local).toISOString();

/** Admin transfer market (Rules §17). */
const TransferMarket = () => {
  const { id } = useParams();
  const {
    data: market,
    isLoading,
    isError,
  } = useGetMarketQuery(id!, {
    skip: !id,
  });
  const { data: detail } = useGetCompetitionQuery(id!, { skip: !id });
  const [act, { isLoading: busy }] = useMarketActionMutation();

  const run = async (action: MarketAction, success: string) => {
    try {
      await act({ competitionId: id!, action }).unwrap();
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save"));
      return false;
    }
  };

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
    );
  if (isError || !market)
    return (
      <p className="p-6 text-center text-red-500">
        Couldn't load the transfer market.
      </p>
    );

  const open = market.windows.find((w) => w._id === market.openWindow);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to={`/dashboard/champions-league/${id}`}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        ← {detail?.competition.name ?? "Competition"}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#DD1D25]">
            League Points
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Transfer market
          </h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black ${open ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
        >
          {market.knockoutStarted
            ? "Closed — knockout stage (§17.5)"
            : open
              ? `${open.name} open until ${formatWhen(open.closesAt)}`
              : "No window open"}
        </span>
      </header>

      <Balances market={market} />
      <RecordTransfer
        competitionId={id!}
        market={market}
        busy={busy}
        onApprove={(data) =>
          run({ kind: "transfer", data }, "Transfer completed")
        }
      />
      <Values
        market={market}
        busy={busy}
        onSave={(values) =>
          run({ kind: "values", data: { values } }, "Transfer Values saved")
        }
      />
      <Windows
        market={market}
        busy={busy}
        onCreate={(data) => run({ kind: "window", data }, "Window announced")}
        onDelete={(windowId) =>
          run({ kind: "deleteWindow", windowId }, "Window deleted")
        }
      />
      <History
        market={market}
        busy={busy}
        onCancel={(transferId, reason) =>
          run({ kind: "cancel", transferId, reason }, "Transfer cancelled")
        }
      />
      <Sanctions
        market={market}
        busy={busy}
        onCreate={(data) =>
          run({ kind: "sanction", data }, "Sanction recorded")
        }
        onRevoke={(sanctionId) =>
          run({ kind: "revoke", sanctionId }, "Sanction revoked")
        }
      />
    </div>
  );
};

const Balances = ({ market }: { market: Market }) => {
  const names = nameMaps(market).team;
  const rows = [...market.balances].sort((a, b) => b.balance - a.balance);
  return (
    <section className={card}>
      <h2 className="text-lg font-bold mb-1">LP balances</h2>
      <p className="text-xs text-zinc-500 mb-4">
        Earned from matches (§17.2), minus Transfer Values paid, plus values
        received, minus deductions. Separate from table points.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-left">
              <th className={th}>Team</th>
              <th className={`${th} text-right`}>Squad</th>
              <th className={`${th} text-right`}>Earned</th>
              <th className={`${th} text-right hidden sm:table-cell`}>Spent</th>
              <th className={`${th} text-right hidden sm:table-cell`}>
                Received
              </th>
              <th className={`${th} text-right hidden sm:table-cell`}>
                Deducted
              </th>
              <th className={`${th} text-right`}>Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((b) => (
              <tr key={b.team}>
                <td className="py-2 px-2 font-semibold">{names.get(b.team)}</td>
                <td
                  className={`py-2 px-2 text-right ${b.squad < 7 || b.squad > 10 ? "text-amber-600 font-bold" : ""}`}
                >
                  {b.squad}
                </td>
                <td className="py-2 px-2 text-right">{b.earned}</td>
                <td className="py-2 px-2 text-right hidden sm:table-cell">
                  {b.spent ? `−${b.spent}` : 0}
                </td>
                <td className="py-2 px-2 text-right hidden sm:table-cell">
                  {b.received ? `+${b.received}` : 0}
                </td>
                <td className="py-2 px-2 text-right hidden sm:table-cell">
                  {b.deducted ? `−${b.deducted}` : 0}
                </td>
                <td className="py-2 px-2 text-right font-black">{b.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const RecordTransfer = ({
  competitionId,
  market,
  busy,
  onApprove,
}: {
  competitionId: string;
  market: Market;
  busy: boolean;
  onApprove: (data: {
    player: string;
    toTeam: string;
    consent: boolean;
    consentNote?: string;
  }) => Promise<boolean>;
}) => {
  const [player, setPlayer] = useState("");
  const [toTeam, setToTeam] = useState("");
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [check, setCheck] = useState<TransferCheck | null>(null);
  const [runCheck] = useCheckTransferMutation();
  const names = nameMaps(market);
  const from = names.player.get(player)?.team;

  // Live dry run of every §17.4 rule as the form changes.
  useEffect(() => {
    if (!player || !toTeam) return;
    let stale = false;
    runCheck({ competitionId, player, toTeam, consent })
      .unwrap()
      .then((r) => !stale && setCheck(r))
      .catch(() => !stale && setCheck(null));
    return () => {
      stale = true;
    };
  }, [competitionId, player, toTeam, consent, market, runCheck]);
  const shown = player && toTeam ? check : null;

  const approve = async () => {
    const p = names.player.get(player);
    if (
      !window.confirm(
        `Approve ${p?.name}'s move from ${names.team.get(from ?? "")} to ${names.team.get(toTeam)} for ${shown?.fee} LP?`,
      )
    )
      return;
    if (
      await onApprove({
        player,
        toTeam,
        consent,
        consentNote: note || undefined,
      })
    ) {
      setPlayer("");
      setToTeam("");
      setConsent(false);
      setNote("");
    }
  };

  return (
    <section className={card}>
      <h2 className="text-lg font-bold mb-1">Record a transfer</h2>
      <p className="text-xs text-zinc-500 mb-4">
        The buying team pays the player's Transfer Value; the selling team
        receives the same amount. The player can play for the new team from its
        next match.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className={label}>
          Player
          <select
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            className={`${field} mt-1`}
          >
            <option value="">Choose a player…</option>
            {market.teams.map((t) => (
              <optgroup key={t._id} label={t.name}>
                {market.players
                  .filter((p) => p.team === t._id)
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                      {p.transferValue != null
                        ? ` — ${p.transferValue} LP`
                        : " — no value"}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className={label}>
          Buying team
          <select
            value={toTeam}
            onChange={(e) => setToTeam(e.target.value)}
            className={`${field} mt-1`}
          >
            <option value="">Choose a team…</option>
            {market.teams
              .filter((t) => t._id !== from)
              .map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} (
                  {market.balances.find((b) => b.team === t._id)?.balance ?? 0}{" "}
                  LP)
                </option>
              ))}
          </select>
        </label>
      </div>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 accent-[#DD1D25]"
        />
        <span>
          The player has agreed to the move in writing (§17.4).
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Where is it recorded? e.g. signed form, 3 Nov (admins only)"
            className={`${field} mt-1.5`}
          />
        </span>
      </label>

      {shown && (
        <div
          className={`mt-4 p-3 rounded-xl text-sm ${shown.ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"}`}
        >
          {shown.ok ? (
            <p className="font-semibold">
              All conditions met. Fee: {shown.fee} LP.
            </p>
          ) : (
            <ul className="list-disc pl-5 space-y-0.5">
              {shown.fails.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={approve}
          disabled={busy || !shown?.ok}
          className={btn}
        >
          Approve transfer
        </button>
      </div>
    </section>
  );
};

const Values = ({
  market,
  busy,
  onSave,
}: {
  market: Market;
  busy: boolean;
  onSave: (values: Record<string, number | null>) => Promise<boolean>;
}) => {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const changed = useMemo(
    () =>
      Object.entries(draft).filter(([pid, v]) => {
        const current = market.players.find(
          (p) => p._id === pid,
        )?.transferValue;
        return (v === "" ? null : Number(v)) !== (current ?? null);
      }),
    [draft, market.players],
  );
  const save = async () => {
    const values = Object.fromEntries(
      changed.map(([pid, v]) => [
        pid,
        v === "" ? null : Math.max(0, Math.round(Number(v))),
      ]),
    );
    if (await onSave(values)) setDraft({});
  };

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold">Transfer Values</h2>
          <p className="text-xs text-zinc-500">
            The price of each player in LP (§17.3). Published on the public
            page; revise between windows.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !changed.length}
          className={btn}
        >
          Save{" "}
          {changed.length
            ? `${changed.length} change${changed.length > 1 ? "s" : ""}`
            : "values"}
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {market.teams.map((t) => (
          <div
            key={t._id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"
          >
            <h3 className="font-black text-sm mb-2">{t.name}</h3>
            <ul className="space-y-1.5">
              {market.players
                .filter((p) => p.team === t._id)
                .map((p) => (
                  <li key={p._id} className="flex items-center gap-2 text-sm">
                    <PlayerAvatar name={p.name} photo={p.photo} size={24} />
                    <span className="flex-1 min-w-0 truncate">{p.name}</span>
                    <input
                      type="number"
                      min={0}
                      aria-label={`${p.name} Transfer Value`}
                      placeholder="—"
                      value={draft[p._id] ?? (p.transferValue ?? "").toString()}
                      onChange={(e) =>
                        setDraft({ ...draft, [p._id]: e.target.value })
                      }
                      className={`${field} w-20! text-right`}
                    />
                    <span className="text-[10px] text-zinc-400 w-5">LP</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

const Windows = ({
  market,
  busy,
  onCreate,
  onDelete,
}: {
  market: Market;
  busy: boolean;
  onCreate: (data: {
    name: string;
    opensAt: string;
    closesAt: string;
  }) => Promise<boolean>;
  onDelete: (windowId: string) => Promise<boolean>;
}) => {
  const [name, setName] = useState(`Window ${market.windows.length + 1}`);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const used = new Set(market.transfers.map((t) => t.window));

  const create = async () => {
    if (
      await onCreate({
        name,
        opensAt: toIso(opensAt),
        closesAt: toIso(closesAt),
      })
    ) {
      setName(`Window ${market.windows.length + 2}`);
      setOpensAt("");
      setClosesAt("");
    }
  };

  return (
    <section className={card}>
      <h2 className="text-lg font-bold mb-1">Transfer windows</h2>
      <p className="text-xs text-zinc-500 mb-4">
        Announce each window at least 3 days before it opens, between rounds of
        fixtures. Transfers outside a window are void, and the market closes for
        good once the knockout stage begins (§17.5).
      </p>
      {market.windows.length > 0 && (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 mb-4">
          {market.windows.map((w) => {
            const state = windowState(w);
            return (
              <li key={w._id} className="flex items-center gap-3 py-2 text-sm">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${state === "open" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : state === "upcoming" ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}
                >
                  {state}
                </span>
                <span className="font-semibold">{w.name}</span>
                <span className="flex-1 text-xs text-zinc-500">
                  {formatWhen(w.opensAt)} → {formatWhen(w.closesAt)}
                </span>
                {!used.has(w._id) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      window.confirm(`Delete ${w.name}?`) && onDelete(w._id)
                    }
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
        <label className={label}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className={label}>
          Opens
          <input
            type="datetime-local"
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className={label}>
          Closes
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <button
          type="button"
          onClick={create}
          disabled={busy || !name.trim() || !opensAt || !closesAt}
          className={btn}
        >
          Announce
        </button>
      </div>
    </section>
  );
};

const History = ({
  market,
  busy,
  onCancel,
}: {
  market: Market;
  busy: boolean;
  onCancel: (transferId: string, reason: string) => Promise<boolean>;
}) => {
  const names = nameMaps(market);
  return (
    <section className={card}>
      <h2 className="text-lg font-bold mb-4">Transfers</h2>
      {market.transfers.length === 0 ? (
        <p className="text-sm text-zinc-500">No transfers yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {market.transfers.map((t) => {
            const p = names.player.get(t.player);
            const cancelled = t.status === "cancelled";
            return (
              <li
                key={t._id}
                className="flex flex-wrap items-center gap-3 py-3 text-sm"
              >
                <PlayerAvatar
                  name={p?.name ?? "?"}
                  photo={p?.photo}
                  size={32}
                />
                <span
                  className={`flex-1 min-w-[12rem] ${cancelled ? "line-through text-zinc-400" : ""}`}
                >
                  <span className="font-bold">
                    {p?.name ?? "Former player"}
                  </span>{" "}
                  {names.team.get(t.fromTeam)} → {names.team.get(t.toTeam)}
                  <span className="block text-[11px] text-zinc-500 no-underline">
                    {t.fee} LP · {formatWhen(t.createdAt)}
                    {t.consentNote && ` · consent: ${t.consentNote}`}
                  </span>
                </span>
                {cancelled ? (
                  <span className="text-xs text-red-500">
                    Cancelled: {t.cancelReason}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const reason = window.prompt(
                        "Cancel this transfer (§17.6)? The player returns and the LP are refunded.\n\nReason (published):",
                      );
                      if (reason && reason.trim().length >= 3)
                        onCancel(t._id, reason.trim());
                    }}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Cancel transfer
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const Sanctions = ({
  market,
  busy,
  onCreate,
  onRevoke,
}: {
  market: Market;
  busy: boolean;
  onCreate: (data: {
    kind: SanctionKind;
    team?: string;
    player?: string;
    amount?: number;
    matches?: number;
    expiresAt?: string | null;
    reason: string;
  }) => Promise<boolean>;
  onRevoke: (sanctionId: string) => Promise<boolean>;
}) => {
  const [kind, setKind] = useState<SanctionKind>("buy_ban");
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const onTeam = TEAM_SANCTIONS.includes(kind);
  const timed = ["buy_ban", "sell_ban", "transfer_ineligible"].includes(kind);
  const counted = kind === "lp_deduction" || kind === "match_ban";

  const create = async () => {
    if (
      await onCreate({
        kind,
        ...(onTeam ? { team: target } : { player: target }),
        ...(kind === "lp_deduction" && { amount: Number(amount) }),
        ...(kind === "match_ban" && { matches: Number(amount) }),
        ...(timed && { expiresAt: until ? toIso(until) : null }),
        reason: reason.trim(),
      })
    ) {
      setTarget("");
      setAmount("");
      setUntil("");
      setReason("");
    }
  };

  return (
    <section className={card}>
      <h2 className="text-lg font-bold mb-1">Sanctions</h2>
      <p className="text-xs text-zinc-500 mb-4">
        After hearing the team or player's written explanation (§17.6). Every
        sanction is published with its reason and length; appeals go to SSRC
        (§17.9).
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
        <label className={label}>
          Sanction
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as SanctionKind);
              setTarget("");
            }}
            className={`${field} mt-1`}
          >
            {Object.entries(SANCTION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {onTeam ? "Team" : "Player"}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`${field} mt-1`}
          >
            <option value="">Choose…</option>
            {onTeam
              ? market.teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))
              : market.teams.map((t) => (
                  <optgroup key={t._id} label={t.name}>
                    {market.players
                      .filter((p) => p.team === t._id)
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
          </select>
        </label>
        {counted && (
          <label className={label}>
            {kind === "lp_deduction" ? "LP to deduct" : "Matches"}
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
        )}
        {timed && (
          <label className={label}>
            Until{" "}
            <span className="font-normal text-zinc-400">
              (empty = rest of season)
            </span>
            <input
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
        )}
        <label className={`${label} sm:col-span-2 lg:col-span-3`}>
          Reason (published)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <button
          type="button"
          onClick={create}
          disabled={
            busy ||
            !target ||
            reason.trim().length < 3 ||
            (counted && !(Number(amount) > 0))
          }
          className={btn}
        >
          Impose
        </button>
      </div>

      {market.sanctions.length > 0 && (
        <ul className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
          {market.sanctions.map((s) => {
            const { subject, length } = describeSanction(s, market);
            return (
              <li
                key={s._id}
                className="flex flex-wrap items-center gap-3 py-2.5 text-sm"
              >
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${s.active ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}
                >
                  {s.revokedAt ? "Revoked" : s.active ? "Active" : "Expired"}
                </span>
                <span className="flex-1 min-w-[12rem]">
                  <span className="font-bold">{SANCTION_LABEL[s.kind]}</span> —{" "}
                  {subject} · {length}
                  <span className="block text-[11px] text-zinc-500">
                    {s.reason} · {formatWhen(s.createdAt)}
                  </span>
                </span>
                {!s.revokedAt && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      window.confirm(
                        "Revoke this sanction (e.g. after an appeal)?",
                      ) && onRevoke(s._id)
                    }
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
                  >
                    Revoke
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default TransferMarket;
