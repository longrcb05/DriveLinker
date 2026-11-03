INSERT INTO Organizations (Name, Phone, Email, Address, Status) 
VALUES ('Công ty DriveLinker VN', '0886557205', 'contact@drivelinker.com', 'Hà Nội', 'ACTIVE');

INSERT INTO Roles (RoleName) VALUES ('ADMIN'), ('STAFF');

INSERT INTO Users (OrganizationID, RoleID, Username, PasswordHash, FullName, Phone, Email, Status)
VALUES (1, 1, 'admin', '$2a$10$DowzN7o.A49G56/39X5R5uI1c6gC9G441Uj0i.Oa03XQJ4H7lZOMa', 'Quản trị viên hệ thống', '0886557205', 'longrcb01@gmail.com', 'ACTIVE');

INSERT INTO SystemConfigurations (ConfigKey, ConfigValue, Description, LastUpdatedBy)
VALUES 
('AI_CAMERA_INTERVAL_SEC', '3', 'Chu kỳ chụp ảnh của camera AI trên xe (giây)', 1),
('AI_DROWSINESS_THRESHOLD', '75', 'Ngưỡng điểm buồn ngủ để kích hoạt cảnh báo nguy hiểm (0-100)', 1),
('GPS_SYNC_INTERVAL_SEC', '30', 'Thời gian gom lô (batch) và đồng bộ GPS về server (giây)', 1),
('MAX_RENTAL_DAYS', '30', 'Số ngày thuê xe tối đa cho một hợp đồng', 1);