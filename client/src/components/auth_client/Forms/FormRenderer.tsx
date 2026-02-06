import React from "react";
import type { Form, FormField } from "../../../types";
import { useForm, useFieldArray } from "react-hook-form";

interface FormRendererProps {
  form: Form;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const renderField = (field: FormField, index: number, prefix = "") => {
    const fieldName = prefix ? `${prefix}.${field.name}` : field.name;

    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "date":
      case "file":
        return (
          <div key={index} className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              {...register(fieldName, { required: field.required })}
            />
            {errors[fieldName] && (
              <p className="text-sm text-red-500 mt-1">
                This field is required
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={index} className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              {...register(fieldName, { required: field.required })}
            />
            {errors[fieldName] && (
              <p className="text-sm text-red-500 mt-1">
                This field is required
              </p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={index} className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              {...register(fieldName, { required: field.required })}
            >
              <option value="">Select an option</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors[fieldName] && (
              <p className="text-sm text-red-500 mt-1">
                This field is required
              </p>
            )}
          </div>
        );

      case "members":
        return (
          <MembersField
            key={index}
            field={field}
            control={control}
            register={register}
            errors={errors}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        {form.formTitle}
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        {form.formDescription}
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {form.fields.map((field, index) => renderField(field, index))}

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#DD1D25] text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Nested component for Members field
const MembersField = ({ field, control, register }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: field.name,
  });

  // Ensure minimum fields are rendered initially
  React.useEffect(() => {
    if (fields.length < (field.min || 0)) {
      const needed = (field.min || 0) - fields.length;
      for (let i = 0; i < needed; i++) {
        append({});
      }
    }
  }, [field.min, append, fields.length]);

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {field.type.toUpperCase()} ({field.min || 0} - {field.max || "Any"})
        </label>
        <button
          type="button"
          onClick={() => append({})}
          disabled={field.max && fields.length >= field.max}
          className="text-sm text-[#DD1D25] hover:text-red-700 font-medium disabled:opacity-50"
        >
          + Add Member
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((item: any, index: number) => (
          <div
            key={item.id}
            className="p-4 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 relative"
          >
            <div className="absolute top-2 right-2">
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length <= (field.min || 0)}
                className="text-zinc-400 hover:text-red-500 disabled:opacity-30"
              >
                &times;
              </button>
            </div>

            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Member {index + 1}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field.fields?.map(
                (nestedField: FormField, nestedIndex: number) => (
                  <div key={nestedIndex}>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {nestedField.label}{" "}
                      {nestedField.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type={nestedField.type}
                      placeholder={nestedField.placeholder}
                      className="w-full px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                      {...register(
                        `${field.name}.${index}.${nestedField.name}`,
                        {
                          required: nestedField.required,
                        },
                      )}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
