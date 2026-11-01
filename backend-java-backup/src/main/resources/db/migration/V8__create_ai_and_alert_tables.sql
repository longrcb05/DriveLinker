DROP TABLE IF EXISTS AiAlerts CASCADE;

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