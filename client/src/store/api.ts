import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosError, AxiosRequestConfig } from "axios";
import api from "../services/api";
import type { Draw } from "../lib/tournament";

/**
 * RTK Query cache for events, teams and draws.
 *
 * Every screen that reads this data shares one cache entry, so navigating
 * back to a page renders instantly, concurrent requests are de-duplicated,
 * and mutations invalidate exactly the data they change.
 */

export interface ApiError {
  status?: number;
  message: string;
}

/** Reuses the shared axios instance (base URL, credentials). */
const axiosBaseQuery: BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig["method"];
    data?: unknown;
    params?: AxiosRequestConfig["params"];
  },
  unknown,
  ApiError
> = async ({ url, method = "GET", data, params }) => {
  try {
    const result = await api.request({ url, method, data, params });
    return { data: result.data };
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    return {
      error: {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      },
    };
  }
};

export interface EventSummary {
  _id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  slug?: string;
  participants?: string[];
}

export interface EventDetail extends EventSummary {
  organizer: string;
  form?: { _id: string; isActive: boolean; formId: string };
}

export interface TeamMember {
  _id?: string;
  name: string;
  email: string;
  phone: string;
}

export interface Team {
  _id: string;
  name: string;
  sport: string;
  teamType: string;
  members: TeamMember[];
  executive?: { _id: string; name: string; email: string };
  event?: string | { _id: string };
  coach?: string;
  createdAt: string;
}

export type MyTeam = Omit<Team, "event"> & {
  event?: { _id: string; title: string; date: string; endDate?: string } | null;
};

/** A draw from GET /draws, where `event` is populated. */
export type DrawWithEvent = Omit<Draw, "event"> & {
  event?: string | { _id: string; title: string; date: string };
};

/** Lightweight draw row from GET /draws?view=summary (no teams). */
export interface DrawSummary {
  _id: string;
  sport: string;
  format: Draw["format"];
  stage?: string;
  parentDraw?: string;
  createdAt: string;
  event?: string | { _id: string; title: string; date: string } | null;
}

export type RequestWindowMode = "scheduled" | "open" | "closed";

export interface RequestWindow {
  mode: RequestWindowMode;
  openHour: number;
  closeHour: number;
  note: string;
  timezone: string;
  isOpen: boolean;
  /** Why requests are refused right now, or null when open. */
  message: string | null;
  updatedAt: string | null;
  updatedBy: { _id: string; name: string; role: string } | null;
}

export type EventUpdate = Pick<
  EventDetail,
  "title" | "description" | "date" | "endDate" | "location"
>;

export interface CreateDrawBody {
  event: string;
  format: Draw["format"];
  sport: string;
  teamSize?: number;
  scoring?: Draw["scoring"];
  drawnTeams: string[];
  groupings?: { name: string; teams: string[] }[];
}

export type AdvanceDrawBody =
  | { mode: "groups"; qualifiers: number; groupSize: number }
  | { mode: "playIn"; direct: number; groupSize: number; perGroup?: number }
  | {
      mode: "knockout";
      qualifiers?: number;
      seeding?: "ranked" | "draw";
      perGroup?: number;
      bestPlaced?: number;
    };

/* ── Champions League ── */

export type CompetitionStatus = "setup" | "live";

export interface Competition {
  _id: string;
  name: string;
  season?: string;
  sport: string;
  description?: string;
  formSlug: string;
  status: CompetitionStatus;
  createdAt: string;
  teamCount?: number;
}

export interface LeaguePlayer {
  _id: string;
  team: string;
  name: string;
  email?: string;
  phone?: string;
  studentId?: string;
  programme?: string;
  intake?: string;
  shirtNumber?: number;
  position: "GK" | "FP";
  captaincy?: "captain" | "vice" | null;
  photo?: { url: string; publicId: string };
}

/** Squad size the regulations require (§8.1). */
export const SQUAD_MIN = 7;
export const SQUAD_MAX = 10;

export interface LeagueTeam {
  _id: string;
  name: string;
  players: LeaguePlayer[];
  /** Set when the team came from an approved application. */
  formSubmission?: string;
  createdAt: string;
}

export interface CompetitionDetail {
  competition: Competition;
  teams: LeagueTeam[];
  draws: Draw[];
  form: { formId: string; formTitle: string; isActive: boolean } | null;
  /** Present after a create/sync/slug change. */
  sync?: { added: number; removed: number };
}

export interface FormPreview {
  formId: string;
  formTitle: string;
  isActive: boolean;
  approved: number;
  pending: number;
  rejected: number;
  linkedTo: { _id: string; name: string } | null;
}

export type CompetitionInput = Pick<
  Competition,
  "name" | "sport" | "formSlug"
> &
  Partial<Pick<Competition, "season" | "description">>;

export type LeaguePlayerInput = Omit<
  LeaguePlayer,
  "_id" | "team" | "shirtNumber" | "photo"
> & {
  _id?: string;
  shirtNumber?: number | null;
  photo?: { url: string; publicId: string } | null;
};

export interface LeagueTeamInput {
  name: string;
  players: LeaguePlayerInput[];
}

export type PublicPlayer = Pick<
  LeaguePlayer,
  "_id" | "name" | "shirtNumber" | "position" | "captaincy" | "photo"
>;

export interface PublicCompetition {
  competition: Competition;
  teams: { _id: string; name: string; players: PublicPlayer[] }[];
  draws: Draw[];
  registrationOpen: boolean;
}

/* ── Match centre ── */

export type MatchStatus = "scheduled" | "live" | "finished";
export type MatchEventType =
  "goal" | "penalty_goal" | "own_goal" | "penalty_missed" | "yellow" | "red";

export interface MatchEvent {
  _id: string;
  type: MatchEventType;
  team: string;
  player?: string;
  minute: number;
  saved?: boolean;
  secondYellow?: boolean;
  causedBy?: string;
}

export interface ShootoutKick {
  _id?: string;
  team: string;
  player?: string;
  scored: boolean;
  saved?: boolean;
}

export interface MatchRecord {
  _id: string;
  competition: string;
  draw: string;
  matchId: string;
  home: string;
  away: string;
  knockout: boolean;
  kickoff?: string;
  venue?: string;
  status: MatchStatus;
  events: MatchEvent[];
  shootout: ShootoutKick[];
  forfeitedBy?: string | null;
  goalkeepers?: { home?: string | null; away?: string | null };
}

export interface MatchDetail {
  match: MatchRecord;
  stage?: string;
  home: { _id: string; name: string };
  away: { _id: string; name: string };
  players: (PublicPlayer & { team: string })[];
  suspended: string[];
  score: string;
  needsShootout: boolean;
  /** Winner id, "DRAW", or null while undecided. */
  result: string | null;
}

/** Row in a fixtures list (no timeline). */
export interface MatchSummary {
  _id: string;
  draw: string | { _id: string; stage?: string };
  matchId: string;
  home: { _id: string; name: string };
  away: { _id: string; name: string };
  knockout: boolean;
  kickoff?: string;
  venue?: string;
  status: MatchStatus;
  score?: string;
  forfeitedBy?: string | null;
}

export interface OpenMatchBody {
  drawId: string;
  matchId: string;
  home: string;
  away: string;
}

export type MatchUpdate = Partial<{
  kickoff: string | null;
  venue: string;
  status: MatchStatus;
  forfeitedBy: string | null;
  goalkeepers: { home?: string | null; away?: string | null };
}>;

/* ── News ── */

export type NewsCategory = "match_report" | "announcement" | "feature";

export interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  category: NewsCategory;
  summary?: string;
  /** Only on single-post responses. */
  body?: string;
  cover?: { url: string; publicId: string };
  match?: string | null;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewsInput = Partial<
  Pick<NewsPost, "title" | "category" | "summary" | "body" | "status">
> & {
  cover?: { url: string; publicId: string } | null;
  match?: string | null;
};

/* ── Transfer market ── */

export type SanctionKind =
  "buy_ban" | "sell_ban" | "lp_deduction" | "transfer_ineligible" | "match_ban";

export interface MarketPlayer {
  _id: string;
  team: string;
  name: string;
  shirtNumber?: number;
  position: "GK" | "FP";
  photo?: { url: string; publicId: string };
  transferValue?: number | null;
  movedInWindow?: string | null;
}

export interface TransferWindow {
  _id: string;
  name: string;
  opensAt: string;
  closesAt: string;
}

export interface TransferRecord {
  _id: string;
  window: string;
  player: string;
  fromTeam: string;
  toTeam: string;
  fee: number;
  consentNote?: string;
  status: "completed" | "cancelled";
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface SanctionRecord {
  _id: string;
  kind: SanctionKind;
  team?: string | null;
  player?: string | null;
  amount?: number;
  matches?: number;
  expiresAt?: string | null;
  reason: string;
  revokedAt?: string | null;
  active: boolean;
  createdAt: string;
}

export interface Market {
  teams: { _id: string; name: string }[];
  players: MarketPlayer[];
  windows: TransferWindow[];
  openWindow: string | null;
  knockoutStarted: boolean;
  balances: {
    team: string;
    squad: number;
    earned: number;
    spent: number;
    received: number;
    deducted: number;
    balance: number;
  }[];
  transfers: TransferRecord[];
  sanctions: SanctionRecord[];
}

export interface TransferCheck {
  ok: boolean;
  fails: string[];
  fee: number | null;
}

export type MarketAction =
  | {
      kind: "window";
      data: { name: string; opensAt: string; closesAt: string };
    }
  | { kind: "deleteWindow"; windowId: string }
  | { kind: "values"; data: { values: Record<string, number | null> } }
  | {
      kind: "transfer";
      data: {
        player: string;
        toTeam: string;
        consent: boolean;
        consentNote?: string;
      };
    }
  | { kind: "cancel"; transferId: string; reason: string }
  | {
      kind: "sanction";
      data: {
        kind: SanctionKind;
        team?: string;
        player?: string;
        amount?: number;
        matches?: number;
        expiresAt?: string | null;
        reason: string;
      };
    }
  | { kind: "revoke"; sanctionId: string };

/* ── Stats ── */

export interface LeagueStats {
  teams: { _id: string; name: string }[];
  players: (PublicPlayer & { team: string })[];
  goldenBoot: {
    player: string;
    team: string;
    goals: number;
    penalties: number;
  }[];
  goldenGlove: {
    player: string;
    team: string;
    matches: number;
    conceded: number;
    cleanSheets: number;
    perMatch: number;
  }[];
  fairPlay: { team: string; yellows: number; reds: number; points: number }[];
  cards: { player: string; team: string; yellows: number; reds: number }[];
  suspensions: {
    player: string;
    team: string;
    fromMatch: string;
    matches: number;
    remaining: number;
  }[];
  leaguePoints: {
    team: string;
    matches: number;
    eligible: number;
    results: number;
    goals: number;
    cleanSheets: number;
    penaltiesScored: number;
    penaltiesSaved: number;
    noCards: number;
    total: number;
  }[];
  lpValues: Record<
    | "eligible"
    | "win"
    | "draw"
    | "goal"
    | "cleanSheet"
    | "penaltyScored"
    | "penaltySaved"
    | "noCards",
    number
  >;
  matchesPlayed: number;
}

export type NewMatchEvent = Omit<
  MatchEvent,
  "_id" | "secondYellow" | "causedBy"
>;

const drawTags = (draw: { _id: string }) => [
  { type: "Draw" as const, id: draw._id },
];

export const sportsApi = createApi({
  reducerPath: "sportsApi",
  baseQuery: axiosBaseQuery,
  tagTypes: [
    "Event",
    "Team",
    "Draw",
    "RequestWindow",
    "Competition",
    "Match",
    "Stats",
    "News",
    "Market",
  ],
  // Refetch stale data when the tab regains focus or the network returns.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    /* ── Events ── */
    getEvents: build.query<EventSummary[], void>({
      query: () => ({ url: "/events" }),
      providesTags: (events = []) => [
        { type: "Event", id: "LIST" },
        ...events.map((e) => ({ type: "Event" as const, id: e._id })),
      ],
    }),
    getMyEvents: build.query<EventSummary[], void>({
      query: () => ({ url: "/events/my" }),
      providesTags: [{ type: "Event", id: "MINE" }],
    }),
    getEvent: build.query<EventDetail, string>({
      query: (id) => ({ url: `/events/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Event", id }],
    }),
    updateEvent: build.mutation<
      EventDetail,
      { id: string; data: Partial<EventUpdate> }
    >({
      query: ({ id, data }) => ({ url: `/events/${id}`, method: "PUT", data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Event", id },
        { type: "Event", id: "LIST" },
        { type: "Event", id: "MINE" },
      ],
    }),

    /* ── Teams ── */
    getTeams: build.query<Team[], void>({
      query: () => ({ url: "/teams" }),
      providesTags: [{ type: "Team", id: "LIST" }],
    }),
    /** Teams the user belongs to, with their event populated. */
    getMyTeams: build.query<MyTeam[], void>({
      query: () => ({ url: "/teams/my" }),
      providesTags: [{ type: "Team", id: "MINE" }],
    }),

    /* ── Equipment request window ── */
    getRequestWindow: build.query<RequestWindow, void>({
      query: () => ({ url: "/equipment/request-window" }),
      providesTags: ["RequestWindow"],
    }),
    updateRequestWindow: build.mutation<
      RequestWindow,
      Partial<Pick<RequestWindow, "mode" | "openHour" | "closeHour" | "note">>
    >({
      query: (data) => ({
        url: "/equipment/request-window",
        method: "PUT",
        data,
      }),
      // The response is the new state: write it straight into the cache.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            sportsApi.util.updateQueryData(
              "getRequestWindow",
              undefined,
              () => data,
            ),
          );
        } catch {
          /* handled by the caller */
        }
      },
    }),

    /* ── Champions League ── */
    getCompetitions: build.query<Competition[], void>({
      query: () => ({ url: "/competitions" }),
      providesTags: [{ type: "Competition", id: "LIST" }],
    }),
    getCompetition: build.query<CompetitionDetail, string>({
      query: (id) => ({ url: `/competitions/${id}` }),
      // Draw tags: score entry and phase advancement refresh this page too.
      providesTags: (detail, _e, id) => [
        { type: "Competition", id },
        ...(detail?.draws ?? []).flatMap(drawTags),
      ],
    }),
    previewCompetitionForm: build.query<FormPreview, string>({
      query: (slug) => ({
        url: `/competitions/forms/${encodeURIComponent(slug)}`,
      }),
    }),
    createCompetition: build.mutation<CompetitionDetail, CompetitionInput>({
      query: (data) => ({ url: "/competitions", method: "POST", data }),
      invalidatesTags: [{ type: "Competition", id: "LIST" }],
    }),
    updateCompetition: build.mutation<
      CompetitionDetail,
      { id: string; data: Partial<CompetitionInput> }
    >({
      query: ({ id, data }) => ({
        url: `/competitions/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Competition", id },
        { type: "Competition", id: "LIST" },
      ],
    }),
    deleteCompetition: build.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/competitions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Competition", id: "LIST" }],
    }),
    /** sync | start | reset — each returns the refreshed competition. */
    competitionAction: build.mutation<
      CompetitionDetail,
      { id: string; action: "sync" | "start" | "reset" }
    >({
      query: ({ id, action }) => ({
        url: `/competitions/${id}/${action}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Competition", id },
        { type: "Competition", id: "LIST" },
      ],
    }),
    saveLeagueTeam: build.mutation<
      CompetitionDetail,
      { id: string; teamId?: string; data: LeagueTeamInput }
    >({
      query: ({ id, teamId, data }) => ({
        url: teamId
          ? `/competitions/${id}/teams/${teamId}`
          : `/competitions/${id}/teams`,
        method: teamId ? "PUT" : "POST",
        data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Competition", id },
        { type: "Competition", id: "LIST" },
      ],
    }),
    removeLeagueTeam: build.mutation<
      CompetitionDetail,
      { id: string; teamId: string }
    >({
      query: ({ id, teamId }) => ({
        url: `/competitions/${id}/teams/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Competition", id },
        { type: "Competition", id: "LIST" },
      ],
    }),
    getPublicCompetitions: build.query<Competition[], void>({
      query: () => ({ url: "/competitions/public" }),
    }),
    getPublicCompetition: build.query<PublicCompetition, string>({
      query: (slug) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}`,
      }),
    }),

    /* ── Match centre ── */
    getCompetitionMatches: build.query<MatchSummary[], string>({
      query: (id) => ({ url: `/competitions/${id}/matches` }),
      providesTags: (_r, _e, id) => [{ type: "Match", id: `LIST-${id}` }],
    }),
    /** Creates the match record on first open; returns its details. */
    openMatch: build.mutation<
      MatchDetail,
      { competitionId: string; body: OpenMatchBody }
    >({
      query: ({ competitionId, body }) => ({
        url: `/competitions/${competitionId}/matches/open`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, { competitionId }) => [
        { type: "Match", id: `LIST-${competitionId}` },
      ],
    }),
    getMatchDetail: build.query<
      MatchDetail,
      { competitionId: string; matchDocId: string }
    >({
      query: ({ competitionId, matchDocId }) => ({
        url: `/competitions/${competitionId}/matches/${matchDocId}`,
      }),
      providesTags: (_r, _e, { matchDocId }) => [
        { type: "Match", id: matchDocId },
      ],
    }),
    /** update | addEvent | removeEvent | shootout — all return the detail. */
    changeMatch: build.mutation<
      MatchDetail,
      {
        competitionId: string;
        matchDocId: string;
        update?: MatchUpdate;
        addEvent?: NewMatchEvent;
        removeEventId?: string;
        shootout?: ShootoutKick[];
      }
    >({
      query: ({
        competitionId,
        matchDocId,
        update,
        addEvent,
        removeEventId,
        shootout,
      }) => {
        const base = `/competitions/${competitionId}/matches/${matchDocId}`;
        if (addEvent)
          return { url: `${base}/events`, method: "POST", data: addEvent };
        if (removeEventId)
          return { url: `${base}/events/${removeEventId}`, method: "DELETE" };
        if (shootout)
          return {
            url: `${base}/shootout`,
            method: "PUT",
            data: { kicks: shootout },
          };
        return { url: base, method: "PATCH", data: update };
      },
      // The response is the new state: write it straight into the cache.
      async onQueryStarted(
        { competitionId, matchDocId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            sportsApi.util.upsertQueryData(
              "getMatchDetail",
              { competitionId, matchDocId },
              data,
            ),
          );
        } catch {
          /* handled by the caller */
        }
      },
      // Scores feed the tables/bracket held in the competition detail.
      invalidatesTags: (_r, _e, { competitionId }) => [
        { type: "Competition", id: competitionId },
        { type: "Match", id: `LIST-${competitionId}` },
        { type: "Stats", id: competitionId },
      ],
    }),
    /* ── Transfer market ── */
    getMarket: build.query<Market, string>({
      query: (id) => ({ url: `/competitions/${id}/market` }),
      providesTags: (_r, _e, id) => [{ type: "Market", id }],
    }),
    checkTransfer: build.mutation<
      TransferCheck,
      {
        competitionId: string;
        player: string;
        toTeam: string;
        consent: boolean;
      }
    >({
      query: ({ competitionId, ...data }) => ({
        url: `/competitions/${competitionId}/market/check`,
        method: "POST",
        data,
      }),
    }),
    marketAction: build.mutation<
      Market,
      { competitionId: string; action: MarketAction }
    >({
      query: ({ competitionId, action }) => {
        const base = `/competitions/${competitionId}/market`;
        switch (action.kind) {
          case "window":
            return {
              url: `${base}/windows`,
              method: "POST",
              data: action.data,
            };
          case "deleteWindow":
            return {
              url: `${base}/windows/${action.windowId}`,
              method: "DELETE",
            };
          case "values":
            return { url: `${base}/values`, method: "PUT", data: action.data };
          case "transfer":
            return {
              url: `${base}/transfers`,
              method: "POST",
              data: action.data,
            };
          case "cancel":
            return {
              url: `${base}/transfers/${action.transferId}/cancel`,
              method: "POST",
              data: { reason: action.reason },
            };
          case "sanction":
            return {
              url: `${base}/sanctions`,
              method: "POST",
              data: action.data,
            };
          case "revoke":
            return {
              url: `${base}/sanctions/${action.sanctionId}/revoke`,
              method: "POST",
            };
        }
      },
      async onQueryStarted({ competitionId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            sportsApi.util.upsertQueryData("getMarket", competitionId, data),
          );
        } catch {
          /* handled by the caller */
        }
      },
      // Transfers move players between squads.
      invalidatesTags: (_r, _e, { competitionId }) => [
        { type: "Competition", id: competitionId },
        { type: "Stats", id: competitionId },
      ],
    }),
    getPublicMarket: build.query<Market, string>({
      query: (slug) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}/market`,
      }),
    }),

    /* ── News ── */
    getCompetitionNews: build.query<NewsPost[], string>({
      query: (id) => ({ url: `/competitions/${id}/news` }),
      providesTags: (_r, _e, id) => [{ type: "News", id: `LIST-${id}` }],
    }),
    getNewsPost: build.query<
      NewsPost,
      { competitionId: string; postId: string }
    >({
      query: ({ competitionId, postId }) => ({
        url: `/competitions/${competitionId}/news/${postId}`,
      }),
      providesTags: (_r, _e, { postId }) => [{ type: "News", id: postId }],
    }),
    saveNewsPost: build.mutation<
      NewsPost,
      { competitionId: string; postId?: string; data: NewsInput }
    >({
      query: ({ competitionId, postId, data }) => ({
        url: postId
          ? `/competitions/${competitionId}/news/${postId}`
          : `/competitions/${competitionId}/news`,
        method: postId ? "PUT" : "POST",
        data,
      }),
      invalidatesTags: (r, _e, { competitionId }) => [
        { type: "News", id: `LIST-${competitionId}` },
        ...(r ? [{ type: "News" as const, id: r._id }] : []),
      ],
    }),
    deleteNewsPost: build.mutation<
      { message: string },
      { competitionId: string; postId: string }
    >({
      query: ({ competitionId, postId }) => ({
        url: `/competitions/${competitionId}/news/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { competitionId }) => [
        { type: "News", id: `LIST-${competitionId}` },
      ],
    }),
    getPublicNews: build.query<
      { posts: NewsPost[]; hasMore: boolean },
      { slug: string; limit?: number; before?: string }
    >({
      query: ({ slug, limit, before }) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}/news`,
        params: { limit, before },
      }),
    }),
    getPublicNewsPost: build.query<
      NewsPost,
      { slug: string; postSlug: string }
    >({
      query: ({ slug, postSlug }) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}/news/${encodeURIComponent(postSlug)}`,
      }),
    }),

    getCompetitionStats: build.query<LeagueStats, string>({
      query: (id) => ({ url: `/competitions/${id}/stats` }),
      providesTags: (_r, _e, id) => [{ type: "Stats", id }],
    }),
    getPublicStats: build.query<LeagueStats, string>({
      query: (slug) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}/stats`,
      }),
    }),
    getPublicMatches: build.query<MatchSummary[], string>({
      query: (slug) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}/matches`,
      }),
    }),
    getPublicMatch: build.query<
      MatchDetail,
      { slug: string; matchDocId: string }
    >({
      query: ({ slug, matchDocId }) => ({
        url: `/competitions/public/${encodeURIComponent(slug)}/matches/${matchDocId}`,
      }),
    }),

    /* ── Draws ── */
    /** Which sport/event pairs have draws — no teams, much smaller. */
    getDrawSummaries: build.query<DrawSummary[], void>({
      query: () => ({ url: "/draws", params: { view: "summary" } }),
      providesTags: (draws = []) => [
        { type: "Draw", id: "LIST" },
        ...draws.flatMap(drawTags),
      ],
    }),
    getDraws: build.query<DrawWithEvent[], void>({
      query: () => ({ url: "/draws" }),
      providesTags: (draws = []) => [
        { type: "Draw", id: "LIST" },
        ...draws.flatMap(drawTags),
      ],
    }),
    getEventDraws: build.query<Draw[], string>({
      query: (eventId) => ({ url: `/draws/event/${eventId}` }),
      providesTags: (draws = [], _e, eventId) => [
        { type: "Draw", id: `EVENT-${eventId}` },
        ...draws.flatMap(drawTags),
      ],
    }),
    createDraw: build.mutation<Draw, CreateDrawBody>({
      query: (data) => ({ url: "/draws", method: "POST", data }),
      invalidatesTags: (_r, _e, { event }) => [
        { type: "Draw", id: "LIST" },
        { type: "Draw", id: `EVENT-${event}` },
      ],
    }),
    advanceDraw: build.mutation<Draw, { id: string; body: AdvanceDrawBody }>({
      query: ({ id, body }) => ({
        url: `/draws/${id}/advance`,
        method: "POST",
        data: body,
      }),
      // Invalidating the source draw refetches its event's phase list (which
      // gains the new phase) and updates the source's qualification zone.
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Draw", id },
        { type: "Draw", id: "LIST" },
      ],
    }),
    updateMatch: build.mutation<
      Draw,
      {
        drawId: string;
        matchId: string;
        score: string;
        /** Winner team id or "DRAW"; omit to only update the live score. */
        result?: string;
      }
    >({
      query: ({ drawId, matchId, score, result }) =>
        result === undefined
          ? {
              url: `/draws/${drawId}/score`,
              method: "PATCH",
              data: { matchScores: { [matchId]: score } },
            }
          : {
              url: `/draws/${drawId}/results`,
              method: "PATCH",
              data: {
                matchScores: { [matchId]: score },
                matchResults: { [matchId]: result },
              },
            },
      // Write the server's copy straight into every cached list holding this
      // draw: the bracket updates instantly with no refetch.
      async onQueryStarted({ drawId }, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: updated } = await queryFulfilled;
          const replace = <T extends { _id: string }>(list: T[]) => {
            const i = list.findIndex((d) => d._id === drawId);
            if (i !== -1) Object.assign(list[i], updated);
          };
          for (const {
            endpointName,
            originalArgs,
          } of sportsApi.util.selectInvalidatedBy(getState(), [
            { type: "Draw", id: drawId },
          ])) {
            if (endpointName === "getEventDraws")
              dispatch(
                sportsApi.util.updateQueryData(
                  "getEventDraws",
                  originalArgs as string,
                  (draft) => replace(draft),
                ),
              );
            if (endpointName === "getCompetition")
              dispatch(
                sportsApi.util.updateQueryData(
                  "getCompetition",
                  originalArgs as string,
                  (draft) => replace(draft.draws),
                ),
              );
            if (endpointName === "getDraws")
              dispatch(
                sportsApi.util.updateQueryData("getDraws", undefined, (draft) =>
                  replace(draft as { _id: string }[]),
                ),
              );
          }
        } catch {
          /* handled by the caller */
        }
      },
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetMyEventsQuery,
  useGetEventQuery,
  useUpdateEventMutation,
  useGetTeamsQuery,
  useGetMyTeamsQuery,
  useGetDrawsQuery,
  useGetDrawSummariesQuery,
  useGetRequestWindowQuery,
  useUpdateRequestWindowMutation,
  useGetEventDrawsQuery,
  useCreateDrawMutation,
  useAdvanceDrawMutation,
  useUpdateMatchMutation,
  useGetCompetitionsQuery,
  useGetCompetitionQuery,
  usePreviewCompetitionFormQuery,
  useCreateCompetitionMutation,
  useUpdateCompetitionMutation,
  useDeleteCompetitionMutation,
  useCompetitionActionMutation,
  useSaveLeagueTeamMutation,
  useRemoveLeagueTeamMutation,
  useGetPublicCompetitionsQuery,
  useGetPublicCompetitionQuery,
  useGetCompetitionMatchesQuery,
  useOpenMatchMutation,
  useGetMatchDetailQuery,
  useChangeMatchMutation,
  useGetPublicMatchesQuery,
  useGetPublicMatchQuery,
  useGetCompetitionStatsQuery,
  useGetPublicStatsQuery,
  useGetCompetitionNewsQuery,
  useGetNewsPostQuery,
  useSaveNewsPostMutation,
  useDeleteNewsPostMutation,
  useGetPublicNewsQuery,
  useGetPublicNewsPostQuery,
  useGetMarketQuery,
  useCheckTransferMutation,
  useMarketActionMutation,
  useGetPublicMarketQuery,
} = sportsApi;

/** Message from an RTK Query error (ours or a serialized one). */
export const errorMessage = (error: unknown, fallback: string) =>
  (error as ApiError | undefined)?.message || fallback;

/** Id of a reference that may be an id string or a populated document. */
export const refId = (ref?: string | { _id: string } | null) =>
  typeof ref === "string" ? ref : ref?._id;
