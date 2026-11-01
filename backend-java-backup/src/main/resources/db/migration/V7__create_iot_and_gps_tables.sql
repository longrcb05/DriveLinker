
DROP TABLE IF EXISTS Devices;
CREATE TABLE Devices (
    DeviceID SERIAL PRIMARY KEY,
    OrganizationID INT NOT NULL,
    VehicleID INT NULL, -- Có thể chưa gán vào xe
    DeviceCode VARCHAR(50) UNIQUE NOT NULL,
    DeviceType VARCHAR(20) NOT NULL, -- GPS, AI_CAMERA
    SecretHash VARCHAR(255) NOT NULL, -- Băm mật khẩu của thiết bị
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    LastSeenAt TIMESTAMP NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);
DROP TABLE IF EXISTS GpsLogs CASCADE;

CREATE TABLE GpsLogs (
    LogID BIGSERIAL PRIMARY KEY,
    EventID VARCHAR(50) UNIQUE NOT NULL, -- Mã UUID chống gửi trùng dữ liệu
    VehicleID INT NOT NULL,
    MonitoringSessionID BIGINT NOT NULL,
    Latitude DOUBLE PRECISION NOT NULL,
    Longitude DOUBLE PRECISION NOT NULL,
    Speed DOUBLE PRECISION DEFAULT 0,
    RecordedAt TIMESTAMP NOT NULL, -- Giờ ghi nhận trên mạch GPS
    ReceivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Giờ server nhận được
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (MonitoringSessionID) REFERENCES MonitoringSessions(SessionID)
);

CREATE INDEX IX_GpsLogs_Vehicle_Time ON GpsLogs (VehicleID, RecordedAt);