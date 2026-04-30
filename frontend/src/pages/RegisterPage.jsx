import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(formData);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Jump into a full-stack MERN chat app with real-time Socket.io messaging, timestamps, and presence."
      supportingText="Create your profile once, then chat live from any device with your saved history."
      footerText="Sign in"
      footerLink="/login"
      footerLabel="Already have an account?"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            placeholder="At least 6 characters"
            minLength={6}
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
