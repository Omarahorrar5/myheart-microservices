package com.myheart.patient.service;

import com.myheart.patient.model.Patient;
import com.myheart.patient.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository repo;

    public List<Patient> getAllPatients() { return repo.findAll(); }

    public Optional<Patient> getPatientById(Long id) { return repo.findById(id); }

    public Patient createPatient(Patient patient) { return repo.save(patient); }

    public Patient updatePatient(Long id, Patient updated) {
        return repo.findById(id).map(p -> {
            p.setFirstName(updated.getFirstName());
            p.setLastName(updated.getLastName());
            p.setEmail(updated.getEmail());
            p.setPhone(updated.getPhone());
            p.setDateOfBirth(updated.getDateOfBirth());
            p.setGender(updated.getGender());
            p.setAddress(updated.getAddress());
            p.setBloodType(updated.getBloodType());
            return repo.save(p);
        }).orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    public void deletePatient(Long id) { repo.deleteById(id); }
}
