package com.taskmanagement.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateTaskRequest {
    private String title;
    private String description;
    private String status = "PENDING";
    private String priority = "MEDIUM";
    private LocalDate startDate;
    private LocalDate dueDate;
    private Integer categoryId;
    private Integer createdById;
}