import React, { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { SignupFormInputs } from "./type";
import { MOCK_USERS } from "../../utils/mockdata";
import type { IUser } from "../../utils/interfaces";
import "./signup.css";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormInputs>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (error) setError("");
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const existingUser = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === formData.username.toLowerCase()
    );

    if (existingUser) {
      setError("Username already exists. Please choose a different one.");
      return;
    }

    const existingEmail = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === formData.email.toLowerCase()
    );

    if (existingEmail) {
      setError("Email already registered. Please use a different email.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Create new user todo: call API
    const newUser: IUser = {
      user_id: MOCK_USERS.length + 1,
      username: formData.username,
      email: formData.email,
      full_name: formData.username, // TODO: get full name from API
      role: "employee",
      created_at: new Date().toISOString(),
      is_active: true,
    };

    setCurrentUser(newUser);
    setSuccess(true);
    console.log("Signup successful:", newUser);

    // Store user in localStorage for session management
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    // Optionally redirect to login after successful signup
    // navigate('/login');
  };

  return (
    <div className="signupContainer">
      {currentUser ? (
        <div className="userIndicator">{currentUser.full_name}</div>
      ) : (
        <div className="userIndicator">Noh Anh Kiệt</div>
      )}
      <div className="signupHeader">
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
        <h1 className="title">Create Account</h1>
        <p className="subtitle">Join our task management platform</p>
      </div>

      <div className="signupCard">
        {success ? (
          <div className="successMessage">
            <h2>Account Created Successfully!</h2>
            <p>Welcome, {currentUser?.username}!</p>
            <p>You can now sign in with your credentials.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="signupForm">
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
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="your@email.com"
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
                placeholder="Create a password"
                required
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <button type="submit" className="signUpButton">
              Sign Up
            </button>

            <div className="signInPrompt">
              Already have an account?{" "}
              <Link to="/login" className="signInLink">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;
