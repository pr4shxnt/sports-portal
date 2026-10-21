import { useMemo } from "react";
import TableStage from "../tournament/TableStage";
import KnockoutBracket from "../tournament/KnockoutBracket";
import {
  phaseNumber,
  stageLabel,
  type Draw,
  type Fixture,
} from "../../../lib/tournament";

interface CompetitionPhasesProps {
  draws: Draw[];
  canManage: boolean;
  onOpenMatch?: (drawId: string, fixture: Fixture, allowDraw: boolean) => void;
  onAdvance?: (draw: Draw) => void;
}

const noop = () => {};

/** League → qualifiers → knockout, newest phase last. Shared by admin + public. */
const CompetitionPhases = ({
  draws,
  canManage,
  onOpenMatch,
  onAdvance,
}: CompetitionPhasesProps) => {
  const childOf = useMemo(() => {
    const map = new Map<string, Draw>();
    draws.forEach((d) => d.parentDraw && map.set(d.parentDraw, d));
    return map;
  }, [draws]);

  // Stable per-draw callbacks so memoised stage components don't re-render.
  const handlers = useMemo(
    () =>
      Object.fromEntries(
        draws.map((d) => [
          d._id,
          onOpenMatch
            ? (fixture: Fixture, allowDraw: boolean) =>
                onOpenMatch(d._id, fixture, allowDraw)
            : noop,
        ]),
      ),
    [draws, onOpenMatch],
  );

  return (
    <div className="space-y-12">
      {draws.map((draw) => {
        const next = childOf.get(draw._id);
        const canAdvance =
          canManage && !!onAdvance && draw.format !== "Knockout" && !next;
        return (
          <section
            key={draw._id}
            id={`draw-${draw._id}`}
            className="space-y-4 scroll-mt-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#DD1D25] uppercase tracking-wider">
                  Phase {phaseNumber(draw, draws)}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {stageLabel(draw)}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {next && (
                  <a
                    href={`#draw-${next._id}`}
                    className="text-[11px] font-bold text-zinc-500 hover:text-[#DD1D25] transition-colors"
                  >
                    Advanced to {stageLabel(next)} →
                  </a>
                )}
                {canAdvance && (
                  <button
                    onClick={() => onAdvance!(draw)}
                    className="px-3 py-1.5 bg-[#DD1D25] text-white rounded-lg font-bold text-xs hover:bg-[#b0171d] shadow-sm transition-colors"
                  >
                    {draw.format === "League"
                      ? "Draw Next Phase"
                      : "Draw Knockout"}
                  </button>
                )}
              </div>
            </div>

            {draw.format === "Knockout" ? (
              <KnockoutBracket
                draw={draw}
                canManage={canManage}
                onOpenMatch={handlers[draw._id]}
              />
            ) : (
              <TableStage
                draw={draw}
                canManage={canManage}
                onOpenMatch={handlers[draw._id]}
              />
            )}
          </section>
        );
      })}
    </div>
  );
};

export default CompetitionPhases;
