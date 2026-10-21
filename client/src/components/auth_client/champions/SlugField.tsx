import { useEffect, useState } from "react";
import { usePreviewCompetitionFormQuery } from "../../../store/api";

interface SlugFieldProps {
  value: string;
  onChange: (slug: string) => void;
  /** Competition being edited: its own link isn't a conflict. */
  competitionId?: string;
  disabled?: boolean;
  /** Reports whether the slug points at a usable, unlinked form. */
  onValidity?: (ok: boolean) => void;
}

/** Form slug input with a live check against the form's applications. */
const SlugField = ({
  value,
  onChange,
  competitionId,
  disabled,
  onValidity,
}: SlugFieldProps) => {
  const slug = value.trim().toLowerCase();
  const [debounced, setDebounced] = useState(slug);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(slug), 400);
    return () => clearTimeout(t);
  }, [slug]);

  const { data, error, isFetching } = usePreviewCompetitionFormQuery(
    debounced,
    { skip: !debounced },
  );
  const settled = debounced === slug && !isFetching;
  const takenByOther = !!data?.linkedTo && data.linkedTo._id !== competitionId;
  const ok = settled && !!data && !error && !takenByOther;

  useEffect(() => {
    onValidity?.(ok);
  }, [ok, onValidity]);

  return (
    <div>
      <label
        htmlFor="cl-form-slug"
        className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5"
      >
        Registration form slug
      </label>
      <div className="flex items-stretch rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-[#DD1D25]/40">
        <span className="px-3 flex items-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700">
          /form/
        </span>
        <input
          id="cl-form-slug"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/\s+/g, "-"))}
          placeholder="scl-futsal-2026"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none disabled:opacity-60"
        />
      </div>
      <p className="text-[11px] mt-1.5 min-h-4" aria-live="polite">
        {!slug ? (
          <span className="text-zinc-400">
            The slug of the form teams apply through. Only approved applications
            become teams.
          </span>
        ) : !settled ? (
          <span className="text-zinc-400">Checking…</span>
        ) : error ? (
          <span className="text-red-500">No form found with this slug.</span>
        ) : takenByOther ? (
          <span className="text-red-500">
            Already linked to “{data!.linkedTo!.name}”.
          </span>
        ) : data ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ {data.formTitle} · {data.approved} approved · {data.pending}{" "}
            pending
            {!data.isActive && (
              <span className="text-zinc-400 font-normal"> · form closed</span>
            )}
          </span>
        ) : null}
      </p>
    </div>
  );
};

export default SlugField;
