import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import formsData from "../../../../data/form_data.json";
import img from "../../../assets/logo_main.png";

interface FormData {
  [key: string]: any;
}

interface MemberData {
  name: string;
  email: string;
  phone: string;
  [key: string]: string;
}

const DynamicForm = () => {
  const { formId } = useParams();
  const [formSchema, setFormSchema] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // OTP Verification State
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Initialize form state when formId changes
  useEffect(() => {
    const schema = formsData.find((f: any) => f.id === formId);

    if (schema) {
      setFormSchema(schema);

      const initialState: FormData = {};
      schema.fields.forEach((f: any) => {
        if (f.type === "members") {
          // Initialize with min required members (default to 1 if not specified)
          const minMembers = f.min || 1;
          initialState[f.name] = Array(minMembers)
            .fill(null)
            .map(() => ({
              name: "",
              email: "",
              phone: "",
            }));
        } else {
          initialState[f.name] = f.default || "";
        }
      });

      setFormData(initialState);
      setErrors({});
      // Reset OTP state
      setEmailVerified(false);
      setShowOtpInput(false);
      setOtp("");
      setOtpError("");
    } else {
      setFormSchema(null);
    }
  }, [formId]);

  // Calculate progress based on filled fields
  useEffect(() => {
    if (!formSchema) return;

    const totalFields = formSchema.fields.filter(
      (f: any) => f.type !== "members",
    ).length;
    const memberField = formSchema.fields.find(
      (f: any) => f.type === "members",
    );

    // Count main fields
    let filledFields = 0;
    formSchema.fields.forEach((field: any) => {
      if (
        field.type !== "members" &&
        formData[field.name] &&
        String(formData[field.name]).trim() !== ""
      ) {
        filledFields++;
      }
    });

    // Count member fields
    let totalMemberSubFields = 0;
    let filledMemberSubFields = 0;

    if (memberField) {
      const members = formData[memberField.name] || [];
      const subFields = memberField.fields || [];

      totalMemberSubFields = members.length * subFields.length;

      members.forEach((member: MemberData) => {
        subFields.forEach((subField: any) => {
          if (member[subField.name] && member[subField.name].trim() !== "") {
            filledMemberSubFields++;
          }
        });
      });
    }

    const total = totalFields + totalMemberSubFields;
    const current = filledFields + filledMemberSubFields;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    setProgress(percentage);
  }, [formData, formSchema]);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith("@sunway.edu.np");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formSchema) return;
    const { name, value } = e.target;

    // Validate email if the field is an email field
    if (name === "email") {
      // Reset verification if email changes
      setEmailVerified(false);
      setShowOtpInput(false);
      setOtp("");
      setOtpError("");

      if (value && !validateEmail(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Email must end with @sunway.edu.np",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Sync with Player 1 if applicable
      const memberField = formSchema.fields.find(
        (f: any) => f.type === "members",
      );
      if (memberField) {
        const updatedMembers = [...(prev[memberField.name] || [])];
        if (updatedMembers.length > 0) {
          let shouldUpdate = false;
          const player1 = { ...updatedMembers[0] };

          if (name === "full_name") {
            player1.name = value;
            shouldUpdate = true;
          } else if (name === "email") {
            player1.email = value;
            shouldUpdate = true;
          } else if (name === "phone") {
            player1.phone = value;
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            updatedMembers[0] = player1;
            newData[memberField.name] = updatedMembers;
          }
        }
      }

      return newData;
    });
  };

  const handleMemberChange = (
    index: number,
    fieldName: string,
    value: string,
  ) => {
    if (!formSchema) return;
    // Prevent editing Player 1 directly from the members list if it's synced
    if (index === 0 && ["name", "email", "phone"].includes(fieldName)) return;

    // Validate email for members
    if (fieldName === "email") {
      const errorKey = `member_${index}_email`;
      if (value && !validateEmail(value)) {
        setErrors((prev) => ({
          ...prev,
          [errorKey]: "Email must end with @sunway.edu.np",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    }

    const memberField = formSchema.fields.find(
      (f: any) => f.type === "members",
    );
    if (!memberField) return;

    const updatedMembers = [...formData[memberField.name]];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [fieldName]: value,
    };

    setFormData((prev) => ({ ...prev, [memberField.name]: updatedMembers }));
  };

  const addMember = () => {
    if (!formSchema) return;
    const memberField = formSchema.fields.find(
      (f: any) => f.type === "members",
    );
    if (!memberField) return;

    const currentMembers = formData[memberField.name] || [];
    const maxMembers = memberField.max || 100; // Default high limit if not specified

    if (currentMembers.length < maxMembers) {
      setFormData((prev) => ({
        ...prev,
        [memberField.name]: [
          ...prev[memberField.name],
          { name: "", email: "", phone: "" },
        ],
      }));
    }
  };

  const removeMember = (index: number) => {
    if (!formSchema) return;
    const memberField = formSchema.fields.find(
      (f: any) => f.type === "members",
    );
    if (!memberField) return;

    const updatedMembers = [...formData[memberField.name]];
    const minMembers = memberField.min || 1;

    // Only allow removal if we have more than min members
    if (updatedMembers.length > minMembers) {
      updatedMembers.splice(index, 1);

      // Clear errors for the removed member
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`member_${index}_email`];
        return newErrors;
      });

      setFormData((prev) => ({ ...prev, [memberField.name]: updatedMembers }));
    }
  };

  const handleVerifyEmail = () => {
    if (!formData.email || errors.email) return;

    setIsVerifyingOtp(true);
    // Simulate API call to send OTP
    setTimeout(() => {
      setIsVerifyingOtp(false);
      setShowOtpInput(true);
      console.log("Mock OTP sent: 123456");
      alert("Mock OTP sent! Check console for code (it's 123456)");
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp === "123456") {
      setEmailVerified(true);
      setShowOtpInput(false);
      setOtpError("");
    } else {
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for any existing errors
    if (Object.keys(errors).length > 0) {
      alert("Please fix the errors in the form before submitting.");
      return;
    }

    // Check if email is verified
    if (!emailVerified) {
      alert("Please verify your email address before submitting.");
      return;
    }

    // Final validation check before submission
    const newErrors: { [key: string]: string } = {};
    let hasError = false;

    // Validate main email
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Email must end with @sunway.edu.np";
      hasError = true;
    }

    // Validate members emails
    const memberField = formSchema.fields.find(
      (f: any) => f.type === "members",
    );
    if (memberField && formData[memberField.name]) {
      formData[memberField.name].forEach(
        (member: MemberData, index: number) => {
          if (member.email && !validateEmail(member.email)) {
            newErrors[`member_${index}_email`] =
              "Email must end with @sunway.edu.np";
            hasError = true;
          }
        },
      );
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setLoading(false);
      setSubmitted(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    }, 1200);
  };

  if (!formSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Form Not Found</h1>
          <p className="text-neutral-400">
            The requested form does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Header Card */}
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg overflow-hidden">
          {/* Top colored bar like Google Forms */}
          <div
            className="h-2 w-full"
            style={{ backgroundColor: "#B61C23" }}
          ></div>

          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6">
            <a
              href="https://ssrc.sunway.edu.np"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:opacity-80"
            >
              <img src={img} alt="SSRC Logo" className="h-20 w-auto" />
            </a>
          </div>

          {/* Title and Description */}
          <div className="px-8 pb-8 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white text-center">
              {formSchema.formTitle}
            </h1>
            <p className="text-sm text-neutral-400 text-center leading-relaxed max-w-2xl mx-auto">
              {formSchema.formDescription}
            </p>

            {/* Confidentiality Notice */}
            <div className="mt-6 rounded-lg bg-neutral-950/50 border border-neutral-800 p-4 text-xs text-neutral-500">
              <p className="font-semibold text-neutral-400 mb-1">
                Confidentiality Notice:
              </p>
              <p>
                The information collected in this form is for the purpose of the
                SSRC event registration only. Your personal details (email and
                phone number) will be kept confidential and used solely for
                event coordination. We do not share your data with third
                parties.
              </p>
              <p className="mt-2 text-red-400/80">
                * Indicates required question
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 font-medium">
                Registration Progress
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {progress}% Completed
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, backgroundColor: "#B61C23" }}
              />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info Section */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-neutral-800 pb-4">
              Team Details
            </h2>

            {formSchema.fields.map((field: any, idx: number) => {
              if (field.type === "members") return null;

              return (
                <div key={idx} className="space-y-2 group">
                  <label className="text-sm font-medium text-neutral-200 group-focus-within:text-[#B61C23] transition-colors">
                    {field.label}
                    {field.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>
                  {field.description && (
                    <p className="text-xs text-neutral-500">
                      {field.description}
                    </p>
                  )}

                  <div className="relative">
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      required={field.required}
                      onChange={handleChange}
                      disabled={field.name === "email" && emailVerified}
                      className={`h-11 w-full rounded-md border ${
                        errors[field.name]
                          ? "border-red-500"
                          : "border-neutral-800"
                      } bg-neutral-950 px-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#B61C23] focus:ring-1 focus:ring-[#B61C23] transition-all ${
                        field.name === "email" && emailVerified
                          ? "pr-10 border-green-500/50 bg-green-900/10"
                          : ""
                      }`}
                    />

                    {/* Verification Checkmark */}
                    {field.name === "email" && emailVerified && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {errors[field.name] && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[field.name]}
                    </p>
                  )}

                  {/* Verify Button for Email */}
                  {field.name === "email" &&
                    !emailVerified &&
                    formData.email &&
                    validateEmail(formData.email) &&
                    !showOtpInput && (
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={isVerifyingOtp}
                        className="mt-2 px-4 py-2 rounded-md bg-[#B61C23] text-white text-xs font-medium hover:bg-[#B61C23]/90 transition-colors flex items-center gap-2"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <svg
                              className="animate-spin h-3 w-3"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Sending OTP...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </button>
                    )}

                  {/* OTP Input Section */}
                  {field.name === "email" && showOtpInput && (
                    <div className="mt-3 p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 animate-fade-in">
                      <label className="text-xs font-medium text-neutral-400 mb-2 block">
                        Enter OTP sent to your email
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="h-10 flex-1 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#B61C23] focus:ring-1 focus:ring-[#B61C23]"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="px-4 h-10 rounded-md bg-[#B61C23] text-white text-sm font-medium hover:bg-[#B61C23]/90 transition-colors"
                        >
                          Verify
                        </button>
                      </div>
                      {otpError && (
                        <p className="text-xs text-red-500 mt-2">{otpError}</p>
                      )}
                      <div className="mt-2 text-[10px] text-neutral-500">
                        Mock OTP is{" "}
                        <span className="font-mono text-neutral-300">
                          123456
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Members Section */}
          {formSchema.fields.map((field: any, idx: number) => {
            if (field.type !== "members") return null;

            const members = formData[field.name] || [];
            const subFields = field.fields || [];

            return (
              <div key={idx} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-semibold text-white">
                    Player Information
                  </h2>
                  <span className="text-sm text-neutral-400">
                    {members.length} Players
                  </span>
                </div>

                {members.map((member: MemberData, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg overflow-hidden transition-all hover:border-neutral-700 relative group"
                  >
                    <div className="bg-neutral-950/50 px-6 py-3 border-b border-neutral-800 flex justify-between items-center">
                      <h3 className="text-md font-medium text-neutral-200">
                        Player {i + 1}
                      </h3>
                      <div className="flex items-center gap-3">
                        {i === 0 && (
                          <span className="text-xs bg-[#B61C23]/20 text-[#B61C23] px-2 py-1 rounded border border-[#B61C23]/30">
                            Captain
                          </span>
                        )}
                        {/* Only show remove button for players beyond the minimum required */}
                        {i >= (field.min || 1) && (
                          <button
                            type="button"
                            onClick={() => removeMember(i)}
                            className="text-neutral-500 hover:text-red-400 transition-colors"
                            title="Remove Player"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subFields.map((subField: any, subIdx: number) => (
                        <div
                          key={subIdx}
                          className={`space-y-2 ${
                            subField.name === "name" ? "md:col-span-2" : ""
                          }`}
                        >
                          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                            {subField.label}
                            {subField.required && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </label>
                          <input
                            type={subField.type}
                            placeholder={subField.placeholder}
                            value={member[subField.name] || ""}
                            onChange={(e) =>
                              handleMemberChange(
                                i,
                                subField.name,
                                e.target.value,
                              )
                            }
                            required={subField.required}
                            readOnly={i === 0}
                            className={`h-10 w-full rounded-md border ${
                              subField.name === "email" &&
                              errors[`member_${i}_email`]
                                ? "border-red-500"
                                : "border-neutral-800"
                            } bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#B61C23] focus:ring-1 focus:ring-[#B61C23] transition-all ${
                              i === 0
                                ? "opacity-50 cursor-not-allowed bg-neutral-900"
                                : ""
                            }`}
                          />
                          {subField.name === "email" &&
                            errors[`member_${i}_email`] && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors[`member_${i}_email`]}
                              </p>
                            )}
                          {i === 0 && (
                            <p className="text-[10px] text-neutral-500">
                              * Auto-filled from Team Details
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Player Button - Only show if below max limit */}
                {members.length < (field.max || 100) && (
                  <button
                    type="button"
                    onClick={addMember}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-neutral-800 text-neutral-400 hover:border-[#B61C23] hover:text-[#B61C23] hover:bg-[#B61C23]/5 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-full bg-neutral-800 group-hover:bg-[#B61C23] flex items-center justify-center transition-colors">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        ></path>
                      </svg>
                    </div>
                    <span className="font-medium">Add Another Player</span>
                  </button>
                )}
              </div>
            );
          })}

          {/* Success Message */}
          {submitted && (
            <div className="rounded-xl bg-green-900/20 border border-green-800 p-6 animate-fade-in text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-900/50 text-green-400 mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-400 mb-1">
                Registration Successful!
              </h3>
              <p className="text-sm text-green-400/80">
                You have been registered. See you soon !!
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-4 pb-12">
            <button
              type="submit"
              disabled={loading || submitted}
              className="h-12 w-full max-w-xs rounded-lg text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                backgroundColor: "#B61C23",
                boxShadow: "0 10px 15px -3px rgba(182, 28, 35, 0.2)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : submitted ? (
                "Registered ✓"
              ) : (
                "Submit Registration"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-neutral-600 pb-8">
          <p>SSRC Event Registration Form</p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} Sunway Student Representatives
            Council
          </p>
        </div>
      </div>
    </div>
  );
};

export default DynamicForm;
