package com.taskmanagement.service.impl;

import com.taskmanagement.dto.request.CreateCommentRequest;
import com.taskmanagement.dto.response.CommentDTO;
import com.taskmanagement.entity.ActivityLog;
import com.taskmanagement.entity.Comment;
import com.taskmanagement.repository.ActivityLogRepo;
import com.taskmanagement.repository.CommentRepo;
import com.taskmanagement.repository.TaskRepo;
import com.taskmanagement.repository.UserRepo;
import com.taskmanagement.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {

    private final CommentRepo commentRepository;
    private final TaskRepo taskRepository;
    private final UserRepo userRepository;
    private final ActivityLogRepo activityLogRepository;

    @Override
    public List<CommentDTO> getCommentsByTaskId(Integer taskId) {
        return commentRepository.findByTask_TaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentDTO createComment(CreateCommentRequest request) {
        Comment comment = new Comment();
        
        taskRepository.findById(request.getTaskId())
                .ifPresent(comment::setTask);
        
        userRepository.findById(request.getUserId())
                .ifPresent(comment::setUser);
        
        comment.setParentCommentId(request.getParentCommentId());
        comment.setText(request.getText());
        comment.setCategory(request.getCategory());
        
        Comment saved = commentRepository.save(comment);
        
        // Create activity log for the comment
        if (saved.getTask() != null && saved.getUser() != null) {
            ActivityLog activityLog = new ActivityLog();
            activityLog.setTask(saved.getTask());
            activityLog.setUser(saved.getUser());
            activityLog.setActionType(ActivityLog.ActionType.UPDATED); // Using UPDATED as comment action
            activityLog.setDescription("Commented on " + saved.getTask().getTitle());
            activityLog.setNewValue(saved.getCategory() != null ? saved.getCategory() : "Commented");
            activityLogRepository.save(activityLog);
        }
        
        return convertToDTO(saved);
    }

    private CommentDTO convertToDTO(Comment comment) {
        return CommentDTO.builder()
                .commentId(comment.getCommentId())
                .taskId(comment.getTask().getTaskId())
                .userId(comment.getUser().getUserId())
                .username(comment.getUser().getUsername())
                .userFullName(comment.getUser().getFullName())
                .parentCommentId(comment.getParentCommentId())
                .text(comment.getText())
                .category(comment.getCategory())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}

