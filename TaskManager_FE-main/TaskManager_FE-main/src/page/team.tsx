import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../common/sidebar";
import type { IUser } from "../utils/interfaces";
import { canManageTeam } from "../utils/permissions";
import "./team.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

type BackendUser = {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: "GROUP_LEADER" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  avatarColor?: string | null;
  createdAt: string | null;
};

const Team: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data: BackendUser[] = await response.json();
      const transformedUsers: IUser[] = data.map((user) => ({
        user_id: user.userId,
        username: user.username,
        email: user.email,
        full_name: user.fullName,
        role: user.role === "GROUP_LEADER" ? "admin" : "employee",
        created_at: user.createdAt ?? new Date().toISOString(),
        is_active: user.status === "ACTIVE",
        avatar_color: user.avatarColor ?? undefined,
      }));
      setUsers(transformedUsers);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err instanceof Error ? err.message : "Unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as IUser;
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [fetchUsers]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (fullName: string): string => {
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (user: IUser): string => {
    if (user.avatar_color) {
      return user.avatar_color;
    }
    const colors = [
      "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
      "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
      "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
      "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
    ];
    return colors[user.user_id % colors.length];
  };

  const handleToggleUserStatus = (userId: number) => {
    if (!canManageTeam(currentUser)) {
      alert("You don't have permission to manage team members");
      return;
    }

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.user_id === userId
          ? { ...user, is_active: !user.is_active }
          : user
      )
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="team-main">
        <div className="team-container">
          <div className="team-header">
            <h1 className="team-title">Team</h1>
            <p className="team-subtitle">View and manage your team members</p>
            <button
              className="team-refresh-btn"
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="team-grid">Loading team members...</div>
          ) : error ? (
            <div className="team-grid error-message">
              <p>Unable to load team: {error}</p>
              <button onClick={fetchUsers}>Try again</button>
            </div>
          ) : (
            <div className="team-grid">
              {users.map((user) => (
                <div key={user.user_id} className="team-member-card">
                  <div
                    className="member-avatar"
                    style={{ background: getAvatarColor(user) }}
                  >
                    <span className="member-initials">
                      {getInitials(user.full_name)}
                    </span>
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">{user.full_name}</h3>
                    <p className="member-username">@{user.username}</p>
                    <p className="member-email">{user.email}</p>
                    <div className="member-meta">
                      <span
                        className={`member-role ${
                          user.role === "admin"
                            ? "role-leader"
                            : "role-member"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Employee"}
                      </span>
                      <span
                        className={`member-status ${
                          user.is_active ? "status-active" : "status-inactive"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="member-joined">
                      Joined {formatDate(user.created_at)}
                    </p>
                  </div>
                  {canManageTeam(currentUser) && (
                    <button
                      className="toggle-status-btn"
                      onClick={() => handleToggleUserStatus(user.user_id)}
                    >
                      {user.is_active ? "Disable" : "Activate"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;
