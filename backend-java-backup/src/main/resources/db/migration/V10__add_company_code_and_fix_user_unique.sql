-- Thêm cột CompanyCode vào bảng Organizations
ALTER TABLE Organizations ADD COLUMN CompanyCode VARCHAR(50);

-- Cập nhật dữ liệu cũ để không bị lỗi NOT NULL
UPDATE Organizations SET CompanyCode = 'ORG_' || OrganizationID WHERE CompanyCode IS NULL;

-- Thiết lập lại ràng buộc NOT NULL và UNIQUE cho CompanyCode
ALTER TABLE Organizations ALTER COLUMN CompanyCode SET NOT NULL;
ALTER TABLE Organizations ADD CONSTRAINT UQ_Organizations_CompanyCode UNIQUE (CompanyCode);

-- Xóa ràng buộc duy nhất toàn cục của Username trong bảng Users
ALTER TABLE Users DROP CONSTRAINT users_username_key;

-- Thêm ràng buộc duy nhất mới (OrganizationID, Username)
ALTER TABLE Users ADD CONSTRAINT UQ_Users_Org_Username UNIQUE (OrganizationID, Username);
