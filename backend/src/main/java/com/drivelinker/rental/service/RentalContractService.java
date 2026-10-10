package com.drivelinker.rental.service;

import com.drivelinker.customer.entity.Customer;
import com.drivelinker.customer.repository.CustomerRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.rental.dto.RentalContractRequest;
import com.drivelinker.rental.dto.RentalContractResponse;
import com.drivelinker.rental.entity.RentalContract;
import com.drivelinker.rental.enums.ContractStatus;
import com.drivelinker.rental.repository.RentalContractRepository;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import com.drivelinker.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service chứa logic nghiệp vụ phức tạp về hợp đồng (tạo, duyệt, bàn giao, trả xe).
 */
@Service
public class RentalContractService {

    private final RentalContractRepository contractRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final MonitoringSessionRepository sessionRepository;

    public RentalContractService(RentalContractRepository contractRepository,
            CustomerRepository customerRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            MonitoringSessionRepository sessionRepository) {
        this.contractRepository = contractRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    public RentalContractResponse createContract(RentalContractRequest request, Integer staffId) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new RuntimeException("Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương tiện"));

        if (!"AVAILABLE".equals(vehicle.getStatus())) {
            throw new RuntimeException("Phương tiện không sẵn sàng cho thuê.");
        }

        List<RentalContract> activeContracts = contractRepository.findByVehicleIdAndStatus(vehicle.getId(),
                ContractStatus.ACTIVE.name());
        if (!activeContracts.isEmpty()) {
            throw new RuntimeException("Phương tiện này đang có hợp đồng ACTIVE (Đang được thuê).");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        RentalContract contract = new RentalContract(customer, vehicle, staff, request.getStartTime(),
                request.getEndTime(), customer.getOrganization(), request.getNotes());
        contract.setStatus(ContractStatus.DRAFT.name());

        RentalContract saved = contractRepository.save(contract);
        return mapToResponse(saved);
    }

    @Transactional
    public void confirmContract(Integer contractId) {
        RentalContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng"));

        if (!ContractStatus.DRAFT.name().equals(contract.getStatus())) {
            throw new RuntimeException("Chỉ có thể xác nhận hợp đồng ở trạng thái DRAFT.");
        }

        contract.setStatus(ContractStatus.CONFIRMED.name());
        contractRepository.save(contract);
    }

    @Transactional
    public void handoverVehicle(Integer contractId) {
        RentalContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng"));

        if (!ContractStatus.CONFIRMED.name().equals(contract.getStatus())) {
            throw new RuntimeException("Hợp đồng phải được CONFIRMED (xác nhận) mới có thể bàn giao xe.");
        }

        Vehicle vehicle = contract.getVehicle();
        if (!"AVAILABLE".equals(vehicle.getStatus())) {
            throw new RuntimeException("Phương tiện không sẵn sàng.");
        }

        // Cập nhật trạng thái hợp đồng & xe
        contract.setStatus(ContractStatus.ACTIVE.name());
        vehicle.setStatus("RENTED");

        // Sinh phiên giám sát mới
        MonitoringSession session = new MonitoringSession(contract, vehicle, LocalDateTime.now());
        session.setStatus(MonitoringStatus.ACTIVE.name());

        contractRepository.save(contract);
        vehicleRepository.save(vehicle);
        sessionRepository.save(session);
    }

    @Transactional
    public void returnVehicle(Integer contractId) {
        RentalContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng"));

        if (!ContractStatus.ACTIVE.name().equals(contract.getStatus())) {
            throw new RuntimeException("Hợp đồng chưa bàn giao (không ACTIVE) hoặc đã kết thúc.");
        }

        Vehicle vehicle = contract.getVehicle();

        // Đóng hợp đồng & giải phóng xe
        contract.setStatus(ContractStatus.COMPLETED.name());
        contract.setActualReturnTime(LocalDateTime.now());
        vehicle.setStatus("AVAILABLE");

        // Đóng phiên giám sát
        MonitoringSession session = sessionRepository
                .findByContractIdAndStatus(contract.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên giám sát ACTIVE cho hợp đồng này."));

        session.setStatus(MonitoringStatus.CLOSED.name());
        session.setEndedAt(LocalDateTime.now());

        contractRepository.save(contract);
        vehicleRepository.save(vehicle);
        sessionRepository.save(session);
    }

    private RentalContractResponse mapToResponse(RentalContract contract) {
        RentalContractResponse res = new RentalContractResponse();
        res.setId(contract.getId());
        res.setCustomerId(contract.getCustomer().getId());
        res.setVehicleId(contract.getVehicle().getId());
        res.setCreatedByStaffId(contract.getCreatedByStaff().getId());
        res.setStartTime(contract.getStartTime());
        res.setEndTime(contract.getEndTime());
        res.setActualReturnTime(contract.getActualReturnTime());
        res.setStatus(contract.getStatus());
        res.setNotes(contract.getNotes());
        res.setCreatedAt(contract.getCreatedAt());
        return res;
    }
}
