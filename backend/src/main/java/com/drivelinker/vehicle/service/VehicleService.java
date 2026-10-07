package com.drivelinker.vehicle.service;

import com.drivelinker.vehicle.dto.VehicleRequest;
import com.drivelinker.vehicle.dto.VehicleResponse;
import com.drivelinker.vehicle.entity.Vehicle;
import com.drivelinker.vehicle.repository.VehicleRepository;
import com.drivelinker.organization.entity.Organization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service chứa logic nghiệp vụ quản lý Phương tiện.
 */
@Service
public class VehicleService {
    private VehicleRepository vehicleRespository;

    @Autowired
    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRespository = vehicleRepository;
    }

    public VehicleResponse createVehicle(VehicleRequest request, Organization organization) {
        Optional<Vehicle> existingVehicle = vehicleRespository.findByLicensePlate(request.getLicensePlate());
        if (existingVehicle.isPresent()) {
            throw new RuntimeException("Biển số xe này đã tồn tại trong hệ thống!");
        }
        Vehicle newVehicle = new Vehicle();
        newVehicle.setLicensePlate(request.getLicensePlate());
        newVehicle.setVehicleType(request.getVehicleType());
        newVehicle.setBrand(request.getBrand());
        newVehicle.setModel(request.getModel());
        newVehicle.setOrganization(organization);

        Vehicle savedVehicle = vehicleRespository.save(newVehicle);
        return new VehicleResponse(savedVehicle);
    }

    public List<VehicleResponse> getAllVehicle() {
        List<Vehicle> listfromDB = vehicleRespository.findAll();
        List<VehicleResponse> listRespose = new ArrayList<>();
        for (Vehicle v : listfromDB) {
            listRespose.add(new VehicleResponse(v));
        }
        return listRespose;
    }
}
