package com.carelabs.doctorservice.repository;

import com.carelabs.doctorservice.entity.DoctorLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorLeaveRepository extends JpaRepository<DoctorLeave, UUID> {
    List<DoctorLeave> findByDoctorId(UUID doctorId);
    Optional<DoctorLeave> findByDoctorIdAndLeaveDate(UUID doctorId, LocalDate leaveDate);
}
