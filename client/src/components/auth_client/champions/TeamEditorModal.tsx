import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "react-hot-toast";
import Modal from "../../ui/Modal";
import PlayerAvatar from "./PlayerAvatar";
import { cropToBlob, uploadImage } from "../../../lib/cloudinary";
import {
  SQUAD_MAX,
  SQUAD_MIN,
  errorMessage,
  useSaveLeagueTeamMutation,
  type LeaguePlayerInput,
  type LeagueTeam,
} from "../../../store/api";

interface TeamEditorModalProps {
  competitionId: string;
  /** Team to edit; omit to add a new one. */
  team?: LeagueTeam;
  onClose: () => void;
}

type Row = LeaguePlayerInput & { key: string };

let nextKey = 0;
const blank = (): Row => ({
  key: `new-${nextKey++}`,
  name: "",
  position: "FP",
  captaincy: null,
});

const cell =
  "w-full min-w-0 px-2.5 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#DD1D25]/40";
const DETAILS = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["studentId", "Student ID"],
  ["programme", "Programme"],
  ["intake", "Intake"],
] as const;

const TeamEditorModal = ({
  competitionId,
  team,
  onClose,
}: TeamEditorModalProps) => {
  const [name, setName] = useState(team?.name ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    team?.players.length
      ? team.players.map((p) => ({
          key: p._id,
          _id: p._id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          studentId: p.studentId,
          programme: p.programme,
          intake: p.intake,
          shirtNumber: p.shirtNumber ?? null,
          position: p.position,
          captaincy: p.captaincy ?? null,
          photo: p.photo ?? null,
        }))
      : [blank()],
  );
  const [open, setOpen] = useState<string | null>(null);
  const [save, { isLoading }] = useSaveLeagueTeamMutation();

  // Photo cropping happens inline (a nested modal would fight over Escape).
  const [cropping, setCropping] = useState<{ key: string; src: string } | null>(
    null,
  );
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<string | null>(null);
  const focusKey = useRef<string | null>(null);

  useEffect(() => {
    if (!focusKey.current) return;
    const input = document.getElementById(`player-${focusKey.current}`);
    input?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    input?.focus();
    focusKey.current = null;
  }, [rows.length]);

  useEffect(
    () => () => {
      if (cropping) URL.revokeObjectURL(cropping.src);
    },
    [cropping],
  );

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key === key) return { ...r, ...patch };
        // Only one captain and one vice-captain.
        if (patch.captaincy && r.captaincy === patch.captaincy)
          return { ...r, captaincy: null };
        return r;
      }),
    );

  const addPlayer = () => {
    const row = blank();
    focusKey.current = row.key;
    setRows((rs) => [...rs, row]);
  };

  const pickPhoto = (key: string) => {
    pickingFor.current = key;
    fileInput.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pickingFor.current) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropping({ key: pickingFor.current, src: URL.createObjectURL(file) });
  };

  const confirmCrop = async () => {
    if (!cropping || !area) return;
    setUploading(true);
    try {
      const blob = await cropToBlob(cropping.src, area);
      const photo = await uploadImage(blob, "player");
      update(cropping.key, { photo });
      setCropping(null);
    } catch (err) {
      toast.error(errorMessage(err, (err as Error).message || "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const named = rows.filter((r) => r.name.trim());
  const numbers = named.map((r) => r.shirtNumber).filter((n) => n != null);
  const duplicateNumbers = new Set(numbers).size !== numbers.length;
  const squadNote =
    named.length < SQUAD_MIN
      ? `Below the ${SQUAD_MIN}-player minimum`
      : named.length > SQUAD_MAX
        ? `Above the ${SQUAD_MAX}-player maximum`
        : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({
        id: competitionId,
        teamId: team?._id,
        data: {
          name: name.trim(),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          players: named.map(({ key, ...p }) => p),
        },
      }).unwrap();
      toast.success(team ? "Team updated" : "Team added");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save the team"));
    }
  };

  const croppingRow = cropping && rows.find((r) => r.key === cropping.key);

  return (
    <Modal
      isOpen
      onClose={cropping ? () => setCropping(null) : onClose}
      title={
        croppingRow
          ? `Photo · ${croppingRow.name || "New player"}`
          : team
            ? `Edit ${team.name}`
            : "Add Team"
      }
      size="xl"
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {cropping ? (
        <div className="space-y-4">
          <div className="relative h-80 rounded-xl overflow-hidden bg-zinc-900">
            <Cropper
              image={cropping.src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, px) => setArea(px)}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-zinc-500">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#DD1D25]"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCropping(null)}
              disabled={uploading}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              disabled={uploading || !area}
              className="flex-1 py-3 bg-[#DD1D25] text-white font-bold rounded-xl hover:bg-[#C41920] disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Use Photo"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {team?.formSubmission && (
            <p className="text-[11px] text-zinc-500 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              Imported from an approved application. Edits here only change the
              league squad, not the original application.
            </p>
          )}
          <div>
            <label
              htmlFor="team-name"
              className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5"
            >
              Team name
            </label>
            <input
              id="team-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cell}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Squad ({named.length}/{SQUAD_MAX})
                {squadNote && (
                  <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                    {squadNote}
                  </span>
                )}
                {duplicateNumbers && (
                  <span className="ml-2 font-semibold text-red-500">
                    Duplicate shirt numbers
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={addPlayer}
                className="text-xs font-bold text-[#DD1D25] hover:underline"
              >
                + Add player
              </button>
            </div>

            <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {rows.map((r, i) => (
                <li
                  key={r.key}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => pickPhoto(r.key)}
                      title="Upload photo"
                      aria-label={`Upload photo for player ${i + 1}`}
                      className="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-[#DD1D25]"
                    >
                      <PlayerAvatar
                        name={r.name || "?"}
                        photo={r.photo}
                        size={40}
                      />
                      <span className="absolute inset-0 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.photo ? "Change" : "Photo"}
                      </span>
                    </button>
                    <input
                      id={`player-${r.key}`}
                      aria-label={`Player ${i + 1} name`}
                      placeholder="Player name"
                      value={r.name}
                      onChange={(e) => update(r.key, { name: e.target.value })}
                      className={`${cell} flex-1`}
                    />
                    <input
                      aria-label={`Player ${i + 1} shirt number`}
                      placeholder="#"
                      type="number"
                      min={1}
                      max={99}
                      value={r.shirtNumber ?? ""}
                      onChange={(e) =>
                        update(r.key, {
                          shirtNumber: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className={`${cell} w-16! flex-none text-center`}
                    />
                    <select
                      aria-label={`Player ${i + 1} position`}
                      value={r.position}
                      onChange={(e) =>
                        update(r.key, {
                          position: e.target.value as Row["position"],
                        })
                      }
                      className={`${cell} w-auto! flex-none hidden sm:block`}
                    >
                      <option value="FP">Outfield</option>
                      <option value="GK">Goalkeeper</option>
                    </select>
                    <select
                      aria-label={`Player ${i + 1} captaincy`}
                      value={r.captaincy ?? ""}
                      onChange={(e) =>
                        update(r.key, {
                          captaincy: (e.target.value ||
                            null) as Row["captaincy"],
                        })
                      }
                      className={`${cell} w-auto! flex-none hidden sm:block`}
                    >
                      <option value="">—</option>
                      <option value="captain">Captain</option>
                      <option value="vice">Vice</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setOpen(open === r.key ? null : r.key)}
                      aria-expanded={open === r.key}
                      aria-label={`Player ${i + 1} details`}
                      className="w-8 h-8 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {open === r.key ? "▴" : "▾"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRows((rs) => rs.filter((x) => x.key !== r.key))
                      }
                      aria-label={`Remove player ${i + 1}`}
                      className="w-8 h-8 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      ✕
                    </button>
                  </div>

                  {open === r.key && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pl-12">
                      <select
                        aria-label={`Player ${i + 1} position`}
                        value={r.position}
                        onChange={(e) =>
                          update(r.key, {
                            position: e.target.value as Row["position"],
                          })
                        }
                        className={`${cell} sm:hidden`}
                      >
                        <option value="FP">Outfield</option>
                        <option value="GK">Goalkeeper</option>
                      </select>
                      <select
                        aria-label={`Player ${i + 1} captaincy`}
                        value={r.captaincy ?? ""}
                        onChange={(e) =>
                          update(r.key, {
                            captaincy: (e.target.value ||
                              null) as Row["captaincy"],
                          })
                        }
                        className={`${cell} sm:hidden`}
                      >
                        <option value="">No armband</option>
                        <option value="captain">Captain</option>
                        <option value="vice">Vice-captain</option>
                      </select>
                      {DETAILS.map(([field, label]) => (
                        <input
                          key={field}
                          aria-label={`Player ${i + 1} ${label}`}
                          placeholder={label}
                          type={field === "email" ? "email" : "text"}
                          value={r[field] ?? ""}
                          onChange={(e) =>
                            update(r.key, { [field]: e.target.value })
                          }
                          className={cell}
                        />
                      ))}
                      {r.photo && (
                        <button
                          type="button"
                          onClick={() => update(r.key, { photo: null })}
                          className="text-xs font-bold text-red-500 text-left px-1"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-zinc-400 mt-2">
              Click a photo to upload. Contact details and student info are only
              visible to admins.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || duplicateNumbers}
              className="flex-1 py-3 bg-[#DD1D25] text-white font-bold rounded-xl hover:bg-[#C41920] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving…" : team ? "Save Team" : "Add Team"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default TeamEditorModal;
