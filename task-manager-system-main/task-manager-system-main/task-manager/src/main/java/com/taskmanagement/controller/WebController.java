package com.taskmanagement.controller;

import com.taskmanagement.entity.Task;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.TaskRepo;
import com.taskmanagement.repository.UserRepo;
import com.taskmanagement.repository.CategoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class WebController {

    private final TaskRepo taskRepository;
    private final UserRepo userRepository;
    private final CategoryRepo categoryRepository;
    private final PasswordEncoder passwordEncoder;

    // Existing GET mappings...
    @GetMapping("/")
    public String home(Model model) {
        List<Task> activeTasks = taskRepository.findAll().stream()
                .filter(task -> !task.isDeleted())
                .collect(Collectors.toList());

        model.addAttribute("tasks", activeTasks);
        model.addAttribute("users", userRepository.findAll());
        return "index";
    }

    @GetMapping("/tasks")
    public String tasks(Model model) {
        List<Task> activeTasks = taskRepository.findAll().stream()
                .filter(task -> !task.isDeleted())
                .collect(Collectors.toList());

        model.addAttribute("tasks", activeTasks);
        model.addAttribute("users", userRepository.findAll());
        model.addAttribute("categories", categoryRepository.findAll());
        return "tasks";
    }

    @GetMapping("/users")
    public String users(Model model) {
        model.addAttribute("users", userRepository.findAll());
        return "users";
    }

    // New POST mappings for creating data
    @PostMapping("/users/create")
    public String createUser(@ModelAttribute User user,
                             @RequestParam String password) {
        // Set password hash
        user.setPasswordHash(passwordEncoder.encode(password));
        // Set default status
        user.setStatus(User.UserStatus.ACTIVE);
        // Generate random color if not provided
        if (user.getAvatarColor() == null) {
            String[] colors = {"#5B8DEF", "#5ECFB1", "#F5A864", "#F56565"};
            user.setAvatarColor(colors[(int) (Math.random() * colors.length)]);
        }

        userRepository.save(user);
        return "redirect:/users";
    }

    @PostMapping("/tasks/create")
    public String createTask(@ModelAttribute Task task) {
        // Set deleted to false for new tasks
        task.setDeleted(false);

        taskRepository.save(task);
        return "redirect:/tasks";
    }

    @PostMapping("/tasks/update-status/{id}")
    public String updateTaskStatus(@PathVariable Integer id,
                                   @RequestParam String status) {
        taskRepository.findById(id).ifPresent(task -> {
            task.setStatus(Task.TaskStatus.valueOf(status));
            taskRepository.save(task);
        });
        return "redirect:/tasks";
    }

    @PostMapping("/tasks/update-priority/{id}")
    public String updateTaskPriority(@PathVariable Integer id,
                                     @RequestParam String priority) {
        taskRepository.findById(id).ifPresent(task -> {
            task.setPriority(Task.TaskPriority.valueOf(priority));
            taskRepository.save(task);
        });
        return "redirect:/tasks";
    }

    @PostMapping("/tasks/delete/{id}")
    public String deleteTask(@PathVariable Integer id) {
        taskRepository.findById(id).ifPresent(task -> {
            task.setDeleted(true);
            task.setDeletedAt(LocalDateTime.now());
            taskRepository.save(task);
        });
        return "redirect:/tasks";
    }

}