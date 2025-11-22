package com.taskmanagement.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreateCommentRequest {
    @NotNull
    private Integer taskId;

    @NotNull
    private Integer userId;

    private Integer parentCommentId;

    @NotBlank
    private String text;

    private String category;
}

