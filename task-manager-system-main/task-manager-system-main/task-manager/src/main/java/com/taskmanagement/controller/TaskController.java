package com.taskmanagement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taskmanagement.dto.request.CreateTaskRequest;
import com.taskmanagement.dto.request.UpdateTaskRequest;
import com.taskmanagement.dto.response.TaskDTO;
import com.taskmanagement.dto.response.TaskSimpleDTO;
import com.taskmanagement.service.TaskService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class TaskController {

    private final TaskService taskService;

    // Get all active tasks (for Kanban board)
    @GetMapping("/tasks")
    public List<TaskSimpleDTO> getAllTasks() {
        return taskService.getAllActiveTasks();
    }

    // Get single task with full details
    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Integer id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create new task
    @PostMapping("/tasks")
    public ResponseEntity<TaskDTO> createTask(@RequestBody CreateTaskRequest request) {
        TaskDTO savedTask = taskService.createTask(request);
        return ResponseEntity.ok(savedTask);
    }

    // Update task
    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Integer id,
                                              @RequestBody UpdateTaskRequest request) {
        return taskService.updateTask(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Soft delete task (move to trash)
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id) {
        boolean deleted = taskService.softDeleteTask(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    // Get tasks in trash
    @GetMapping("/trash")
    public List<TaskSimpleDTO> getDeletedTasks() {
        return taskService.getDeletedTasks();
    }

    // Restore task from trash
    @PutMapping("/tasks/{id}/restore")
    public ResponseEntity<TaskDTO> restoreTask(@PathVariable Integer id) {
        return taskService.restoreTask(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get tasks by status (for dashboard statistics)
    @GetMapping("/tasks/by-status/{status}")
    public List<TaskSimpleDTO> getTasksByStatus(@PathVariable String status) {
        return taskService.getTasksByStatus(status);
    }

}

