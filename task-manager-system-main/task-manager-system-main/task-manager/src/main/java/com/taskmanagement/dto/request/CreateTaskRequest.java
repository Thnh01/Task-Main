package com.taskmanagement.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

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
    private List<Integer> assigneeIds;
}

