import React, { useMemo, useState, useEffect, useCallback } from "react";
import Sidebar from "../common/sidebar";
import "./dashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface BackendTask {
  taskId: number;
  title: string;
  description: string | null;
  status: "TO_DO" | "IN_PROGRESS" | "DONE" | "PENDING";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate: string | null;
  dueDate: string | null;
  categoryName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tags: string[];
  assigneeIds: number[];
}

interface BackendActivity {
  activityId: number;
  taskId: number | null;
  taskTitle: string | null;
  userId: number | null;
  userFullName: string | null;
  actionType: string;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  createdAt: string;
}

interface ActivityItem {
  id: number;
  type: 'comment' | 'status_change' | 'created' | 'updated';
  user: string;
  action: string;
  target: string;
  timestamp: string;
  category?: string;
}

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [activities, setActivities] = useState<BackendActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksRes, activitiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks`),
        fetch(`${API_BASE_URL}/api/activities/recent?limit=20`),
      ]);

      if (!tasksRes.ok) {
        throw new Error("Failed to load tasks");
      }
      if (!activitiesRes.ok) {
        throw new Error("Failed to load activities");
      }

      const tasksData: BackendTask[] = await tasksRes.json();
      const activitiesData: BackendActivity[] = await activitiesRes.json();

      setTasks(tasksData);
      setActivities(activitiesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompleted = tasks.filter(
      (t) => t.status === "DONE" || t.status === "COMPLETED"
    ).length;
    const dueToday = tasks.filter(
      (t) => t.dueDate === today && t.status !== "DONE"
    ).length;
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "DONE"
    ).length;

    return { totalCompleted, dueToday, overdue };
  }, [tasks, today]);

  // Priority counts
  const priorityCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    tasks.forEach((t) => {
      const p = (t.priority || "LOW").toUpperCase();
      if (p === "URGENT" || p === "HIGH") {
        counts.high++;
      } else if (p === "MEDIUM") {
        counts.medium++;
      } else {
        counts.low++;
      }
    });
    return counts;
  }, [tasks]);

  // Upcoming deadlines (next 5 tasks by due date)
  const upcomingDeadlines = useMemo(() => {
    return [...tasks]
      .filter((t) => t.status !== "DONE" && t.dueDate)
      .sort((a, b) => {
        const dateA = a.dueDate || "";
        const dateB = b.dueDate || "";
        return dateA.localeCompare(dateB);
      })
      .slice(0, 5);
  }, [tasks]);

  // Transform backend activities to frontend format
  const recentActivity = useMemo(() => {
    return activities.map((activity): ActivityItem => {
      const actionType = activity.actionType?.toLowerCase() || '';
      const description = activity.description || '';
      let type: ActivityItem['type'] = 'updated';
      let action = 'updated';
      let category: string | undefined;

      // Check if it's a comment based on description or newValue
      if (description.toLowerCase().includes('commented') || 
          activity.newValue?.toLowerCase() === 'commented' ||
          activity.newValue?.toLowerCase().includes('comment')) {
        type = 'comment';
        action = activity.newValue || 'Commented';
        category = activity.newValue || 'Commented';
      } else if (actionType === 'status_changed' || actionType.includes('status')) {
        type = 'status_change';
        action = 'updated status to';
        // Map backend status to frontend status format
        const statusValue = activity.newValue || activity.oldValue || '';
        const statusMap: Record<string, string> = {
          'TO_DO': 'pending',
          'IN_PROGRESS': 'in progress',
          'DONE': 'completed',
          'PENDING': 'pending'
        };
        category = statusMap[statusValue] || statusValue.toLowerCase();
      } else if (actionType === 'created' || description.toLowerCase().includes('started')) {
        type = 'created';
        action = 'Started on';
      } else {
        type = 'updated';
        action = description || 'updated';
      }

      return {
        id: activity.activityId,
        type,
        user: activity.userFullName || 'Unknown User',
        action,
        target: activity.taskTitle || 'Unknown Task',
        timestamp: activity.createdAt,
        category,
      };
    });
  }, [activities]);

  // Chart data for bar chart
  const chartData = useMemo(
    () => [
      { label: "Low", value: priorityCounts.low, color: "#2ecc71" },
      { label: "Medium", value: priorityCounts.medium, color: "#ff9800" },
      { label: "High", value: priorityCounts.high, color: "#f44336" },
    ],
    [priorityCounts]
  );

  const maxValue = useMemo(
    () => Math.max(...chartData.map((d) => d.value), 1),
    [chartData]
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMs < 0) {
      return "just now";
    }

    if (diffMins < 1) {
      return "just now";
    }

    if (diffMins < 60) {
      return `${diffMins}${diffMins === 1 ? " minute" : " minutes"} ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}${diffHours === 1 ? " hour" : " hours"} ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}${diffDays === 1 ? " day" : " days"} ago`;
    }

    if (diffDays < 30) {
      return `${diffWeeks}${diffWeeks === 1 ? " week" : " weeks"} ago`;
    }

    if (diffDays < 365) {
      return `${diffMonths}${diffMonths === 1 ? " month" : " months"} ago`;
    }

    if (diffYears >= 1) {
      return `${diffYears}${diffYears === 1 ? " year" : " years"} ago`;
    }

    return formatDate(dateString);
  };

  const mapPriorityToBadge = (priority: string): string => {
    const p = priority.toLowerCase();
    if (p === "urgent" || p === "high") return "high";
    if (p === "medium") return "medium";
    return "low";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="dashboard-main">
          <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="dashboard-main">
          <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h2>Welcome back!</h2>
            <p className="muted">Here's what's happening with your tasks today</p>
          </div>
        </header>

        {/* Summary Stats Panel */}
        <section className="cards-row">
          <div className="card small">
            <div className="card-title">Tasks Overdue</div>
            <div className="card-value danger">{stats.overdue}</div>
            <div className="card-sub">Requires immediate attention</div>
          </div>

          <div className="card small">
            <div className="card-title">Tasks Due Today</div>
            <div className="card-value">{stats.dueToday}</div>
            <div className="card-sub">Complete before midnight</div>
          </div>

          <div className="card small">
            <div className="card-title">Total Completed</div>
            <div className="card-value success">{stats.totalCompleted}</div>
            <div className="card-sub">Great work!</div>
          </div>
        </section>

        <section className="content-grid">
          {/* Priority Chart */}
          <div className="card large chart-card">
            <div className="card-heading">Tasks by Priority</div>
            <div className="chart-container">
              <div className="bar-chart">
                {chartData.map((item) => (
                  <div key={item.label} className="bar-item">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{
                          width: `${(item.value / maxValue) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      >
                        <span className="bar-value">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                {chartData.map((item) => (
                  <div key={item.label} className="legend-item">
                    <span
                      className="legend-swatch"
                      style={{ background: item.color }}
                    />
                    <span className="legend-label">
                      {item.label}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card large">
            <div className="card-heading">Upcoming Deadlines</div>
            <div className="upcoming-list">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => (
                  <div key={task.taskId} className="upcoming-item">
                    <div>
                      <div className="upcoming-title">{task.title}</div>
                      <div className="upcoming-date">{formatDate(task.dueDate)}</div>
                    </div>
                    <div className={`badge ${mapPriorityToBadge(task.priority)}`}>
                      {task.priority}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No upcoming deadlines</div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section className="card recent-activity">
          <div className="card-heading">Recent Activity</div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-left">
                    <span className="activity-dot" />
                    <div className="activity-content">
                      <div>
                        <strong>{activity.user}</strong>{" "}
                        {activity.type === "comment" ? (
                          <>
                            {activity.category && (
                              <span className="activity-category">
                                {activity.category}
                              </span>
                            )}{" "}
                            on <strong>{activity.target}</strong>
                          </>
                        ) : (
                          <>
                            {activity.action} <strong>{activity.target}</strong>
                            {activity.category && (
                              <span className="activity-status">
                                {" "}
                                ({activity.category})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="muted">{formatTimeAgo(activity.timestamp)}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent activity</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
