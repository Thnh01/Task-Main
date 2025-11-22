package com.taskmanagement.controller;

import com.taskmanagement.dto.request.CreateCommentRequest;
import com.taskmanagement.dto.response.CommentDTO;
import com.taskmanagement.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/task/{taskId}")
    public List<CommentDTO> getCommentsByTaskId(@PathVariable Integer taskId) {
        return commentService.getCommentsByTaskId(taskId);
    }

    @PostMapping
    public ResponseEntity<CommentDTO> createComment(@RequestBody CreateCommentRequest request) {
        CommentDTO created = commentService.createComment(request);
        return ResponseEntity.ok(created);
    }
}

