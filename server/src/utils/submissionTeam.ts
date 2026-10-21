import { IFormField } from "../models/Form.js";

export interface SubmissionMember {
  name: string;
  email: string;
  phone: string;
  studentId?: string;
  programme?: string;
  intake?: string;
}

const pick = (data: Record<string, any>, keys: string[]) =>
  keys.map((k) => data[k]).find((v) => typeof v === "string" && v.trim());

/**
 * Team name + players from a form submission. Uses the form's "members"
 * field when it has one, otherwise a single player from the applicant's own
 * fields (various naming conventions seen across forms).
 */
export const teamFromSubmission = (
  data: Record<string, any> = {},
  fields: IFormField[] = [],
) => {
  const membersField = fields.find((f) => f.type === "members")?.name;
  const list = data[membersField ?? "members"] ?? data.members;

  let members: SubmissionMember[] = [];
  if (Array.isArray(list)) {
    members = list
      .filter((m) => m && (m.name || m.email))
      .map((m) => ({
        name: String(m.name ?? "").trim(),
        email: String(m.email ?? "").trim(),
        phone: String(m.phone ?? "").trim(),
        // Squad details the League's registration asks for (§7.2), if present.
        studentId: pick(m, [
          "studentId",
          "student_id",
          "collegeId",
          "college_id",
        ]),
        programme: pick(m, ["programme", "program", "course"]),
        intake: pick(m, ["intake", "batch"]),
      }));
  } else {
    const name = pick(data, [
      "name",
      "team_leader",
      "full_name",
      "captain_name",
    ]);
    const email = pick(data, ["email", "team_email", "contact_email"]);
    const phone =
      data.phone ?? data.contact ?? data.phone_number ?? data.mobile ?? "";
    if (name && email) members.push({ name, email, phone: String(phone) });
  }

  const name =
    pick(data, ["team_name", "teamName", "team"]) ??
    pick(data, ["full_name", "name"]) ??
    "Team";

  return { name: String(name).trim(), members };
};
