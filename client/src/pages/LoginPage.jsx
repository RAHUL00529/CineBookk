import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { requestOtp, verifyOtp } from "../api/auth.api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useCountdown } from "../hooks/useCountdown.js";
import { getErrorMessage } from "../utils/errors.js";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import Spinner from "../components/common/Spinner.jsx";

const RESEND_SEC = 30; // matches the server's OTP_COOLDOWN_SEC

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none";
const primaryButton =
  "w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50";

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/";

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { secondsLeft, start } = useCountdown();

  // All hooks are above this line. Hooks must never sit after an early return.
  if (authLoading) return <Spinner />;
  if (user) return <Navigate to={from} replace />;

  async function sendCode(address) {
    setError(null);
    setBusy(true);
    try {
      await requestOtp(address);
      setEmail(address);
      setOtp("");
      setStep("otp");
      start(RESEND_SEC);
    } catch (err) {
      const wait = err.response?.data?.details?.retryAfterSec;
      if (err.response?.status === 429 && wait) {
        // A code was sent a moment ago: let the user enter it
        setEmail(address);
        setStep("otp");
        start(wait);
      }
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    sendCode(email.trim().toLowerCase());
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      login(await verifyOtp(email, otp)); // the redirect happens on re-render
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink">Login to CineBook</h1>
        <p className="mt-1 text-sm text-gray-600">
          {step === "email"
            ? "Enter your email and we will send you a 6-digit code."
            : `We sent a code to ${email}. It expires in 5 minutes.`}
        </p>

        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="mb-1 block text-sm font-medium text-ink"
              >
                6-digit code
              </label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center text-xl tracking-[0.5em]`}
              />
            </div>
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy ? "Verifying..." : "Verify and login"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="text-gray-600 underline"
              >
                Change email
              </button>
              <button
                type="button"
                disabled={busy || secondsLeft > 0}
                onClick={() => sendCode(email)}
                className="font-medium text-brand disabled:text-gray-400"
              >
                {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
