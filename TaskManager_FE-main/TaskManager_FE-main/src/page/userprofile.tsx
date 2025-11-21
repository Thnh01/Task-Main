import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../common/sidebar";
import type { IUser } from "../utils/interfaces";
import "./userprofile.css";

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    role: "employee" as "admin" | "employee",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as IUser;
        setCurrentUser(user);
        // Initialize form data with current user data
        setFormData({
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleOpenModal = () => {
    if (currentUser) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        full_name: currentUser.full_name,
        role: currentUser.role,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate form
    if (!formData.username.trim() || !formData.email.trim() || !formData.full_name.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Validate password change if any password field is filled
    const isChangingPassword =
      formData.currentPassword.trim() ||
      formData.newPassword.trim() ||
      formData.confirmPassword.trim();

    if (isChangingPassword) {
      if (!formData.currentPassword.trim()) {
        alert("Please enter your current password");
        return;
      }

      if (!formData.newPassword.trim()) {
        alert("Please enter a new password");
        return;
      }

      if (formData.newPassword.length < 6) {
        alert("New password must be at least 6 characters long");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }

      // In a real application, verify current password with backend
      // For demo purposes, we'll just log it
      console.log("Password change requested");
    }

    // Update user data
    const updatedUser: IUser = {
      ...currentUser,
      username: formData.username.trim(),
      email: formData.email.trim(),
      full_name: formData.full_name.trim(),
      role: formData.role,
    };

    // Update state and localStorage
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    setIsModalOpen(false);
  };

  if (!currentUser) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ marginLeft: "260px", flex: 1, padding: "2rem" }}>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="profile-main">
        <div className="profile-container">
          <div className="profile-header">
            <h1 className="profile-title">Profile</h1>
            <p className="profile-subtitle">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="profile-header-info">
                <h2 className="profile-username">{currentUser.username}</h2>
                <p className="profile-email">{currentUser.email}</p>
                <div className="profile-status-badge">
                  <span className="status-dot"></span>
                  {currentUser.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-details">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Username:</span>
                <span className="profile-detail-value">
                  {currentUser.username}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Email:</span>
                <span className="profile-detail-value">
                  {currentUser.email}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Full Name:</span>
                <span className="profile-detail-value">
                  {currentUser.full_name}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Role:</span>
                <span className="profile-detail-value">
                  {currentUser.role === "admin"
                    ? "Admin"
                    : "Employee"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Account Status:</span>
                <span className="profile-detail-value">
                  {currentUser.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Member Since:</span>
                <span className="profile-detail-value">
                  {formatDate(currentUser.created_at)}
                </span>
              </div>
            </div>

            <button className="profile-edit-button" onClick={handleOpenModal}>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Profile</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="password-section">
                  <h3 className="password-section-title">Change Password</h3>
                  <p className="password-section-subtitle">
                    Leave blank if you don't want to change your password
                  </p>

                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
