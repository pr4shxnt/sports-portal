import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "../../ui/Modal";
import {
  errorMessage,
  useAdvanceDrawMutation,
  type AdvanceDrawBody,
} from "../../../store/api";
import {
  balancedSizes,
  computeStandings,
  countUnplayed,
  nextPowerOfTwo,
  qualifierCount,
  rankAcrossGroups,
  roundName,
  seedOrder,
  serpentineGroups,
  stageLabel,
  tablesOf,
  type Draw,
  type TeamRef,
} from "../../../lib/tournament";

interface AdvancePhaseModalProps {
  draw: Draw;
  isOpen: boolean;
  onClose: () => void;
  onAdvanced: (next: Draw) => void;
}

type Mode = "groups" | "playIn" | "knockout";
type Seeding = "ranked" | "draw";

const ordinal = (n: number) => {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[
    n % 10
  ];
  return `${n}${!teen && suffix ? suffix : "th"}`;
};

const Stepper = ({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) => (
  <div>
    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
      {label}
    </label>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-black disabled:opacity-40"
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(
            Math.max(
              min,
              Math.min(max, Math.floor(Number(e.target.value) || min)),
            ),
          )
        }
        className="w-16 h-9 text-center font-black rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 tabular-nums"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-black disabled:opacity-40"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
    {hint && <p className="text-[10px] text-zinc-400 mt-1">{hint}</p>}
  </div>
);

const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; sub: string }[];
  onChange: (v: T) => void;
}) => (
  <div
    className={`grid grid-cols-2 gap-2 ${options.length > 2 ? "sm:grid-cols-3" : ""}`}
  >
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        aria-pressed={value === o.value}
        className={`p-3 rounded-xl border-2 text-left transition-all ${value === o.value ? "border-[#DD1D25] bg-[#DD1D25]/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
      >
        <span className="block text-sm font-black text-zinc-900 dark:text-zinc-50">
          {o.label}
        </span>
        <span className="block text-[11px] text-zinc-500 mt-0.5 leading-snug">
          {o.sub}
        </span>
      </button>
    ))}
  </div>
);

/** First-round ties of a seeded bracket, as "seed. name" pairs. */
const SeededTies = ({ seeds }: { seeds: (TeamRef | null)[] }) => {
  const order = seedOrder(nextPowerOfTwo(seeds.length));
  const ties: [number, number][] = [];
  for (let i = 0; i < order.length; i += 2) ties.push([order[i], order[i + 1]]);
  const name = (seed: number) => seeds[seed - 1]?.name;
  return (
    <ol className="grid sm:grid-cols-2 gap-1.5">
      {ties.map(([a, b]) => (
        <li
          key={a}
          className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        >
          <span className="truncate flex-1">
            <b className="text-zinc-400 tabular-nums">{a}.</b> {name(a)}
          </span>
          <span className="text-zinc-400 font-bold">v</span>
          <span className="truncate flex-1 text-right">
            {name(b) ? (
              <>
                {name(b)} <b className="text-zinc-400 tabular-nums">{b}.</b>
              </>
            ) : (
              <i className="text-emerald-600 dark:text-emerald-400 font-semibold not-italic">
                bye
              </i>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
};

const AdvancePhaseModal = ({
  draw,
  isOpen,
  onClose,
  onAdvanced,
}: AdvancePhaseModalProps) => {
  const isLeague = draw.format === "League";
  const direct = draw.directQualifiers ?? [];
  const tables = useMemo(() => tablesOf(draw), [draw]);
  const standings = useMemo(
    () => tables.map((t) => computeStandings(draw, t)),
    [draw, tables],
  );
  const unplayed = useMemo(() => countUnplayed(draw), [draw]);
  const ranked = standings[0]?.map((r) => r.team) ?? [];
  const total = ranked.length;
  const smallestGroup = Math.min(...standings.map((s) => s.length));

  // League → next phase
  const [mode, setMode] = useState<Mode>("groups");
  const [qualifiers, setQualifiers] = useState(Math.min(8, total));
  const [groupSize, setGroupSize] = useState(4);
  const [seeding, setSeeding] = useState<Seeding>("ranked");
  // League → play-in
  const [directCount, setDirectCount] = useState(
    Math.max(1, Math.min(6, total - 4)),
  );
  const [playInSize, setPlayInSize] = useState(4);
  const [playInPerGroup, setPlayInPerGroup] = useState(1);
  // Groups → knockout
  const [perGroup, setPerGroup] = useState(
    Math.min(qualifierCount(draw) || 2, smallestGroup || 1),
  );
  const [bestPlaced, setBestPlaced] = useState(0);
  const [advanceDraw, { isLoading: submitting }] = useAdvanceDrawMutation();

  /* ── League previews ── */
  const maxGroupSize = Math.max(2, Math.floor(qualifiers / 2));
  const size = Math.min(groupSize, maxGroupSize);
  const groupCount = Math.ceil(qualifiers / size);
  const sizes = balancedSizes(qualifiers, groupCount);
  const groupsValid = groupCount >= 2 && Math.min(...sizes) >= 2;
  const pots = Array.from(
    { length: Math.ceil(qualifiers / groupCount) },
    (_, p) =>
      ranked.slice(p * groupCount, Math.min((p + 1) * groupCount, qualifiers)),
  );

  /* ── Play-in previews ── */
  const playInTeams = ranked.slice(directCount);
  const maxPlayInSize = Math.max(2, Math.floor(playInTeams.length / 2));
  const piSize = Math.min(playInSize, maxPlayInSize);
  const piGroupCount = Math.ceil(playInTeams.length / piSize);
  const piSmallest = Math.min(
    ...balancedSizes(playInTeams.length, piGroupCount),
  );
  const piPerGroup = Math.min(playInPerGroup, Math.max(1, piSmallest - 1));
  const playInValid =
    playInTeams.length >= 4 && piGroupCount >= 2 && piSmallest >= 2;
  const playInGroups = playInValid
    ? serpentineGroups(playInTeams, piGroupCount)
    : [];
  const playInSeeds: TeamRef[] = [
    ...ranked.slice(0, directCount),
    ...Array.from({ length: piPerGroup }, (_, pos) =>
      playInGroups.map((_, gi) => ({
        _id: `slot-${pos}-${gi}`,
        name: `${pos === 0 ? "Winner" : ordinal(pos + 1)} ${String.fromCharCode(65 + gi)}`,
      })),
    ).flat(),
  ];

  const presets = useMemo(() => {
    const list: { label: string; apply: () => void }[] = [];
    // e.g. 14 teams: top 6 direct, 7–14 in 2 groups of 4, winners → QF.
    if (total >= 10) {
      const d = total - 8;
      list.push({
        label: `Top ${d} + play-in (2 × 4) → ${roundName(nextPowerOfTwo(d + 2))}`,
        apply: () => {
          setMode("playIn");
          setDirectCount(d);
          setPlayInSize(4);
          setPlayInPerGroup(1);
        },
      });
    }
    for (const perTable of [4, 3]) {
      const n = Math.floor(total / perTable) * perTable;
      if (n / perTable >= 2)
        list.push({
          label: `Top ${n} → ${n / perTable} groups of ${perTable}`,
          apply: () => {
            setMode("groups");
            setQualifiers(n);
            setGroupSize(perTable);
          },
        });
    }
    for (const n of [16, 8, 4, 2]) {
      if (n <= total)
        list.push({
          label: `Top ${n} → ${roundName(n)}`,
          apply: () => {
            setMode("knockout");
            setQualifiers(n);
            setSeeding("ranked");
          },
        });
    }
    return list.slice(0, 4);
  }, [total]);

  /* ── Groups → knockout previews ── */
  const groupTiers = useMemo(() => {
    if (isLeague) return [];
    const tiers = Array.from({ length: perGroup }, (_, pos) =>
      rankAcrossGroups(
        standings
          .map((s, gi) => ({ group: tables[gi].name, row: s[pos] }))
          .filter((e) => e.row),
      ),
    );
    const pool = rankAcrossGroups(
      standings
        .map((s, gi) => ({ group: tables[gi].name, row: s[perGroup] }))
        .filter((e) => e.row),
    );
    return [
      ...tiers.map((t, pos) => ({
        label:
          pos === 0
            ? "Group winners"
            : pos === 1
              ? "Runners-up"
              : `${ordinal(pos + 1)} place`,
        entries: t,
      })),
      ...(bestPlaced > 0
        ? [
            {
              label: `Best ${ordinal(perGroup + 1)}-placed`,
              entries: pool.slice(0, bestPlaced),
            },
          ]
        : []),
    ];
  }, [isLeague, perGroup, bestPlaced, standings, tables]);
  const maxBestPlaced = isLeague
    ? 0
    : standings.filter((s) => s.length > perGroup).length;

  // Play-in source: direct qualifiers keep their seeds, then finishers by
  // position and group order (same as the server).
  const playInKnockoutSeeds: TeamRef[] = direct.length
    ? [
        ...direct,
        ...Array.from({ length: perGroup }, (_, pos) =>
          standings.map((s) => s[pos]?.team).filter((t): t is TeamRef => !!t),
        ).flat(),
        ...(groupTiers[perGroup]?.entries.map((e) => e.row.team) ?? []),
      ]
    : [];

  const knockoutTeams = isLeague
    ? mode === "knockout"
      ? qualifiers
      : mode === "playIn"
        ? playInSeeds.length
        : 0
    : direct.length
      ? playInKnockoutSeeds.length
      : groupTiers.reduce((sum, t) => sum + t.entries.length, 0);
  const byes = knockoutTeams
    ? nextPowerOfTwo(knockoutTeams) - knockoutTeams
    : 0;

  const canSubmit =
    unplayed === 0 &&
    !submitting &&
    (isLeague
      ? mode === "groups"
        ? groupsValid
        : mode === "playIn"
          ? playInValid
          : qualifiers >= 2
      : knockoutTeams >= 2);

  const submit = async () => {
    const body: AdvanceDrawBody = isLeague
      ? mode === "groups"
        ? { mode, qualifiers, groupSize: size }
        : mode === "playIn"
          ? {
              mode,
              direct: directCount,
              groupSize: piSize,
              perGroup: piPerGroup,
            }
          : { mode, qualifiers, seeding }
      : { mode: "knockout", perGroup, bestPlaced };

    const summary = isLeague
      ? mode === "groups"
        ? `Draw the top ${qualifiers} into ${groupCount} groups from ${pots.length} pots?`
        : mode === "playIn"
          ? `Send the top ${directCount} straight to the ${roundName(nextPowerOfTwo(knockoutTeams))} and the other ${playInTeams.length} into ${piGroupCount} qualifier groups?`
          : `Send the top ${qualifiers} into a ${seeding === "ranked" ? "seeded" : "drawn"} knockout (${roundName(nextPowerOfTwo(qualifiers))})?`
      : `Send ${knockoutTeams} teams into the knockout (${roundName(nextPowerOfTwo(knockoutTeams))})?`;
    if (
      !window.confirm(`${summary}\n\nThis locks the ${stageLabel(draw)} table.`)
    )
      return;

    try {
      const next = await advanceDraw({ id: draw._id, body }).unwrap();
      toast.success(`${next.stage || "Next phase"} drawn!`);
      onAdvanced(next);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to draw the next phase"));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isLeague ? "Champions League · Next Phase" : "Draw the Knockout Phase"
      }
      size="lg"
    >
      <div className="space-y-6">
        {unplayed > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
            <b>{unplayed} fixture(s)</b> still need a final result. You can plan
            the next phase now, but it can only be drawn once the{" "}
            {stageLabel(draw).toLowerCase()} is complete.
          </div>
        )}

        {isLeague ? (
          <>
            {presets.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                  Quick formats
                </p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={p.apply}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-[#DD1D25] hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Segmented<Mode>
              value={mode}
              onChange={setMode}
              options={[
                {
                  value: "groups",
                  label: "Group stage",
                  sub: "Qualifiers drawn into groups from pots, then a knockout",
                },
                {
                  value: "playIn",
                  label: "Play-in",
                  sub: "Top teams wait; the rest play qualifier groups for the last spots",
                },
                {
                  value: "knockout",
                  label: "Direct knockout",
                  sub: "Top teams go straight into a seeded bracket",
                },
              ]}
            />

            {mode === "playIn" ? (
              <>
                <div className="flex flex-wrap gap-6">
                  <Stepper
                    label="Direct to knockout"
                    value={directCount}
                    min={1}
                    max={Math.max(1, total - 4)}
                    onChange={setDirectCount}
                    hint={`${playInTeams.length} teams go to the qualifiers`}
                  />
                  <Stepper
                    label="Teams per qualifier group"
                    value={piSize}
                    min={2}
                    max={maxPlayInSize}
                    onChange={setPlayInSize}
                    hint={
                      playInValid
                        ? `${piGroupCount} groups · ${[...new Set(balancedSizes(playInTeams.length, piGroupCount))].sort((a, b) => b - a).join(" or ")} teams each`
                        : "Needs at least 2 groups of 2"
                    }
                  />
                  <Stepper
                    label="Qualify per group"
                    value={piPerGroup}
                    min={1}
                    max={Math.max(1, piSmallest - 1)}
                    onChange={setPlayInPerGroup}
                  />
                </div>
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Preview · {knockoutTeams} teams ·{" "}
                    {roundName(nextPowerOfTwo(knockoutTeams))}
                    {byes > 0 &&
                      ` · ${byes} bye${byes > 1 ? "s" : ""} for the top seeds`}
                  </p>
                  {playInValid ? (
                    <>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        Qualifier groups are seeded serpentine by league
                        position (no random draw) and points reset. League
                        position is the final tie-breaker.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {playInGroups.map((group, gi) => (
                          <div
                            key={gi}
                            className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5"
                          >
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                              Group {String.fromCharCode(65 + gi)}
                            </p>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {group
                                .map(
                                  (t) =>
                                    `${ordinal(ranked.indexOf(t) + 1)} ${t.name}`,
                                )
                                .join(" · ")}
                            </p>
                          </div>
                        ))}
                      </div>
                      <SeededTies seeds={playInSeeds} />
                    </>
                  ) : (
                    <p className="text-xs text-red-500">
                      Leave at least 4 teams for the qualifiers, in at least two
                      groups of two.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-6">
                  <Stepper
                    label="Teams qualifying"
                    value={qualifiers}
                    min={2}
                    max={total}
                    onChange={setQualifiers}
                    hint={`of ${total} in the league`}
                  />
                  {mode === "groups" ? (
                    <Stepper
                      label="Teams per group"
                      value={size}
                      min={2}
                      max={maxGroupSize}
                      onChange={setGroupSize}
                      hint={
                        groupsValid
                          ? `${groupCount} tables · ${[...new Set(sizes)].sort((a, b) => b - a).join(" or ")} teams each`
                          : "Needs at least 2 groups of 2"
                      }
                    />
                  ) : (
                    <div className="flex-1 min-w-[14rem]">
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                        Seeding
                      </label>
                      <Segmented<Seeding>
                        value={seeding}
                        onChange={setSeeding}
                        options={[
                          {
                            value: "ranked",
                            label: "By rank",
                            sub: "1 v last, 2 v second-last",
                          },
                          {
                            value: "draw",
                            label: "Seeded draw",
                            sub: "Top half v bottom half, drawn",
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Preview
                  </p>
                  {mode === "groups" ? (
                    groupsValid ? (
                      <>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                          Each group gets one team from each pot, drawn at
                          random (UEFA pot system). Groups play a round robin;
                          the top 2 per group are highlighted by default.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {pots.map((pot, p) => (
                            <div
                              key={p}
                              className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5"
                            >
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#DD1D25] mb-1">
                                Pot {p + 1} · ranks {p * groupCount + 1}–
                                {p * groupCount + pot.length}
                              </p>
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {pot.map((t) => t.name).join(" · ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-red-500">
                        Choose a group size that makes at least two groups of
                        two.
                      </p>
                    )
                  ) : (
                    <>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        <b>{roundName(nextPowerOfTwo(qualifiers))}</b>
                        {byes > 0 &&
                          ` · top ${byes} seed${byes > 1 ? "s" : ""} receive a bye`}
                        {seeding === "draw" &&
                          " · seeded and unseeded teams are paired at random"}
                      </p>
                      {seeding === "ranked" ? (
                        <SeededTies seeds={ranked.slice(0, qualifiers)} />
                      ) : (
                        <p className="text-xs text-zinc-500">
                          Seeded:{" "}
                          {ranked
                            .slice(0, Math.ceil(qualifiers / 2))
                            .map((t) => t.name)
                            .join(", ")}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-6">
              <Stepper
                label="Qualify per group"
                value={perGroup}
                min={1}
                max={smallestGroup}
                onChange={(v) => {
                  setPerGroup(v);
                  setBestPlaced(0);
                }}
              />
              {!direct.length && (
                <Stepper
                  label={`Best ${ordinal(perGroup + 1)}-placed teams`}
                  value={bestPlaced}
                  min={0}
                  max={maxBestPlaced}
                  onChange={setBestPlaced}
                  hint="Like the best third-placed teams at a EURO"
                />
              )}
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Preview · {knockoutTeams} teams ·{" "}
                {knockoutTeams >= 2
                  ? roundName(nextPowerOfTwo(knockoutTeams))
                  : "—"}
                {byes > 0 &&
                  ` · ${byes} bye${byes > 1 ? "s" : ""} for the best winners`}
              </p>
              {direct.length ? (
                <>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    The {direct.length} direct qualifiers keep their league
                    seeds; qualifier finishers fill the remaining seeds by group
                    order.
                  </p>
                  <SeededTies seeds={playInKnockoutSeeds} />
                </>
              ) : (
                <>
                  {groupTiers.map((tier) => (
                    <div key={tier.label}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#DD1D25] mb-1">
                        {tier.label}
                      </p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {tier.entries
                          .map((e) => `${e.row.team.name} (${e.group})`)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                  <p className="text-[11px] text-zinc-500">
                    Group winners are seeded against lower-placed teams, and
                    teams from the same group are kept apart in the first round.
                  </p>
                </>
              )}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 py-3 bg-[#DD1D25] text-white font-bold rounded-xl hover:bg-[#C41920] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isLeague && mode !== "knockout"
              ? mode === "playIn"
                ? "Start Qualifiers"
                : "Draw Groups"
              : "Draw Knockout"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancePhaseModal;
