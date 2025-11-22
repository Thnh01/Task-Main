import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../common/sidebar";
import { MOCK_ATTACHMENTS } from "../utils/mockdata";
import type { ITask, IComment, IUser, IAttachment } from "../utils/interfaces";
import "./taskdetail.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

type CommentCategory = 'Started' | 'Completed' | 'In Progress' | 'Commented' | 'Bug' | 'Assigned';

type BackendTask = {
  taskId: number;
  title: string;
  description: string;
  status: string; // "PENDING" | "TO_DO" | "IN_PROGRESS" | "DONE"
  priority: string; // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  startDate: string | null;
  dueDate: string;
  categoryName: string | null;
  createdByUsername: string | null;
  assignedUsers: string[]; // List of full names
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

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

type BackendComment = {
  commentId: number;
  taskId: number;
  userId: number;
  username: string;
  userFullName: string;
  parentCommentId: number | null;
  text: string;
  category: string | null;
  createdAt: string;
};

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<ITask | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<CommentCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mapStatusFromBackend = (status: string): ITask["status"] => {
    switch (status.toUpperCase()) {
      case "IN_PROGRESS":
        return "in progress";
      case "DONE":
        return "completed";
      case "TO_DO":
      case "PENDING":
      default:
        return "pending";
    }
  };

  const mapPriorityFromBackend = (priority: string): ITask["priority"] => {
    switch (priority.toUpperCase()) {
      case "URGENT":
        return "urgent";
      case "HIGH":
        return "high";
      case "MEDIUM":
        return "medium";
      case "LOW":
      default:
        return "low";
    }
  };

  const transformBackendUser = (user: BackendUser): IUser => ({
    user_id: user.userId,
    username: user.username,
    email: user.email,
    full_name: user.fullName,
    role: user.role === "GROUP_LEADER" ? "admin" : "employee",
    created_at: user.createdAt ?? new Date().toISOString(),
    is_active: user.status === "ACTIVE",
    avatar_color: user.avatarColor ?? undefined,
  });

  const transformBackendTask = (task: BackendTask, users: IUser[]): ITask => {
    try {
      // Map assigned user names to user IDs
      const assigneeIds = task.assignedUsers && Array.isArray(task.assignedUsers)
        ? task.assignedUsers
            .map((name) => users.find((u) => u.full_name === name)?.user_id)
            .filter((id): id is number => id !== undefined)
        : [];

      return {
        task_id: task.taskId || 0,
        title: task.title || "",
        description: task.description ?? "",
        start_date: task.startDate ?? "",
        due_date: task.dueDate ?? "",
        completed_date: null,
        status: mapStatusFromBackend(task.status || "PENDING"),
        priority: mapPriorityFromBackend(task.priority || "MEDIUM"),
        category: task.categoryName ?? "General",
        created_at: task.createdAt ?? new Date().toISOString(),
        updated_at: task.updatedAt ?? new Date().toISOString(),
        is_trashed: false,
        tags: Array.isArray(task.tags) ? task.tags : [],
        assignee_ids: assigneeIds,
      };
    } catch (err) {
      console.error("Error transforming task:", err, task);
      throw new Error("Failed to transform task data");
    }
  };

  const transformBackendComment = (comment: BackendComment): IComment => ({
    comment_id: comment.commentId,
    user_id: comment.userId,
    task_id: comment.taskId,
    parent_comment_id: comment.parentCommentId,
    text: comment.text,
    created_at: comment.createdAt,
    category: comment.category as IComment["category"] | undefined,
  });

  const fetchComments = useCallback(async (taskIdParam: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/task/${taskIdParam}`);
      if (!response.ok) {
        console.warn("Failed to load comments, using empty array");
        return [];
      }
      const commentsJson: BackendComment[] = await response.json();
      return commentsJson.map(transformBackendComment);
    } catch (err) {
      console.error("Error loading comments:", err);
      return [];
    }
  }, []);

  const fetchTaskData = useCallback(async () => {
    if (!taskId) {
      setError("Task ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching task data for ID:", taskId);
      console.log("API URL:", `${API_BASE_URL}/api/tasks/${taskId}`);
      
      const [taskRes, usersRes, commentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks/${taskId}`),
        fetch(`${API_BASE_URL}/api/users`),
        fetch(`${API_BASE_URL}/api/comments/task/${taskId}`),
      ]);

      console.log("Task response status:", taskRes.status);
      console.log("Users response status:", usersRes.status);
      console.log("Comments response status:", commentsRes.status);

      if (!taskRes.ok) {
        const errorText = await taskRes.text();
        console.error("Task API error:", errorText);
        if (taskRes.status === 404) {
          throw new Error("Task not found");
        }
        throw new Error(`Failed to load task: ${taskRes.status} ${errorText}`);
      }
      if (!usersRes.ok) {
        const errorText = await usersRes.text();
        console.error("Users API error:", errorText);
        throw new Error(`Failed to load users: ${usersRes.status} ${errorText}`);
      }

      const taskJson: BackendTask = await taskRes.json();
      const usersJson: BackendUser[] = await usersRes.json();
      const commentsJson: BackendComment[] = commentsRes.ok 
        ? await commentsRes.json() 
        : [];

      console.log("Task data received:", taskJson);
      console.log("Users data received:", usersJson);
      console.log("Comments data received:", commentsJson);

      if (!taskJson || !taskJson.taskId) {
        throw new Error("Invalid task data received from server");
      }

      const normalizedUsers = usersJson.map(transformBackendUser);
      const normalizedTask = transformBackendTask(taskJson, normalizedUsers);
      const normalizedComments = commentsJson.map(transformBackendComment);

      console.log("Normalized task:", normalizedTask);
      console.log("Normalized users:", normalizedUsers);
      console.log("Normalized comments:", normalizedComments);

      setTask(normalizedTask);
      setUsers(normalizedUsers);
      setComments(normalizedComments);
      setError(null);
    } catch (err) {
      console.error("Error loading task:", err);
      const errorMessage = err instanceof Error ? err.message : "Unexpected error occurred";
      console.error("Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

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

    // Load task data from API (includes comments)
    fetchTaskData();
  }, [taskId, fetchTaskData]);

  const taskAssignees = useMemo(() => {
    if (!task) return [];
    if (!task.assignee_ids?.length) {
      return [];
    }
    return users.filter((u) => task.assignee_ids?.includes(u.user_id));
  }, [task, users]);

  const taskAttachments = useMemo(() => {
    if (!task) return [];
    return MOCK_ATTACHMENTS.filter((a) => a.task_id === task.task_id);
  }, [task]);

  const getCommentAuthor = (userId: number): IUser | undefined => {
    return users.find((u) => u.user_id === userId);
  };

  const handleCategoryToggle = (category: CommentCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId || !currentUser) return;

    try {
      const requestBody = {
        taskId: parseInt(taskId),
        userId: currentUser.user_id,
        parentCommentId: null,
        text: newComment.trim(),
        category: selectedCategories.length > 0 ? selectedCategories[0] : 'Commented',
      };

      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create comment");
      }

      const commentJson: BackendComment = await response.json();
      const newCommentObj = transformBackendComment(commentJson);

      setComments((prev) => [...prev, newCommentObj]);
      setNewComment("");
      setSelectedCategories([]);
    } catch (error) {
      console.error("Error creating comment:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create comment. Please try again."
      );
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
    return "📎";
  };

  const handleDownloadAttachment = (attachment: IAttachment) => {
    // In a real app, this would download the file from the server
    // For now, we'll just open it in a new tab if URL exists
    if (attachment.file_url) {
      window.open(attachment.file_url, "_blank");
    } else {
      alert(`Downloading ${attachment.file_name}...`);
    }
  };

  const getPriorityColor = (priority: ITask["priority"]) => {
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

  const getStatusLabel = (status: ITask["status"]) => {
    const statusMap: Record<string, string> = {
      pending: "To Do",
      "in progress": "In Progress",
      completed: "Completed",
      "on hold": "On Hold",
    };
    return statusMap[status] || status;
  };

  const categoryOptions: CommentCategory[] = [
    'Started',
    'Completed',
    'In Progress',
    'Commented',
    'Bug',
    'Assigned',
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="task-detail-main">
          <div className="task-detail-header">
            <button className="back-button" onClick={() => navigate("/tasks")}>
              ← Back to Tasks
            </button>
          </div>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading task...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="task-detail-main">
          <div className="task-detail-header">
            <button className="back-button" onClick={() => navigate("/tasks")}>
              ← Back to Tasks
            </button>
          </div>
          <div style={{ padding: "2rem" }}>
            <div className="error-message" style={{ 
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              padding: "1.5rem",
              margin: "2rem 0"
            }}>
              <h3 style={{ marginTop: 0, color: "#c33" }}>Error Loading Task</h3>
              <p style={{ color: "#666" }}>{error || "Task not found"}</p>
              <p style={{ fontSize: "0.875rem", color: "#999", marginTop: "0.5rem" }}>
                Task ID: {taskId}
              </p>
              <button
                onClick={fetchTaskData}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Safety check
  if (!task) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="task-detail-main">
          <div className="task-detail-header">
            <button className="back-button" onClick={() => navigate("/tasks")}>
              ← Back to Tasks
            </button>
          </div>
          <div style={{ padding: "2rem" }}>
            <div className="error-message">
              <p>Task data is not available</p>
              <button onClick={fetchTaskData} style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}>
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="task-detail-main">
        <div className="task-detail-header">
          <button className="back-button" onClick={() => navigate("/tasks")}>
            ← Back to Tasks
          </button>
          <h1 className="task-detail-title">{task.title || "Untitled Task"}</h1>
        </div>

        <div className="task-detail-content">
          {/* Task Information */}
          <div className="task-info-section">
            <div className="section-header">
              <h2>Task Information</h2>
            </div>
            <div className="task-info-grid">
              <div className="info-item">
                <label>Description</label>
                <p>{task.description || "No description provided"}</p>
              </div>
              <div className="info-item">
                <label>Status</label>
                <span className="status-badge">{getStatusLabel(task.status)}</span>
              </div>
              <div className="info-item">
                <label>Priority</label>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
              </div>
              <div className="info-item">
                <label>Category</label>
                <span className="category-badge">{task.category}</span>
              </div>
              <div className="info-item">
                <label>Start Date</label>
                <p>{formatDate(task.start_date)}</p>
              </div>
              <div className="info-item">
                <label>Due Date</label>
                <p>{formatDate(task.due_date)}</p>
              </div>
              {task.completed_date && (
                <div className="info-item">
                  <label>Completed Date</label>
                  <p>{formatDate(task.completed_date)}</p>
                </div>
              )}
              <div className="info-item">
                <label>Assigned To</label>
                <div className="assignees-list">
                  {taskAssignees.length > 0 ? (
                    taskAssignees.map((user) => (
                      <span key={user.user_id} className="assignee-badge">
                        {user.full_name}
                      </span>
                    ))
                  ) : (
                    <span className="no-assignee">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {taskAttachments.length > 0 && (
            <div className="attachments-section">
              <div className="section-header">
                <h2>Attachments ({taskAttachments.length})</h2>
              </div>
              <div className="attachments-list">
                {taskAttachments.map((attachment) => {
                  const uploader = users.find(
                    (u) => u.user_id === attachment.uploaded_by
                  );
                  return (
                    <div key={attachment.attachment_id} className="attachment-item">
                      <div className="attachment-icon">
                        {getFileIcon(attachment.file_type)}
                      </div>
                      <div className="attachment-info">
                        <div className="attachment-name">{attachment.file_name}</div>
                        <div className="attachment-meta">
                          <span>{formatFileSize(attachment.file_size)}</span>
                          <span>•</span>
                          <span>
                            Uploaded by {uploader?.full_name || "Unknown"} on{" "}
                            {formatDateTime(attachment.uploaded_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="download-btn"
                        onClick={() => handleDownloadAttachment(attachment)}
                        title="Download or view file"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="comments-section">
            <div className="section-header">
              <h2>Comments ({comments.length})</h2>
            </div>

            {/* Add Comment Form */}
            <div className="comment-form-container">
              <form onSubmit={handleSubmitComment} className="comment-form">
                <div className="comment-categories">
                  <label>Categories:</label>
                  <div className="category-checkboxes">
                    {categoryOptions.map((category) => (
                      <label key={category} className="category-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <textarea
                  className="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={4}
                  required
                />
                <button type="submit" className="submit-comment-btn">
                  Add Comment
                </button>
              </form>
            </div>

            {/* Comments List */}
            <div className="comments-list">
              {comments.length > 0 ? (
                comments
                  .filter((c) => !c.parent_comment_id)
                  .map((comment) => {
                    const author = getCommentAuthor(comment.user_id);
                    const replies = comments.filter(
                      (c) => c.parent_comment_id === comment.comment_id
                    );

                    return (
                      <div key={comment.comment_id} className="comment-item">
                        <div className="comment-header">
                          <div className="comment-author">
                            <strong>{author?.full_name || "Unknown User"}</strong>
                            {comment.category && (
                              <span className="comment-category-badge">
                                {comment.category}
                              </span>
                            )}
                          </div>
                          <span className="comment-date">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <div className="comment-text">{comment.text}</div>
                        {replies.length > 0 && (
                          <div className="comment-replies">
                            {replies.map((reply) => {
                              const replyAuthor = getCommentAuthor(reply.user_id);
                              return (
                                <div key={reply.comment_id} className="comment-reply">
                                  <div className="comment-header">
                                    <div className="comment-author">
                                      <strong>
                                        {replyAuthor?.full_name || "Unknown User"}
                                      </strong>
                                      {reply.category && (
                                        <span className="comment-category-badge">
                                          {reply.category}
                                        </span>
                                      )}
                                    </div>
                                    <span className="comment-date">
                                      {formatDateTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <div className="comment-text">{reply.text}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="no-comments">No comments yet. Be the first to comment!</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetail;

