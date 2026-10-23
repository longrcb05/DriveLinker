import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    // Lấy quyền của người dùng hiện tại
    const userRole = localStorage.getItem('userRole');

    // Nếu không có quyền hoặc quyền không nằm trong danh sách được phép truy cập
    if (!userRole || !allowedRoles.includes(userRole)) {
        console.warn(`Truy cập bị từ chối. Quyền hiện tại: ${userRole}`);
        // Đá người dùng về trang mặc định an toàn nhất
        return <Navigate to="/overview" replace />;
    }

    // Nếu hợp lệ, cho phép render các trang con bên trong
    return <Outlet />;
}