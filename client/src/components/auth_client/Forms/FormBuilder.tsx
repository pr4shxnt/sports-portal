import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { createForm } from "../../../store/slices/formSlice";
import type { FormField } from "../../../types";

const TrashIcon = ({ className }: { className?: string }) => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

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

const GripIcon = ({ className }: { className?: string }) => (
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
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

interface FormBuilderProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  onSuccess,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.form);

  const [formTitle, setFormTitle] = useState("");
  const [formId, setFormId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [requireSunwayEmail, setRequireSunwayEmail] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);

  const fieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "email", label: "Email" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "file", label: "File Upload (Image)" },
    { value: "members", label: "Team Members List" },
  ];

  const addField = () => {
    const newField: FormField = {
      label: "New Field",
      type: "text",
      name: `field_${fields.length + 1}`,
      placeholder: "",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    // Special handling for members type when switching TO it
    if (updates.type === "members" && newFields[index].type !== "members") {
      updates.fields = [
        { label: "Player Name", type: "text", name: "name", required: true },
        {
          label: "Email Address",
          type: "email",
          name: "email",
          required: true,
        },
        {
          label: "Phone Number",
          type: "number",
          name: "phone",
          required: true,
        },
      ];
      updates.min = 5;
      updates.max = 8;
    }
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const updateSubField = (
    fieldIndex: number,
    subIndex: number,
    updates: Partial<FormField>,
  ) => {
    const newFields = [...fields];
    const field = { ...newFields[fieldIndex] };
    if (field.fields) {
      const newSubFields = [...field.fields];
      newSubFields[subIndex] = { ...newSubFields[subIndex], ...updates };
      field.fields = newSubFields;
      newFields[fieldIndex] = field;
      setFields(newFields);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formId || fields.length === 0) return;

    const formData = {
      formId,
      formTitle,
      formDescription,
      requireSunwayEmail,
      fields,
      isActive: true,
    };

    const resultAction = await dispatch(createForm(formData));
    if (createForm.fulfilled.match(resultAction)) {
      onSuccess();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Form Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Volleyball Tournament Registration"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-[#DD1D25] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Form ID (Unique slug)
              </label>
              <input
                type="text"
                value={formId}
                onChange={(e) =>
                  setFormId(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="e.g. volleyball-2024"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-[#DD1D25] outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Tell users what this form is for..."
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-[#DD1D25] outline-none h-[116px] resize-none"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${requireSunwayEmail ? "bg-[#DD1D25]" : "bg-zinc-300 dark:bg-zinc-700"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${requireSunwayEmail ? "translate-x-4" : ""}`}
              />
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={requireSunwayEmail}
              onChange={(e) => setRequireSunwayEmail(e.target.checked)}
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Require @sunway.edu.np email verification
              </span>
              <span className="text-xs text-zinc-500">
                Users must verify their email with OTP and use a Sunway domain
                email.
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Form Fields
            <span className="text-xs font-normal text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {fields.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-2 text-sm font-semibold text-[#DD1D25] hover:text-red-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Field
          </button>
        </div>

        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <p className="text-zinc-500">
                No fields added yet. Click "Add Field" to begin.
              </p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-fade-in group"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 pt-2">
                    <GripIcon className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 cursor-grab active:cursor-grabbing" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Field Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, { label: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm focus:ring-1 focus:ring-[#DD1D25] outline-none"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Input Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, { type: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm focus:ring-1 focus:ring-[#DD1D25] outline-none"
                        >
                          {fieldTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Field Name (Unique)
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, {
                              name: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "_"),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm focus:ring-1 focus:ring-[#DD1D25] outline-none"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-center space-x-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(index, { required: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-[#DD1D25] focus:ring-[#DD1D25] border-zinc-300"
                          />
                          <span className="text-xs font-medium text-zinc-500">
                            Req.
                          </span>
                        </label>
                      </div>
                      <div className="md:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Additional Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-zinc-50 dark:border-zinc-800/50">
                      {field.type !== "members" && (
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              updateField(index, {
                                placeholder: e.target.value,
                              })
                            }
                            placeholder="Enter hint text for user"
                            className="w-full px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs focus:ring-1 focus:ring-[#DD1D25] outline-none"
                          />
                        </div>
                      )}

                      {field.type === "members" && (
                        <>
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                              Min Participation
                            </label>
                            <input
                              type="number"
                              value={field.min || 1}
                              onChange={(e) =>
                                updateField(index, {
                                  min: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs focus:ring-1 focus:ring-[#DD1D25] outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                              Max Participation
                            </label>
                            <input
                              type="number"
                              value={field.max || 1}
                              onChange={(e) =>
                                updateField(index, {
                                  max: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs focus:ring-1 focus:ring-[#DD1D25] outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Sub-fields for Team Members */}
                    {field.type === "members" && field.fields && (
                      <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg space-y-3">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                          <PlusIcon className="w-3 h-3" />
                          Nested Member Subfields
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {field.fields.map((subField, subIdx) => (
                            <div
                              key={subIdx}
                              className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-2 rounded-md shadow-sm"
                            >
                              <input
                                type="text"
                                value={subField.label}
                                onChange={(e) =>
                                  updateSubField(index, subIdx, {
                                    label: e.target.value,
                                  })
                                }
                                className="w-full text-xs font-medium bg-transparent border-none focus:ring-0 p-0 mb-1"
                                placeholder="Label"
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-400 uppercase">
                                  {subField.type}
                                </span>
                                <span className="text-[9px] text-zinc-400 italic truncate max-w-[80px]">
                                  {subField.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-white dark:bg-zinc-950">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !formTitle || !formId || fields.length === 0}
          className="px-8 py-2 rounded-lg bg-[#DD1D25] text-white text-sm font-semibold hover:bg-red-700 transition-all shadow-md disabled:opacity-50 disabled:hover:bg-[#DD1D25]"
        >
          {loading ? "Creating..." : "Save Form"}
        </button>
      </div>
    </div>
  );
};
