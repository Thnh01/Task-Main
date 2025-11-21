package com.taskmanagement.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private Integer categoryId;
}