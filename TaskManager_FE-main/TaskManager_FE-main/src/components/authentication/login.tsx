import React, { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LoginFormInputs } from "./type";
import { MOCK_USERS } from "../../utils/mockdata";
import type { IUser } from "../../utils/interfaces";
import "./login.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormInputs>({
    username: MOCK_USERS[0]?.username || "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const user = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === formData.username.toLowerCase()
    );

    if (!user) {
      setError("Username not found. Please check your credentials.");
      return;
    }

    if (!user.is_active) {
      setError("This account is inactive. Please contact administrator.");
      return;
    }
    setCurrentUser(user);
    console.log("Login successful:", user);

    // Store user in localStorage for session management
    localStorage.setItem("currentUser", JSON.stringify(user));

    // Redirect to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="loginContainer">
      {currentUser ? (
        <div className="userIndicator">{currentUser.full_name}</div>
      ) : (
        <div className="userIndicator">Demo Mode</div>
      )}
      <div className="loginHeader">
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
        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Manage your team's tasks efficiently</p>
      </div>

      <div className="loginCard">
        <form onSubmit={handleSubmit} className="loginForm">
          <div className="formGroup">
            <label htmlFor="username" className="label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Enter your password (optional for demo)"
            />
          </div>

          {error && <div className="errorMessage">{error}</div>}

          <button type="submit" className="signInButton">
            Sign In
          </button>

          <Link to="/forgot-password" className="forgotPasswordLink">
            Forgot password?
          </Link>

          <div className="signUpPrompt">
            Don't have an account?{" "}
            <Link to="/signup" className="signUpLink">
              Sign up
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="demoCredentials">
            <div className="demoCredentialsTitle">Demo Credentials:</div>
            {MOCK_USERS.slice(0, 3).map((user) => (
              <div key={user.user_id} className="demoCredentialsText">
                Username: <strong>{user.username}</strong> ({user.full_name})
              </div>
            ))}
            <div
              className="demoCredentialsText"
              style={{ marginTop: "0.5rem", fontStyle: "italic" }}
            >
              Password: (leave blank for demo)
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
