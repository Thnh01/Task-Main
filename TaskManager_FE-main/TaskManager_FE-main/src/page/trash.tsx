import React, { useState, useEffect } from "react";
import Sidebar from "../common/sidebar";
import { MOCK_TASKS, MOCK_USERS, MOCK_ASSIGNMENTS } from "../utils/mockdata";
import type { ITask, IUser } from "../utils/interfaces";
import { isAdmin } from "../utils/permissions";
import "./trash.css";

const Trash: React.FC = () => {
  const [trashedTasks, setTrashedTasks] = useState<ITask[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as IUser;
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Filter tasks that are trashed
    const trashed = MOCK_TASKS.filter((task) => task.is_trashed);
    setTrashedTasks(trashed);
  }, []);

  // Get assignees for a task
  const getTaskAssignees = (taskId: number): IUser[] => {
    const assignmentUserIds = MOCK_ASSIGNMENTS.filter(
      (a) => a.task_id === taskId
    ).map((a) => a.user_id);
    return MOCK_USERS.filter((u) => assignmentUserIds.includes(u.user_id));
  };

  // Calculate days since deleted
  const getDaysSinceDeleted = (updatedAt: string): number => {
    const deletedDate = new Date(updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle restore task
  const handleRestore = (taskId: number) => {
    if (!isAdmin(currentUser)) {
      alert("You don't have permission to restore tasks");
      return;
    }

    if (window.confirm("Are you sure you want to restore this task?")) {
      setTrashedTasks((prev) => prev.filter((t) => t.task_id !== taskId));
      // In a real app, this would call an API to restore the task
      console.log("Task restored:", taskId);
    }
  };

  // Handle permanent delete
  const handleDeletePermanently = (taskId: number) => {
    if (!isAdmin(currentUser)) {
      alert("You don't have permission to permanently delete tasks");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to permanently delete this task? This action cannot be undone."
      )
    ) {
      setTrashedTasks((prev) => prev.filter((t) => t.task_id !== taskId));
      // In a real app, this would call an API to permanently delete the task
      console.log("Task permanently deleted:", taskId);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Get priority color
  const getPriorityColor = (priority: ITask["priority"]): string => {
    switch (priority) {
      case "urgent":
      case "high":
        return "#f44336";
      case "medium":
        return "#ff9800";
      case "low":
        return "#2ecc71";
      default:
        return "#9aa0a6";
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="trash-main">
        <div className="trash-container">
          <div className="trash-header">
            <h1 className="trash-title">Trash</h1>
            <p className="trash-subtitle">
              View and manage deleted tasks. Items in trash will be permanently
              deleted after 30 days.
            </p>
          </div>

          {trashedTasks.length === 0 ? (
            <div className="trash-empty">
              <div className="trash-empty-icon">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <p className="trash-empty-text">Your trash is empty</p>
            </div>
          ) : (
            <div className="trash-list">
              {trashedTasks.map((task) => {
                const assignees = getTaskAssignees(task.task_id);
                const daysDeleted = getDaysSinceDeleted(task.updated_at);
                const daysRemaining = 30 - daysDeleted;

                return (
                  <div key={task.task_id} className="trash-item">
                    <div className="trash-item-content">
                      <div className="trash-item-header">
                        <h3 className="trash-item-title">{task.title}</h3>
                        <div className="trash-item-meta">
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                          <span className="category-badge">{task.category}</span>
                        </div>
                      </div>
                      <p className="trash-item-description">{task.description}</p>
                      <div className="trash-item-details">
                        <div className="trash-item-info">
                          <span className="trash-item-label">Due Date:</span>
                          <span className="trash-item-value">
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                        <div className="trash-item-info">
                          <span className="trash-item-label">Assigned to:</span>
                          <span className="trash-item-value">
                            {assignees.length > 0
                              ? assignees.map((u) => u.full_name).join(", ")
                              : "Unassigned"}
                          </span>
                        </div>
                        <div className="trash-item-info">
                          <span className="trash-item-label">Deleted:</span>
                          <span className="trash-item-value">
                            {formatDate(task.updated_at)} ({daysDeleted} days ago)
                          </span>
                        </div>
                        {daysRemaining > 0 ? (
                          <div className="trash-item-info">
                            <span className="trash-item-label">Auto-delete in:</span>
                            <span className="trash-item-value warning">
                              {daysRemaining} days
                            </span>
                          </div>
                        ) : (
                          <div className="trash-item-info">
                            <span className="trash-item-label">Status:</span>
                            <span className="trash-item-value danger">
                              Ready for permanent deletion
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin(currentUser) && (
                      <div className="trash-item-actions">
                        <button
                          className="btn-restore"
                          onClick={() => handleRestore(task.task_id)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                          </svg>
                          Restore
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeletePermanently(task.task_id)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete Permanently
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Trash;
