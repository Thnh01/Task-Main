import React, { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MOCK_USERS } from "../../utils/mockdata";
import "./forgotpassword.css";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Check if email exists in mock users
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      setError("No account found with this email address.");
      return;
    }

    // In a real application, this would send a password reset email
    // For demo purposes, we'll just show a success message
    setSuccess(true);
    console.log("Password reset requested for:", email);
  };

  return (
    <div className="forgotPasswordContainer">
      <div className="forgotPasswordHeader">
        <div className="iconContainer">
          <svg
            className="iconEnvelope"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>
        <h1 className="title">Forgot Password</h1>
        <p className="subtitle">
          Enter your email address and we'll send you a link to reset your
          password
        </p>
      </div>

      <div className="forgotPasswordCard">
        {success ? (
          <div className="successMessage">
            <div className="successIcon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Reset Link Sent!</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="successSubtext">
              Please check your email and follow the instructions to reset your
              password.
            </p>
            <Link to="/login" className="backToLoginButton">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgotPasswordForm">
            <div className="formGroup">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <button type="submit" className="resetButton">
              Send Reset Link
            </button>

            <div className="backToLoginPrompt">
              Remember your password?{" "}
              <Link to="/login" className="backToLoginLink">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

