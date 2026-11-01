import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import đúng đường dẫn dựa trên cấu trúc thư mục của bạn
import AdminLogin from '../render/admin/AdminLogin';
import AdminDashboard from '../render/admin/AdminDashboard';
import AdminLayout from '../UI/AdminLayout';

// Định nghĩa kiểu dữ liệu (Type) rõ ràng cho TypeScript
interface RequireAdminAuthProps {
    children: React.ReactNode;
}

// Middleware bảo vệ Route Admin
const RequireAdminAuth: React.FC<RequireAdminAuthProps> = ({ children }) => {
    const role = localStorage.getItem('sys_core_role');
    const location = useLocation();

    // Nếu không phải SUPER_ADMIN, đá văng ra trang Login Admin
    if (role !== 'SUPER_ADMIN') {
        return <Navigate to="/overview/admin/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
};

export default function AdminRouter() {
    return (
        <Routes>
            <Route path="/overview/admin/login" element={<AdminLogin />} />
            <Route
                path="/overview/admin"
                element={
                    <RequireAdminAuth>
                        <AdminLayout />
                    </RequireAdminAuth>
                }
            >
                <Route index element={<AdminDashboard />} />
            </Route>
        </Routes>
    );
}