CREATE TABLE AiAlerts (
    AlertID BIGSERIAL PRIMARY KEY,
    VehicleID INT NOT NULL,
    AlertType VARCHAR(50) NOT NULL, 
    SeverityLevel VARCHAR(20) NOT NULL, 
    DrowsinessScore INT CHECK (DrowsinessScore >= 0 AND DrowsinessScore <= 100), 
    EyeStatus VARCHAR(20),
    HeadPoseStatus VARCHAR(50),
    ResolutionStatus VARCHAR(20) DEFAULT 'Processing',
    CreatedAt TIMESTAMP NOT NULL,
    ResolvedAt TIMESTAMP NULL,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);

CREATE INDEX IX_AiAlerts_Vehicle_Resolution 
ON AiAlerts (VehicleID, ResolutionStatus, CreatedAt DESC);