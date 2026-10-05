CREATE TABLE GpsLogs (
    LogID BIGSERIAL PRIMARY KEY,
    VehicleID INT NOT NULL,
    Latitude DECIMAL(10, 7) NOT NULL,
    Longitude DECIMAL(10, 7) NOT NULL,
    Speed DECIMAL(5, 2) NOT NULL,
    RecordedAt TIMESTAMP NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);

CREATE INDEX IX_GpsLogs_Vehicle_RecordedAt 
ON GpsLogs (VehicleID, RecordedAt DESC);