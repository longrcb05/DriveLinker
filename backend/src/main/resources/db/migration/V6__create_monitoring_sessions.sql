CREATE TABLE MonitoringSessions (
    SessionID BIGSERIAL PRIMARY KEY,
    ContractID INT NOT NULL,
    VehicleID INT NOT NULL,
    StartedAt TIMESTAMP NOT NULL,
    EndedAt TIMESTAMP NULL,
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (ContractID) REFERENCES RentalContracts(ContractID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);

CREATE INDEX IX_MonitoringSessions_Status ON MonitoringSessions (Status);
