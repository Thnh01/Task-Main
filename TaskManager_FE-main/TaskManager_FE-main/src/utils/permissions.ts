import type { IUser, ITask } from "./interfaces";
import { MOCK_ASSIGNMENTS } from "./mockdata";

/**
 * Check if user is admin
 */
export const isAdmin = (user: IUser | null): boolean => {
  return user?.role === "admin";
};

/**
 * Check if user is employee
 */
export const isEmployee = (user: IUser | null): boolean => {
  return user?.role === "employee";
};

/**
 * Check if user can create tasks
 */
export const canCreateTask = (user: IUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can edit a task
 */
export const canEditTask = (user: IUser | null, _task: ITask): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can delete a task (soft delete)
 */
export const canDeleteTask = (user: IUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can view a task
 */
export const canViewTask = (user: IUser | null): boolean => {
  return user !== null; // Both admin and employee can view all tasks
};

/**
 * Check if user can update task status
 */
export const canUpdateTaskStatus = (
  user: IUser | null,
  task: ITask
): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true; // Admin can update any task status

  // Employee can only update status of tasks assigned to them
  if (isEmployee(user)) {
    // Use task.assignee_ids from backend instead of MOCK_ASSIGNMENTS
    if (task.assignee_ids && task.assignee_ids.length > 0) {
      return task.assignee_ids.includes(user.user_id);
    }
    // Fallback to MOCK_ASSIGNMENTS for backward compatibility (if assignee_ids is not available)
    const taskAssignments = MOCK_ASSIGNMENTS.filter(
      (a) => a.task_id === task.task_id
    );
    return taskAssignments.some((a) => a.user_id === user.user_id);
  }

  return false;
};

/**
 * Check if user can add comments to a task
 */
export const canAddComment = (user: IUser | null): boolean => {
  return user !== null; // Both admin and employee can add comments
};

/**
 * Check if user can assign employees to tasks
 */
export const canAssignEmployees = (user: IUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can manage team (activate/disable members)
 */
export const canManageTeam = (user: IUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user is assigned to a task
 */
export const isAssignedToTask = (user: IUser | null, task: ITask): boolean => {
  if (!user) return false;
  // Use task.assignee_ids from backend instead of MOCK_ASSIGNMENTS
  if (task.assignee_ids && task.assignee_ids.length > 0) {
    return task.assignee_ids.includes(user.user_id);
  }
  // Fallback to MOCK_ASSIGNMENTS for backward compatibility
  return MOCK_ASSIGNMENTS.some(
    (a) => a.task_id === task.task_id && a.user_id === user.user_id
  );
};

