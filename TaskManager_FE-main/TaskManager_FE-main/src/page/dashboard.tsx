import React, { useMemo } from "react";
import Sidebar from "../common/sidebar";
import "./dashboard.css";
import { MOCK_TASKS, MOCK_COMMENTS, MOCK_USERS } from "../utils/mockdata";

interface ActivityItem {
  id: number;
  type: 'comment' | 'status_change';
  user: string;
  action: string;
  target: string;
  timestamp: string;
  category?: string;
}

const Dashboard: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCompleted = MOCK_TASKS.filter((t) => t.status === "completed" && !t.is_trashed).length;
    const dueToday = MOCK_TASKS.filter((t) => t.due_date === today && !t.is_trashed).length;
    const overdue = MOCK_TASKS.filter(
      (t) => t.due_date < today && t.status !== "completed" && !t.is_trashed
    ).length;

    return { totalCompleted, dueToday, overdue };
  }, []);

  // Priority counts (Low, Medium, High - treating urgent as high)
  const priorityCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    MOCK_TASKS.filter(t => !t.is_trashed).forEach((t) => {
      const p = (t.priority || "low").toLowerCase();
      if (p === "urgent" || p === "high") {
        counts.high++;
      } else if (p === "medium") {
        counts.medium++;
      } else {
        counts.low++;
      }
    });
    return counts;
  }, []);

  // Upcoming deadlines (next 5 tasks by due date)
  const upcomingDeadlines = useMemo(() => {
    return [...MOCK_TASKS]
      .filter((t) => !t.is_trashed && t.status !== "completed")
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
  }, []);

  // Recent activity (comments and status changes)
  const recentActivity = useMemo(() => {
    const activities: ActivityItem[] = [];

    // Add comments as activities
    const recentComments = [...MOCK_COMMENTS]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    recentComments.forEach((comment) => {
      const user = MOCK_USERS.find((u) => u.user_id === comment.user_id);
      const task = MOCK_TASKS.find((t) => t.task_id === comment.task_id);
      if (user && task) {
        activities.push({
          id: comment.comment_id,
          type: 'comment',
          user: user.full_name,
          action: comment.category || 'commented',
          target: task.title,
          timestamp: comment.created_at,
          category: comment.category,
        });
      }
    });

    // Add status changes (using updated_at as proxy for status changes)
    const statusChanges = [...MOCK_TASKS]
      .filter((t) => !t.is_trashed)
      .map((task) => {
        // Find user who might have updated this task (simplified - in real app would track actual updater)
        const taskUser = MOCK_USERS[0]; // Simplified: use first user as example
        return {
          id: task.task_id + 10000,
          type: 'status_change' as const,
          user: taskUser?.full_name || 'System',
          action: 'updated status to',
          target: task.title,
          timestamp: task.updated_at,
          category: task.status,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    activities.push(...statusChanges);

    // Sort all activities by timestamp
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, []);

  // Chart data for bar chart
  const chartData = useMemo(() => [
    { label: 'Low', value: priorityCounts.low, color: '#2ecc71' },
    { label: 'Medium', value: priorityCounts.medium, color: '#ff9800' },
    { label: 'High', value: priorityCounts.high, color: '#f44336' },
  ], [priorityCounts]);

  const maxValue = useMemo(() => 
    Math.max(...chartData.map(d => d.value), 1),
    [chartData]
  );

  const formatDate = (dateString: string) => {
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

    // Handle negative time (future dates) - show as "just now" or the date
    if (diffMs < 0) {
      return "just now";
    }

    // Less than 1 minute
    if (diffMins < 1) {
      return "just now";
    }

    // Less than 1 hour - show minutes
    if (diffMins < 60) {
      return `${diffMins}${diffMins === 1 ? ' minute' : ' minutes'} ago`;
    }

    // Less than 24 hours - show hours
    if (diffHours < 24) {
      return `${diffHours}${diffHours === 1 ? ' hour' : ' hours'} ago`;
    }

    // Less than 7 days - show days
    if (diffDays < 7) {
      return `${diffDays}${diffDays === 1 ? ' day' : ' days'} ago`;
    }

    // Less than 30 days - show weeks
    if (diffDays < 30) {
      return `${diffWeeks}${diffWeeks === 1 ? ' week' : ' weeks'} ago`;
    }

    // Less than 365 days - show months
    if (diffDays < 365) {
      return `${diffMonths}${diffMonths === 1 ? ' month' : ' months'} ago`;
    }

    // More than a year - show years or the date
    if (diffYears >= 1) {
      return `${diffYears}${diffYears === 1 ? ' year' : ' years'} ago`;
    }

    // Fallback to formatted date
    return formatDate(dateString);
  };

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
                  <div key={task.task_id} className="upcoming-item">
                    <div>
                      <div className="upcoming-title">{task.title}</div>
                      <div className="upcoming-date">{formatDate(task.due_date)}</div>
                    </div>
                    <div className={`badge ${task.priority}`}>{task.priority}</div>
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
                        {activity.type === 'comment' ? (
                          <>
                            {activity.category && (
                              <span className="activity-category">{activity.category}</span>
                            )}{" "}
                            on <strong>{activity.target}</strong>
                          </>
                        ) : (
                          <>
                            {activity.action} <strong>{activity.target}</strong>
                            {activity.category && (
                              <span className="activity-status"> ({activity.category})</span>
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
