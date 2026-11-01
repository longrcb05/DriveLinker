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

    private void validateLicensePlate(String licensePlate, String vehicleType) {
        if (licensePlate == null || licensePlate.length() < 8 || licensePlate.length() > 10) {
            throw new RuntimeException("Biển số xe không hợp lệ về độ dài (phải từ 8 - 10 ký tự)!");
        }
        if (!Character.isDigit(licensePlate.charAt(0)) || !Character.isDigit(licensePlate.charAt(1))) {
            throw new RuntimeException("Biển số xe phải bắt đầu bằng 2 chữ số mã tỉnh!");
        }

        if ("CAR".equalsIgnoreCase(vehicleType) || "TRUCK".equalsIgnoreCase(vehicleType)) {
            // Mẫu Ô TÔ: 43A-12345 (length 9) hoặc 43A-1234 (length 8)
            if (!Character.isLetter(licensePlate.charAt(2))) {
                throw new RuntimeException("Biển số Ô tô/Tải: Ký tự thứ 3 phải là chữ cái in hoa (VD: 43A-12345)");
            }
            if (licensePlate.charAt(3) != '-') {
                throw new RuntimeException("Biển số Ô tô/Tải: Phải có dấu gạch ngang sau phần chữ (VD: 43A-12345)");
            }
            for (int i = 4; i < licensePlate.length(); i++) {
                if (!Character.isDigit(licensePlate.charAt(i))) {
                    throw new RuntimeException("Phần đuôi của biển số Ô tô/Tải chỉ được chứa số!");
                }
            }
        } else if ("MOTORCYCLE".equalsIgnoreCase(vehicleType)) {
            // Mẫu XE MÁY: 43H1-34615 (length 10) hoặc 43H1-1234 (length 9)
            if (!Character.isLetter(licensePlate.charAt(2))) {
                throw new RuntimeException("Biển số Xe máy: Ký tự thứ 3 phải là chữ cái (VD: 43H1-34615)");
            }
            if (!Character.isLetterOrDigit(licensePlate.charAt(3))) {
                throw new RuntimeException("Biển số Xe máy: Ký tự thứ 4 phải là số hoặc chữ (VD: 43H1-34615)");
            }
            if (licensePlate.charAt(4) != '-') {
                throw new RuntimeException("Biển số Xe máy: Phải có dấu gạch ngang sau mã vùng (VD: 43H1-34615)");
            }
            for (int i = 5; i < licensePlate.length(); i++) {
                if (!Character.isDigit(licensePlate.charAt(i))) {
                    throw new RuntimeException("Phần đuôi của biển số Xe máy chỉ được chứa số!");
                }
            }
        } else {
            throw new RuntimeException("Loại xe (vehicleType) phải là CAR, TRUCK hoặc MOTORCYCLE");
        }
    }

    public VehicleResponse createVehicle(VehicleRequest request, Organization organization) {
        validateLicensePlate(request.getLicensePlate(), request.getVehicleType());

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

    public List<VehicleResponse> getAllVehicle(Integer orgId) {
        List<Vehicle> listfromDB = vehicleRespository.findAllByOrganizationId(orgId);
        List<VehicleResponse> listRespose = new ArrayList<>();
        for (Vehicle v : listfromDB) {
            listRespose.add(new VehicleResponse(v));
        }
        return listRespose;
    }
}
