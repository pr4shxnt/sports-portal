import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import { FormList } from "../components/auth_client/Forms/FormList";
import { ManageForms } from "../components/auth_client/Forms/ManageForms";
import { FormBuilder } from "../components/auth_client/Forms/FormBuilder";

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const Forms = () => {
  const { user } = useAppSelector((state: any) => state.auth);
  const [view, setView] = useState<"list" | "create">("list");

  // User View: Can only see available forms
  if (user?.role === "user") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <FormList />
      </div>
    );
  }

  // Moderator/Admin View: Can manage forms and submissions
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Form Management
        </h1>
        {view === "list" &&
          (user?.role === "admin" || user?.role === "superuser") && (
            <button
              onClick={() => setView("create")}
              className="flex items-center gap-2 px-4 py-2 bg-[#DD1D25] text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Create Survey/Form
            </button>
          )}
      </div>

      {view === "create" ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Design New Form
              </h2>
              <p className="text-sm text-zinc-500">
                Configure fields and settings for your new survey or
                registration form.
              </p>
            </div>
            <button
              onClick={() => setView("list")}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
          </div>

          <FormBuilder
            onSuccess={() => setView("list")}
            onCancel={() => setView("list")}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <ManageForms />
        </div>
      )}
    </div>
  );
};

export default Forms;
