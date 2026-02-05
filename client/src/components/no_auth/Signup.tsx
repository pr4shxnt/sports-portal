import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import img from "../../assets/logo_main.png";

export default function SignupForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!termsAccepted) {
      alert("Please accept the terms and conditions");
      return;
    }

    // Show OTP Modal instead of immediate submit
    setShowOtpModal(true);
    // Simulate sending OTP
    console.log("Mock OTP sent: 123456");
  };

  const handleVerifyOtp = () => {
    if (otp === "123456") {
      setLoading(true);
      setOtpError("");

      // Simulate API call for verification and signup
      setTimeout(() => {
        console.log("Signup Successful:", {
          name,
          email,
          phone,
          batch,
          section,
          password,
        });
        setLoading(false);
        setShowOtpModal(false);
        alert("Account created successfully!");
        navigate("/login");
      }, 1500);
    } else {
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    console.log("Signup with Google");
    // integrate Google OAuth here
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 relative">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg">
        {/* Card Navbar */}
        <div className=" justify-center pt-10 items-center flex flex-col rounded-t-xl  px-6">
          <div className="">
            <a
              href="https://ssrc.sunway.edu.np"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-300 transition hover:text-white"
            >
              <img src={img} alt="SSRC Logo" className="h-18 w-auto" />
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {/* Header */}
          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              SSRC Sports Club
            </h1>
            <p className="text-sm text-neutral-400">
              Signup to get into the portal.
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Email
              </label>
              <input
                type="email"
                placeholder="name@sunway.edu.np"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9800000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>

            {/* Batch and Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-200">
                  Batch
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-200">
                  Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-white focus:ring-2 focus:ring-neutral-700"
              />
              <label htmlFor="terms" className="text-xs text-neutral-400">
                I agree to the{" "}
                <a href="#" className="text-white hover:underline">
                  Terms and Conditions
                </a>
              </label>
            </div>

            <button
              type="submit"
              className="h-10 w-full rounded-md bg-white text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
            >
              Sign up
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-neutral-800" />
            <span className="mx-3 text-xs text-neutral-400">OR</span>
            <div className="flex-1 border-t border-neutral-800" />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-white hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#B61C23]/10">
                <svg
                  className="h-6 w-6 text-[#B61C23]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Verify your Email
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                We've sent a verification code to <br />
                <span className="font-medium text-white">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="h-12 w-full rounded-md border border-neutral-800 bg-neutral-950 px-4 text-center text-lg tracking-widest text-white placeholder:text-neutral-600 focus:border-[#B61C23] focus:outline-none focus:ring-1 focus:ring-[#B61C23]"
                maxLength={6}
                autoFocus
              />

              {otpError && (
                <p className="text-center text-xs text-red-500">{otpError}</p>
              )}

              <div className="text-center text-xs text-neutral-500">
                Mock OTP is{" "}
                <span className="font-mono text-neutral-300">123456</span>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="h-10 w-full rounded-md bg-[#B61C23] text-sm font-medium text-white transition hover:bg-[#B61C23]/90 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>

              <button
                onClick={() => setShowOtpModal(false)}
                className="h-10 w-full rounded-md border border-neutral-800 bg-transparent text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Google Icon */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.8 32.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.4 35.9 26.8 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-1.1 3-3.3 5.4-6.1 6.9l6.3 5.2C39.5 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.9z"
      />
    </svg>
  );
}
