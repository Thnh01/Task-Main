import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../common/sidebar";
import { MOCK_TASKS, MOCK_COMMENTS, MOCK_USERS, MOCK_ASSIGNMENTS, MOCK_ATTACHMENTS } from "../utils/mockdata";
import type { ITask, IComment, IUser, IAttachment } from "../utils/interfaces";
import "./taskdetail.css";

type CommentCategory = 'Started' | 'Completed' | 'In Progress' | 'Commented' | 'Bug' | 'Assigned';

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<CommentCategory[]>([]);
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

    // Load comments for this task
    if (taskId) {
      const taskComments = MOCK_COMMENTS.filter(
        (c) => c.task_id === parseInt(taskId)
      );
      setComments(taskComments);
    }
  }, [taskId]);

  const task = useMemo(() => {
    if (!taskId) return null;
    return MOCK_TASKS.find((t) => t.task_id === parseInt(taskId));
  }, [taskId]);

  const taskAssignees = useMemo(() => {
    if (!task) return [];
    const assignmentUserIds = MOCK_ASSIGNMENTS.filter(
      (a) => a.task_id === task.task_id
    ).map((a) => a.user_id);
    return MOCK_USERS.filter((u) => assignmentUserIds.includes(u.user_id));
  }, [task]);

  const taskAttachments = useMemo(() => {
    if (!task) return [];
    return MOCK_ATTACHMENTS.filter((a) => a.task_id === task.task_id);
  }, [task]);

  const getCommentAuthor = (userId: number): IUser | undefined => {
    return MOCK_USERS.find((u) => u.user_id === userId);
  };

  const handleCategoryToggle = (category: CommentCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId || !currentUser) return;

    const newCommentObj: IComment = {
      comment_id: Math.max(...MOCK_COMMENTS.map((c) => c.comment_id), 0) + 1,
      user_id: currentUser.user_id,
      task_id: parseInt(taskId),
      parent_comment_id: null,
      text: newComment.trim(),
      created_at: new Date().toISOString(),
      category: selectedCategories.length > 0 ? selectedCategories[0] : 'Commented',
    };

    setComments((prev) => [...prev, newCommentObj]);
    setNewComment("");
    setSelectedCategories([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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

  if (!task) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="task-detail-main">
          <div className="error-message">Task not found</div>
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
          <h1 className="task-detail-title">{task.title}</h1>
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
                  const uploader = MOCK_USERS.find(
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

