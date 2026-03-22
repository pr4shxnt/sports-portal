import readline from "readline";

const API_BASE = "https://sports-portal-sigma.vercel.app/api";
const EMAIL = "prashant_adhikari_a25@sunway.edu.np";
const PASSWORD = "prasha107851";
const FORM_ID = "esports-community-admin-registration";

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    }),
  );
}

async function run() {
  // 1. Login
  console.log("Logging in...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text());
    return;
  }
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Logged in ✓\n");

  // 2. Fetch current form and update it with the new field
  console.log("Fetching current form...");
  const formRes = await fetch(`${API_BASE}/forms/${FORM_ID}`, {
    headers: { Cookie: cookie },
  });
  const formData = await formRes.json();

  // Check if the field already exists
  const hasField = formData.fields.some((f) => f.name === "whyCommunityAdmin");
  if (!hasField) {
    const updatedFields = [
      ...formData.fields,
      {
        label: "Why should you be the Community Admin?",
        type: "textarea",
        name: "whyCommunityAdmin",
        placeholder:
          "Tell us why you would be a great Community Admin for Esports Community",
        required: true,
        options: [],
        fields: [],
      },
    ];

    console.log("Adding 'Why should you be the Community Admin?' field...");
    const updateRes = await fetch(`${API_BASE}/forms/${FORM_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ fields: updatedFields }),
    });
    if (!updateRes.ok) {
      console.error("Update failed:", await updateRes.text());
      return;
    }
    console.log("Form updated ✓ (now has", updatedFields.length, "fields)\n");
  } else {
    console.log("Field already exists, skipping update ✓\n");
  }

  // 3. Send OTP to the email
  console.log(`Sending OTP to ${EMAIL}...`);
  const otpSendRes = await fetch(`${API_BASE}/forms/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ email: EMAIL, formId: FORM_ID }),
  });
  if (!otpSendRes.ok) {
    console.error("OTP send failed:", await otpSendRes.text());
    return;
  }
  console.log("OTP sent ✓  Check your email.\n");

  // 4. Prompt user for OTP
  const otpCode = await prompt("Enter the OTP from your email: ");

  // 5. Verify OTP
  console.log("\nVerifying OTP...");
  const otpVerifyRes = await fetch(`${API_BASE}/forms/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ email: EMAIL, otp: otpCode }),
  });
  if (!otpVerifyRes.ok) {
    console.error("OTP verification failed:", await otpVerifyRes.text());
    return;
  }
  console.log("OTP verified ✓\n");

  // 6. Submit registration
  console.log("Submitting registration...");
  const submitRes = await fetch(`${API_BASE}/forms/${FORM_ID}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Prashant Adhikari",
      email: EMAIL,
      phone: "9800000000",
      collegeId: "A25",
      whyCommunityAdmin:
        "I am passionate about esports and have experience managing competitive gaming communities. I want to build and grow the Esports Community at Sunway.",
    }),
  });

  if (!submitRes.ok) {
    console.error("Submit failed:", submitRes.status, await submitRes.text());
    return;
  }
  const submitData = await submitRes.json();
  console.log("Registration submitted ✓");
  console.log("Submission ID:", submitData._id || JSON.stringify(submitData));
}

run().catch(console.error);
