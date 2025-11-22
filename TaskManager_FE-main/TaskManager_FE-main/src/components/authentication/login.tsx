import React, { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LoginFormInputs } from "./type";
import type { IUser } from "../../utils/interfaces";
import "./login.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface BackendUser {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarColor?: string;
  createdAt: string;
}

interface LoginResponse {
  token: string;
  user: BackendUser;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormInputs>({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [demoUsers, setDemoUsers] = useState<IUser[]>([]);

  // Fetch demo users for display
  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (response.ok) {
          const users: BackendUser[] = await response.json();
          const transformedUsers: IUser[] = users
            .slice(0, 3)
            .map((user) => ({
              user_id: user.userId,
              username: user.username,
              email: user.email,
              full_name: user.fullName,
              role: user.role === "GROUP_LEADER" ? "admin" : "employee",
              created_at: user.createdAt
                ? new Date(user.createdAt).toISOString()
                : new Date().toISOString(),
              is_active: user.status === "ACTIVE",
              avatar_color: user.avatarColor || undefined,
            }));
          setDemoUsers(transformedUsers);
          // Set first user as default username
          if (transformedUsers.length > 0) {
            setFormData((prev) => ({
              ...prev,
              username: transformedUsers[0].username,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching demo users:", err);
      }
    };

    fetchDemoUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate required fields
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || "Invalid username or password");
        setLoading(false);
        return;
      }

      const loginData: LoginResponse = await response.json();
      const userData = loginData.user;

      // Transform backend UserDTO to frontend IUser
      const transformedUser: IUser = {
        user_id: userData.userId,
        username: userData.username,
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role === "GROUP_LEADER" ? "admin" : "employee",
        created_at: userData.createdAt
          ? new Date(userData.createdAt).toISOString()
          : new Date().toISOString(),
        is_active: userData.status === "ACTIVE",
        avatar_color: userData.avatarColor || undefined,
      };

      setCurrentUser(transformedUser);
      console.log("Login successful:", transformedUser);

      // Store user in localStorage for session management
      localStorage.setItem("currentUser", JSON.stringify(transformedUser));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to server. Please try again."
      );
      setLoading(false);
    }
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
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="errorMessage">{error}</div>}

          <button type="submit" className="signInButton" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
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
          {demoUsers.length > 0 && (
            <div className="demoCredentials">
              <div className="demoCredentialsTitle">Demo Credentials:</div>
              {demoUsers.map((user) => (
                <div key={user.user_id} className="demoCredentialsText">
                  Username: <strong>{user.username}</strong> ({user.full_name})
                  {user.role === "admin" && " - Admin"}
                </div>
              ))}
              <div
                className="demoCredentialsText"
                style={{ marginTop: "0.5rem", fontStyle: "italic" }}
              >
                Password: (required - enter your password)
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
