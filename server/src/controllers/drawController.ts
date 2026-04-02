import { Request, Response } from "express";
import Draw from "../models/Draw.js";
import Event from "../models/Event.js";

type SeedTeam = {
  teamId: string;
  groupName?: string;
};

const shuffleArray = <T,>(items: T[]) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const buildGroupMapFromDraw = (groupDraw: any) => {
  const groupMap = new Map<string, string>();

  (groupDraw?.groupings || []).forEach((group: any) => {
    (group.teams || []).forEach((team: any) => {
      const teamId = typeof team === "string" ? team : team?._id?.toString?.() || team?.id;
      if (teamId) {
        groupMap.set(teamId.toString(), group.name);
      }
    });
  });

  return groupMap;
};

const buildKnockoutOrder = (
  drawnTeams: string[],
  groupMap: Map<string, string>,
) => {
  const entries: SeedTeam[] = drawnTeams.map((teamId) => ({
    teamId: teamId.toString(),
    groupName: groupMap.get(teamId.toString()),
  }));

  if (entries.length <= 2 || groupMap.size === 0) {
    return shuffleArray(entries).map((entry) => entry.teamId);
  }

  const firstRoundPairings: [SeedTeam, SeedTeam][] = [];
  const used = new Set<string>();

  const backtrack = (remaining: SeedTeam[]): boolean => {
    if (remaining.length === 0) return true;

    const [first, ...rest] = shuffleArray(remaining);
    const candidates = shuffleArray(
      rest.filter((candidate) => candidate.groupName !== first.groupName),
    );

    for (const candidate of candidates) {
      const nextRemaining = rest.filter(
        (item) => item.teamId !== candidate.teamId,
      );

      if (used.has(first.teamId) || used.has(candidate.teamId)) {
        continue;
      }

      used.add(first.teamId);
      used.add(candidate.teamId);
      firstRoundPairings.push([first, candidate]);

      if (backtrack(nextRemaining)) return true;

      firstRoundPairings.pop();
      used.delete(first.teamId);
      used.delete(candidate.teamId);
    }

    return false;
  };

  const success = backtrack(entries);

  if (!success) {
    throw new Error("Unable to generate knockout order without same-group rematches.");
  }

  return firstRoundPairings.flatMap(([a, b]) => [a.teamId, b.teamId]);
};

// @desc    Create a new draw
// @route   POST /api/draws
// @access  Private (Admin)
export const createDraw = async (req: Request, res: Response) => {
  try {
    const { event, format, sport, teamSize, drawnTeams, groupings } = req.body;

    // Verify event exists
    const eventExists = await Event.findById(event);
    if (!eventExists) {
      return res.status(404).json({ message: "Event not found" });
    }

    let finalDrawnTeams = drawnTeams;

    if (format === "Knockout" && Array.isArray(drawnTeams) && drawnTeams.length > 1) {
      const latestGroupDraw = await Draw.findOne({
        event,
        format: "Group",
        sport,
      })
        .sort({ createdAt: -1 })
        .select("groupings");

      const groupMap = buildGroupMapFromDraw(latestGroupDraw);

      try {
        finalDrawnTeams = buildKnockoutOrder(drawnTeams, groupMap);
      } catch (error) {
        return res.status(400).json({
          message:
            error instanceof Error
              ? error.message
              : "Unable to generate knockout order",
        });
      }
    }

    const draw = await Draw.create({
      event,
      format,
      sport,
      teamSize,
      drawnTeams: finalDrawnTeams,
      groupings: groupings || [],
      createdBy: req.user?._id,
    });

    res.status(201).json(draw);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get all draws (globally)
// @route   GET /api/draws
// @access  Public
export const getAllDraws = async (req: Request, res: Response) => {
  try {
    const draws = await Draw.find()
      .populate({ path: "drawnTeams", select: "name sport members teamType" })
      .populate({
        path: "groupings.teams",
        select: "name sport members teamType",
      })
      .populate("event", "title slug date")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(draws);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get all draws for an event
// @route   GET /api/draws/event/:eventId
// @access  Public
export const getDrawsByEvent = async (req: Request, res: Response) => {
  try {
    const draws = await Draw.find({ event: req.params.eventId })
      .populate({ path: "drawnTeams", select: "name sport members teamType" })
      .populate({
        path: "groupings.teams",
        select: "name sport members teamType",
      })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(draws);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Delete a draw
// @route   DELETE /api/draws/:id
// @access  Private (Admin)
export const deleteDraw = async (req: Request, res: Response) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) {
      return res.status(404).json({ message: "Draw not found" });
    }

    await draw.deleteOne();
    res.json({ message: "Draw deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update draw match results
// @route   PATCH /api/draws/:id/results
// @access  Private (Admin)
export const updateDrawResults = async (req: Request, res: Response) => {
  try {
    const { matchResults } = req.body;
    const draw = await Draw.findById(req.params.id).populate("event");
    if (!draw) {
      return res.status(404).json({ message: "Draw not found" });
    }

    // Check if event has started
    const now = new Date();
    const event = draw.event as any;
    if (event && now < new Date(event.date)) {
      return res.status(400).json({
        message: "Cannot update match results before the event starts",
      });
    }

    if (matchResults) {
      Object.entries(matchResults).forEach(([matchId, winnerId]) => {
        (draw.matchResults as any).set(matchId, winnerId);
      });
    }
    await draw.save();

    // Populate drawnTeams and groupings.teams before returning
    await draw.populate({
      path: "drawnTeams",
      select: "name sport members teamType",
    });
    await draw.populate({
      path: "groupings.teams",
      select: "name sport members teamType",
    });

    res.json(draw);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update match score
// @route   PATCH /api/draws/:id/score
// @access  Private (Admin)
export const updateMatchScore = async (req: Request, res: Response) => {
  try {
    const { matchScores } = req.body; // Expecting { [matchId]: score }
    const draw = await Draw.findById(req.params.id).populate("event");
    if (!draw) {
      return res.status(404).json({ message: "Draw not found" });
    }

    // Check if event has started
    const now = new Date();
    const event = draw.event as any;
    if (event && now < new Date(event.date)) {
      return res.status(400).json({
        message: "Cannot update match scores before the event starts",
      });
    }

    // Merge new scores into existing map using .set() for Mongoose Map compatibility
    if (matchScores) {
      Object.entries(matchScores).forEach(([matchId, score]) => {
        (draw.matchScores as any).set(matchId, score);
      });
    }
    await draw.save();

    // Populate drawnTeams and groupings.teams before returning
    await draw.populate({
      path: "drawnTeams",
      select: "name sport members teamType",
    });
    await draw.populate({
      path: "groupings.teams",
      select: "name sport members teamType",
    });

    res.json(draw);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
