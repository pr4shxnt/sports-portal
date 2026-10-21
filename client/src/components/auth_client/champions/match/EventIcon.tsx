import type { MatchEvent } from "../../../../store/api";

const Card = ({ color, offset }: { color: string; offset?: boolean }) => (
  <span
    className={`inline-block w-2.5 h-3.5 rounded-[2px] ${color} ${offset ? "-ml-1.5 mt-1 ring-1 ring-white dark:ring-zinc-900" : ""}`}
  />
);

/** Small visual for an event type. */
const EventIcon = ({
  event,
}: {
  event: Pick<MatchEvent, "type" | "secondYellow" | "saved">;
}) => {
  switch (event.type) {
    case "yellow":
      return <Card color="bg-yellow-400" />;
    case "red":
      return event.secondYellow ? (
        <span className="inline-flex items-start">
          <Card color="bg-yellow-400" />
          <Card color="bg-red-600" offset />
        </span>
      ) : (
        <Card color="bg-red-600" />
      );
    case "penalty_missed":
      return (
        <span className="text-sm" aria-hidden="true">
          {event.saved ? "🧤" : "✗"}
        </span>
      );
    default:
      return (
        <span className="text-sm" aria-hidden="true">
          ⚽
        </span>
      );
  }
};

export default EventIcon;
