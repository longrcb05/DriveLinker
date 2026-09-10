CREATE DATABASE DriveLinkerDB;
GO

USE DriveLinkerDB;
GO

-- 2. Bảng Roles: Phân quyền hệ thống 
-- Hỗ trợ phân quyền rõ ràng giữa Chủ xe (Admin/Owner) và Nhân viên (Staff)
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);
GO

-- 3. Bảng Users: Quản lý tài khoản đăng nhập hệ thống
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Status VARCHAR(20) DEFAULT 'ACTIVE',
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

-- 4. Bảng Customers: Hồ sơ khách hàng thuê xe
CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL UNIQUE,
    IDCardNumber VARCHAR(20) NOT NULL UNIQUE, -- CCCD/GPLX dùng để xác minh
    DrivingLicense VARCHAR(50),
    Address NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 5. Bảng Vehicles: Quản lý danh sách xe và thiết bị phần cứng
-- Liên kết trực tiếp ID của thiết bị GPS và Camera AI vào từng xe cụ thể
CREATE TABLE Vehicles (
    VehicleID INT IDENTITY(1,1) PRIMARY KEY,
    LicensePlate VARCHAR(20) NOT NULL UNIQUE,
    VehicleType NVARCHAR(50),
    Brand NVARCHAR(50),
    Model NVARCHAR(50),
    GpsDeviceID VARCHAR(100) UNIQUE,
    CameraDeviceID VARCHAR(100) UNIQUE,
    Status VARCHAR(20) DEFAULT 'AVAILABLE', -- Trạng thái tự động: AVAILABLE, RENTED, RUNNING, STOPPED, WARNING, MAINTENANCE
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 6. Bảng RentalContracts: Quản lý vòng đời hợp đồng thuê xe
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

-- 7. Bảng GpsLogs: Lưu trữ lịch sử tọa độ và vận tốc thời gian thực
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

-- Tạo Index để tối ưu hóa truy vấn lịch sử hành trình khi hệ thống có hàng ngàn xe
CREATE NONCLUSTERED INDEX IX_GpsLogs_Vehicle_RecordedAt 
ON GpsLogs (VehicleID, RecordedAt DESC);
GO

-- 8. Bảng AiAlerts: Lịch sử cảnh báo buồn ngủ từ module Edge-AI
CREATE TABLE AiAlerts (
    AlertID BIGINT IDENTITY(1,1) PRIMARY KEY,
    VehicleID INT NOT NULL,
    AlertType VARCHAR(50) NOT NULL, -- Ví dụ: Prolonged Eye Closure, Yawning, Head Dropping
    SeverityLevel VARCHAR(20) NOT NULL, -- Level 1 (Warning), Level 2 (Danger)
    DrowsinessScore INT CHECK (DrowsinessScore >= 0 AND DrowsinessScore <= 100), -- Điểm mệt mỏi từ 0-100
    EyeStatus VARCHAR(20),
    HeadPoseStatus VARCHAR(50),
    ResolutionStatus VARCHAR(20) DEFAULT 'Processing', -- Các trạng thái: Processing, Resolved, Cancelled
    CreatedAt DATETIME NOT NULL,
    ResolvedAt DATETIME NULL,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);
GO

-- Tạo Index để truy xuất nhanh các cảnh báo đang ở trạng thái nguy hiểm (chưa giải quyết)
CREATE NONCLUSTERED INDEX IX_AiAlerts_Vehicle_Resolution 
ON AiAlerts (VehicleID, ResolutionStatus, CreatedAt DESC);
GO

-- 9. DỮ LIỆU MẪU 
INSERT INTO Roles (RoleName) VALUES ('ADMIN'), ('STAFF');

-- Tạo sẵn tài khoản Admin (Mật khẩu: admin123)
INSERT INTO Users (RoleID, Username, PasswordHash, FullName, Phone, Email)
VALUES (1, 'admin', 'admin123', N'Quản trị viên hệ thống', '0886557205', 'longrcb01@gmail');
GO