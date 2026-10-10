-- ===================================================================
-- TỔNG HỢP TOÀN BỘ CẤU TRÚC DATABASE (TỪ CÁC FILE MIGRATION V0 ĐẾN V9)
-- (File này được máy tự động gộp lại để sếp dễ xem cấu trúc hiện tại)
-- LƯU Ý: Database hiện tại là PostgreSQL.
-- ===================================================================

CREATE TABLE Roles (
    RoleID SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Organizations (
    OrganizationID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Address VARCHAR(255),
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    OrganizationID INT NOT NULL,
    RoleID INT NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID), 
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE SystemConfigurations (
    ConfigKey VARCHAR(50) PRIMARY KEY, 
    ConfigValue VARCHAR(255) NOT NULL,
    Description VARCHAR(500),
    LastUpdatedBy INT, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (LastUpdatedBy) REFERENCES Users(UserID)
);

CREATE TABLE SystemAuditLogs (
    AuditID BIGSERIAL PRIMARY KEY,
    PerformedByUserID INT NOT NULL,  
    ActionType VARCHAR(50) NOT NULL,
    TargetTable VARCHAR(50) NOT NULL,
    TargetRecordID VARCHAR(50),      
    OldValues TEXT,         
    NewValues TEXT,         
    Notes VARCHAR(500),             
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PerformedByUserID) REFERENCES Users(UserID)
);
CREATE INDEX IX_SystemAuditLogs_PerformedBy ON SystemAuditLogs (PerformedByUserID, CreatedAt DESC);

CREATE TABLE Customers (
    CustomerID SERIAL PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL UNIQUE,
    IDCardNumber VARCHAR(20) NOT NULL UNIQUE, 
    DrivingLicense VARCHAR(50),
    Address VARCHAR(255),
    OrganizationID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
);

CREATE TABLE Vehicles (
    VehicleID SERIAL PRIMARY KEY,
    LicensePlate VARCHAR(20) NOT NULL UNIQUE,
    VehicleType VARCHAR(50),
    Brand VARCHAR(50),
    Model VARCHAR(50),
    GpsDeviceID VARCHAR(100) UNIQUE,
    CameraDeviceID VARCHAR(100) UNIQUE,
    OrganizationID INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'AVAILABLE',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
);

CREATE TABLE RentalContracts (
    ContractID SERIAL PRIMARY KEY,
    CustomerID INT NOT NULL,
    VehicleID INT NOT NULL,
    CreatedByStaffID INT NOT NULL,
    StartTime TIMESTAMP NOT NULL,
    EndTime TIMESTAMP NOT NULL,
    ActualReturnTime TIMESTAMP NULL,
    OrganizationID INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    Notes VARCHAR(500),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (CreatedByStaffID) REFERENCES Users(UserID),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
);

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

CREATE TABLE Devices (
    DeviceID SERIAL PRIMARY KEY,
    OrganizationID INT NOT NULL,
    VehicleID INT NULL, 
    DeviceCode VARCHAR(50) UNIQUE NOT NULL,
    DeviceType VARCHAR(20) NOT NULL, 
    SecretHash VARCHAR(255) NOT NULL, 
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    LastSeenAt TIMESTAMP NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);

CREATE TABLE GpsLogs (
    LogID BIGSERIAL PRIMARY KEY,
    EventID VARCHAR(50) UNIQUE NOT NULL, 
    VehicleID INT NOT NULL,
    MonitoringSessionID BIGINT NOT NULL,
    Latitude DOUBLE PRECISION NOT NULL,
    Longitude DOUBLE PRECISION NOT NULL,
    Speed DOUBLE PRECISION DEFAULT 0,
    RecordedAt TIMESTAMP NOT NULL, 
    ReceivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (MonitoringSessionID) REFERENCES MonitoringSessions(SessionID)
);
CREATE INDEX IX_GpsLogs_Vehicle_Time ON GpsLogs (VehicleID, RecordedAt);

CREATE TABLE AiResults (
    ResultID BIGSERIAL PRIMARY KEY,
    EventID VARCHAR(50) UNIQUE NOT NULL,
    VehicleID INT NOT NULL,
    MonitoringSessionID BIGINT NOT NULL,
    DrowsinessScore INT CHECK (DrowsinessScore >= 0 AND DrowsinessScore <= 100),
    EyeStatus VARCHAR(20),
    HeadPoseStatus VARCHAR(50),
    OccurredAt TIMESTAMP NOT NULL,
    ReceivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (MonitoringSessionID) REFERENCES MonitoringSessions(SessionID)
);

CREATE TABLE Alerts (
    AlertID BIGSERIAL PRIMARY KEY,
    EventID VARCHAR(50) UNIQUE NOT NULL,
    OrganizationID INT NOT NULL,
    VehicleID INT NOT NULL,
    MonitoringSessionID BIGINT NOT NULL,
    AlertType VARCHAR(50) NOT NULL,
    SeverityLevel VARCHAR(20) NOT NULL,
    DrowsinessScore INT,
    Latitude DOUBLE PRECISION,
    Longitude DOUBLE PRECISION,
    ResolutionStatus VARCHAR(20) DEFAULT 'NEW',
    ResolvedBy INT NULL,
    ResolutionNote TEXT,
    OccurredAt TIMESTAMP NOT NULL,
    ReceivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ResolvedAt TIMESTAMP NULL,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (MonitoringSessionID) REFERENCES MonitoringSessions(SessionID),
    FOREIGN KEY (ResolvedBy) REFERENCES Users(UserID)
);

CREATE TABLE AlertActions (
    ActionID BIGSERIAL PRIMARY KEY,
    AlertID BIGINT NOT NULL,
    Action VARCHAR(50) NOT NULL,
    PerformedBy INT NOT NULL,
    Note TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AlertID) REFERENCES Alerts(AlertID),
    FOREIGN KEY (PerformedBy) REFERENCES Users(UserID)
);

CREATE TABLE AuditLogs (
    id BIGSERIAL PRIMARY KEY,
    OrganizationID INTEGER NOT NULL,
    UserID INTEGER,
    Action VARCHAR(255) NOT NULL,
    EntityType VARCHAR(100),
    EntityID VARCHAR(100),
    Metadata TEXT,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);