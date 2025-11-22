package com.taskmanagement.controller;

import com.taskmanagement.dto.response.ActivityLogDTO;
import com.taskmanagement.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/recent")
    public List<ActivityLogDTO> getRecentActivities(
            @RequestParam(defaultValue = "10") int limit) {
        return activityLogService.getRecentActivities(limit);
    }

    @GetMapping("/task/{taskId}")
    public List<ActivityLogDTO> getActivitiesByTaskId(@PathVariable Integer taskId) {
        return activityLogService.getActivitiesByTaskId(taskId);
    }
}

