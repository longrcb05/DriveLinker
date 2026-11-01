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

CREATE INDEX IX_SystemAuditLogs_PerformedBy 
ON SystemAuditLogs (PerformedByUserID, CreatedAt DESC);