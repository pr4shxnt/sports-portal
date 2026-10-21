import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "../../ui/Modal";
import SlugField from "./SlugField";
import {
  errorMessage,
  useCreateCompetitionMutation,
  useUpdateCompetitionMutation,
  type Competition,
  type CompetitionDetail,
} from "../../../store/api";

interface CompetitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Edit this competition; omit to create one. */
  competition?: Competition;
  onSaved?: (detail: CompetitionDetail) => void;
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#DD1D25]/40";
const labelClass =
  "block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5";

const syncToast = (detail: CompetitionDetail) => {
  if (!detail.sync) return;
  const { added, removed } = detail.sync;
  toast.success(
    `${added} team${added === 1 ? "" : "s"} imported from approved applications` +
      (removed ? `, ${removed} removed` : ""),
  );
};

const CompetitionFormModal = ({
  isOpen,
  onClose,
  competition,
  onSaved,
}: CompetitionFormModalProps) => {
  const [form, setForm] = useState({
    name: competition?.name ?? "Sunway Champions League",
    season: competition?.season ?? String(new Date().getFullYear()),
    sport: competition?.sport ?? "Futsal",
    description: competition?.description ?? "",
    formSlug: competition?.formSlug ?? "",
  });
  const [slugOk, setSlugOk] = useState(false);
  const onValidity = useCallback((ok: boolean) => setSlugOk(ok), []);
  const [create, { isLoading: creating }] = useCreateCompetitionMutation();
  const [update, { isLoading: updating }] = useUpdateCompetitionMutation();
  const saving = creating || updating;
  const slugLocked = competition?.status === "live";

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, formSlug: form.formSlug.trim().toLowerCase() };
    if (
      competition &&
      data.formSlug !== competition.formSlug &&
      !window.confirm(
        "Changing the form replaces every imported team with the new form's approved applications. Teams you added by hand are kept. Continue?",
      )
    )
      return;
    try {
      const detail = competition
        ? await update({ id: competition._id, data }).unwrap()
        : await create(data).unwrap();
      toast.success(
        competition ? "Competition updated" : "Competition created",
      );
      syncToast(detail);
      onSaved?.(detail);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save the competition"));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={competition ? "Edit Competition" : "New Champions League"}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="cl-name" className={labelClass}>
            Name
          </label>
          <input
            id="cl-name"
            required
            minLength={2}
            value={form.name}
            onChange={set("name")}
            className={inputClass}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cl-season" className={labelClass}>
              Season
            </label>
            <input
              id="cl-season"
              value={form.season}
              onChange={set("season")}
              placeholder="2026"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cl-sport" className={labelClass}>
              Sport
            </label>
            <input
              id="cl-sport"
              required
              value={form.sport}
              onChange={set("sport")}
              className={inputClass}
            />
          </div>
        </div>
        <SlugField
          value={form.formSlug}
          onChange={(formSlug) => setForm({ ...form, formSlug })}
          competitionId={competition?._id}
          disabled={slugLocked}
          onValidity={onValidity}
        />
        {slugLocked && (
          <p className="text-[11px] text-zinc-400 -mt-2">
            The form can't change once the league has started.
          </p>
        )}
        <div>
          <label htmlFor="cl-description" className={labelClass}>
            Description{" "}
            <span className="font-normal text-zinc-400">
              (shown on the public page)
            </span>
          </label>
          <textarea
            id="cl-description"
            rows={3}
            value={form.description}
            onChange={set("description")}
            className={inputClass}
          />
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
            disabled={saving || (!slugLocked && !slugOk)}
            className="flex-1 py-3 bg-[#DD1D25] text-white font-bold rounded-xl hover:bg-[#C41920] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Saving…"
              : competition
                ? "Save Changes"
                : "Create & Import Teams"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CompetitionFormModal;
