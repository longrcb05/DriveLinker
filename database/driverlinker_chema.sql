CREATE DATABASE DriveLinkerDB;
GO

USE DriveLinkerDB;
GO

-- ===================================================================
-- 1. BẢNG PHÂN QUYỀN VÀ TÀI KHOẢN (ROLES & USERS)
-- ===================================================================
-- Bảng Roles: Phân quyền hệ thống 
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);
GO

-- Bảng Users: Quản lý tài khoản đăng nhập hệ thống
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, PENDING, SUSPENDED, DELETED
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

-- ===================================================================
-- 2. BẢNG TÍNH NĂNG ADMIN (CẤU HÌNH & LƯU VẾT)
-- ===================================================================
-- Bảng SystemConfigurations: Lưu trữ cấu hình động của hệ thống
CREATE TABLE SystemConfigurations (
    ConfigKey VARCHAR(50) PRIMARY KEY, 
    ConfigValue VARCHAR(255) NOT NULL,
    Description NVARCHAR(500),
    LastUpdatedBy INT, 
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (LastUpdatedBy) REFERENCES Users(UserID)
);
GO

-- Bảng SystemAuditLogs: Lưu vết toàn bộ thao tác hệ thống (Audit Trail)
CREATE TABLE SystemAuditLogs (
    AuditID BIGINT IDENTITY(1,1) PRIMARY KEY,
    PerformedByUserID INT NOT NULL,  
    ActionType VARCHAR(50) NOT NULL, -- VD: APPROVE_USER, SUSPEND_USER, UPDATE_CONFIG
    TargetTable VARCHAR(50) NOT NULL,
    TargetRecordID VARCHAR(50),      
    OldValues NVARCHAR(MAX),         
    NewValues NVARCHAR(MAX),         
    Notes NVARCHAR(500),             
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PerformedByUserID) REFERENCES Users(UserID)
);
GO

-- Tạo Index để tối ưu tìm kiếm lịch sử thao tác theo người dùng
CREATE NONCLUSTERED INDEX IX_SystemAuditLogs_PerformedBy 
ON SystemAuditLogs (PerformedByUserID, CreatedAt DESC);
GO

-- ===================================================================
-- 3. BẢNG NGHIỆP VỤ THUÊ XE (CUSTOMERS, VEHICLES, RENTAL CONTRACTS)
-- ===================================================================
-- Bảng Customers: Hồ sơ khách hàng thuê xe
CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL UNIQUE,
    IDCardNumber VARCHAR(20) NOT NULL UNIQUE, 
    DrivingLicense VARCHAR(50),
    Address NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Bảng Vehicles: Quản lý danh sách xe và thiết bị phần cứng
CREATE TABLE Vehicles (
    VehicleID INT IDENTITY(1,1) PRIMARY KEY,
    LicensePlate VARCHAR(20) NOT NULL UNIQUE,
    VehicleType NVARCHAR(50),
    Brand NVARCHAR(50),
    Model NVARCHAR(50),
    GpsDeviceID VARCHAR(100) UNIQUE,
    CameraDeviceID VARCHAR(100) UNIQUE,
    Status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, RUNNING, STOPPED, WARNING, MAINTENANCE
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Bảng RentalContracts: Quản lý vòng đời hợp đồng thuê xe
CREATE TABLE RentalContracts (
    ContractID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    VehicleID INT NOT NULL,
    CreatedByStaffID INT NOT NULL,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    ActualReturnTime DATETIME NULL,
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    Notes NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (CreatedByStaffID) REFERENCES Users(UserID)
);
GO

-- ===================================================================
-- 4. BẢNG THEO DÕI VÀ AI (GPS LOGS & AI ALERTS)
-- ===================================================================
-- Bảng GpsLogs: Lưu trữ lịch sử tọa độ và vận tốc thời gian thực
CREATE TABLE GpsLogs (
    LogID BIGINT IDENTITY(1,1) PRIMARY KEY,
    VehicleID INT NOT NULL,
    Latitude DECIMAL(10, 7) NOT NULL,
    Longitude DECIMAL(10, 7) NOT NULL,
    Speed DECIMAL(5, 2) NOT NULL,
    RecordedAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);
GO

-- Tạo Index để tối ưu hóa truy vấn lịch sử hành trình
CREATE NONCLUSTERED INDEX IX_GpsLogs_Vehicle_RecordedAt 
ON GpsLogs (VehicleID, RecordedAt DESC);
GO

-- Bảng AiAlerts: Lịch sử cảnh báo buồn ngủ từ module Edge-AI
CREATE TABLE AiAlerts (
    AlertID BIGINT IDENTITY(1,1) PRIMARY KEY,
    VehicleID INT NOT NULL,
    AlertType VARCHAR(50) NOT NULL, 
    SeverityLevel VARCHAR(20) NOT NULL, 
    DrowsinessScore INT CHECK (DrowsinessScore >= 0 AND DrowsinessScore <= 100), 
    EyeStatus VARCHAR(20),
    HeadPoseStatus VARCHAR(50),
    ResolutionStatus VARCHAR(20) DEFAULT 'Processing', -- Processing, Resolved, Cancelled
    CreatedAt DATETIME NOT NULL,
    ResolvedAt DATETIME NULL,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);
GO

-- Tạo Index để truy xuất nhanh các cảnh báo đang ở trạng thái nguy hiểm
CREATE NONCLUSTERED INDEX IX_AiAlerts_Vehicle_Resolution 
ON AiAlerts (VehicleID, ResolutionStatus, CreatedAt DESC);
GO

-- ===================================================================
-- 5. CHÈN DỮ LIỆU MẪU KHỞI TẠO (SEED DATA)
-- ===================================================================
-- 5.1. Khởi tạo Roles
INSERT INTO Roles (RoleName) VALUES ('ADMIN'), ('STAFF');
GO

-- 5.2. Khởi tạo tài khoản Admin
INSERT INTO Users (RoleID, Username, PasswordHash, FullName, Phone, Email, Status)
VALUES (1, 'admin', 'admin123', N'Quản trị viên hệ thống', '0886557205', 'longrcb01@gmail.com', 'ACTIVE');
GO

-- 5.3. Khởi tạo các cấu hình hệ thống mặc định (Gắn với Admin vừa tạo có UserID = 1)
INSERT INTO SystemConfigurations (ConfigKey, ConfigValue, Description, LastUpdatedBy)
VALUES 
('AI_CAMERA_INTERVAL_SEC', '3', N'Chu kỳ chụp ảnh của camera AI trên xe (giây)', 1),
('AI_DROWSINESS_THRESHOLD', '75', N'Ngưỡng điểm buồn ngủ để kích hoạt cảnh báo nguy hiểm (0-100)', 1),
('GPS_SYNC_INTERVAL_SEC', '30', N'Thời gian gom lô (batch) và đồng bộ GPS về server (giây)', 1),
('MAX_RENTAL_DAYS', '30', N'Số ngày thuê xe tối đa cho một hợp đồng', 1);
GO