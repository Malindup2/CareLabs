package com.carelabs.authservice.controller;

import com.carelabs.authservice.dto.UserDto;
import com.carelabs.authservice.model.Role;
import com.carelabs.authservice.service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auth/admin")
public class AdminController {

    private final AdminUserService adminUserService;

    public AdminController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable UUID id, @RequestParam Role role) {
        return ResponseEntity.ok(adminUserService.updateUserRole(id, role));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/doctors/{id}/verify")
    public ResponseEntity<UserDto> verifyDoctor(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.verifyDoctor(id));
    }
}
