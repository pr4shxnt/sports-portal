import fs from "fs";

const API_BASE = "https://sports-portal-sigma.vercel.app/api";
const EMAIL = "prashant_adhikari_a25@sunway.edu.np";
const PASSWORD = "prasha107851";

async function seed() {
  console.log("Logging in...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!loginRes.ok) {
    const errorText = await loginRes.text();
    console.error("Login failed:", loginRes.status, errorText);
    return;
  }

  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get("set-cookie");
  console.log("Login successful. Cookie acquired:", !!setCookie);

  // Fetch the membership form
  console.log("Fetching general-member-registration...");
  const formRes = await fetch(`${API_BASE}/forms/general-member-registration`, {
    headers: { Cookie: setCookie },
  });

  if (!formRes.ok) {
    const errorText = await formRes.text();
    console.error(
      "Failed to fetch general-member-registration:",
      formRes.status,
      errorText,
    );
    return;
  }

  const formData = await formRes.json();
  console.log("Fetched base form successfully.");

  // Create new form
  const newForm = {
    formId: "esports-community-admin-registration",
    formTitle: "Esports Community Admin Registration",
    formDescription: "Registration for Community Admin for Esports Community.",
    requireSunwayEmail: true,
    fields: formData.fields,
  };

  console.log("Creating new form...");
  const createRes = await fetch(`${API_BASE}/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: setCookie,
    },
    body: JSON.stringify(newForm),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("Failed to create form:", createRes.status, errorText);
    return;
  }

  const createData = await createRes.json();
  console.log("Form created successfully:", createData.formId);
}

seed().catch(console.error);
