package com.carelabs.patientservice.entity;

import com.carelabs.patientservice.enums.AllergySeverity;
import com.carelabs.patientservice.enums.AllergyType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patient_allergies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PatientAllergy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID patientId;

    @Column(nullable = false)
    private String allergen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AllergyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AllergySeverity severity;

    private String reaction;
}
