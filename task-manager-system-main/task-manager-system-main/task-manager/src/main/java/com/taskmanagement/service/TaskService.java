package com.taskmanagement.service;

import com.taskmanagement.dto.CreateTaskRequest;
import com.taskmanagement.dto.TaskDTO;
import com.taskmanagement.dto.TaskSimpleDTO;
import com.taskmanagement.dto.UpdateTaskRequest;
import com.taskmanagement.entity.Task;
import com.taskmanagement.repository.CategoryRepo;
import com.taskmanagement.repository.TaskRepo;
import com.taskmanagement.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepo taskRepository;
    private final UserRepo userRepository;
    private final CategoryRepo categoryRepository;

    public List<TaskSimpleDTO> getAllActiveTasks() {
        return taskRepository.findAll().stream()
                .filter(task -> !task.isDeleted())
                .map(this::convertToSimpleDTO)
                .collect(Collectors.toList());
    }

    public Optional<TaskDTO> getTaskById(Integer id) {
        return taskRepository.findById(id).map(this::convertToFullDTO);
    }

    @Transactional
    public TaskDTO createTask(CreateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(Task.TaskStatus.valueOf(request.getStatus()));
        task.setPriority(Task.TaskPriority.valueOf(request.getPriority()));
        task.setStartDate(request.getStartDate());
        task.setDueDate(request.getDueDate());
        task.setDeleted(false);

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .ifPresent(task::setCategory);
        }

        userRepository.findById(request.getCreatedById())
                .ifPresent(task::setCreatedBy);

        return convertToFullDTO(taskRepository.save(task));
    }

    @Transactional
    public Optional<TaskDTO> updateTask(Integer id, UpdateTaskRequest request) {
        return taskRepository.findById(id)
                .map(task -> {
                    if (request.getTitle() != null) task.setTitle(request.getTitle());
                    if (request.getDescription() != null) task.setDescription(request.getDescription());
                    if (request.getStatus() != null) task.setStatus(Task.TaskStatus.valueOf(request.getStatus()));
                    if (request.getPriority() != null) task.setPriority(Task.TaskPriority.valueOf(request.getPriority()));
                    if (request.getStartDate() != null) task.setStartDate(request.getStartDate());
                    if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
                    return convertToFullDTO(taskRepository.save(task));
                });
    }

    @Transactional
    public boolean softDeleteTask(Integer id) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setDeleted(true);
                    task.setDeletedAt(LocalDateTime.now());
                    taskRepository.save(task);
                    return true;
                })
                .orElse(false);
    }

    public List<TaskSimpleDTO> getDeletedTasks() {
        return taskRepository.findAll().stream()
                .filter(Task::isDeleted)
                .map(this::convertToSimpleDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Optional<TaskDTO> restoreTask(Integer id) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setDeleted(false);
                    task.setDeletedAt(null);
                    return convertToFullDTO(taskRepository.save(task));
                });
    }

    public List<TaskSimpleDTO> getTasksByStatus(String status) {
        Task.TaskStatus taskStatus = Task.TaskStatus.valueOf(status.toUpperCase());
        return taskRepository.findAll().stream()
                .filter(task -> !task.isDeleted() && task.getStatus() == taskStatus)
                .map(this::convertToSimpleDTO)
                .collect(Collectors.toList());
    }

    private TaskSimpleDTO convertToSimpleDTO(Task task) {
        List<String> tagNames = task.getTags().stream()
                .map(tag -> tag.getName())
                .collect(Collectors.toList());
        List<Integer> assigneeIds = task.getTaskAssignments().stream()
                .map(assignment -> assignment.getUser().getUserId())
                .collect(Collectors.toList());
        List<String> assigneeNames = task.getTaskAssignments().stream()
                .map(assignment -> assignment.getUser().getFullName())
                .collect(Collectors.toList());

        return TaskSimpleDTO.builder()
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().toString())
                .priority(task.getPriority().toString())
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .categoryName(task.getCategory() != null ? task.getCategory().getName() : null)
                .createdByUsername(task.getCreatedBy() != null ? task.getCreatedBy().getUsername() : null)
                .assigneeCount(assigneeIds.size())
                .assigneeIds(assigneeIds)
                .assigneeNames(assigneeNames)
                .tags(tagNames)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private TaskDTO convertToFullDTO(Task task) {
        return TaskDTO.builder()
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().toString())
                .priority(task.getPriority().toString())
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .categoryName(task.getCategory() != null ? task.getCategory().getName() : null)
                .createdByUsername(task.getCreatedBy() != null ? task.getCreatedBy().getUsername() : null)
                .assignedUsers(task.getTaskAssignments().stream()
                        .map(assignment -> assignment.getUser().getFullName())
                        .collect(Collectors.toList()))
                .tags(task.getTags().stream()
                        .map(tag -> tag.getName())
                        .collect(Collectors.toList()))
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}

