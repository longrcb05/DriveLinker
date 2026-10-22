import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import Login from './render/Login';
import DashboardLayout from './UI/DashboardLayout';
import Overview from './render/Overview';
import ContractManagement from './render/ContractManagement';
import CreateContract from './render/CreateContract';
import FleetVehicles from './render/FleetVehicles';
import LiveTracking from './render/LiveTracking';
import Analytics from './render/Analytics';
import Alerts from './render/Alerts';
import Settings from './render/Settings';

// <--- MỚI THÊM: Import Layout và Page cho Super Admin
import SystemAdminLayout from './UI/SystemAdminLayout';
import TenantManager from './render/TenantManager';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            1. CÁC TRANG PUBLIC (Không cần Layout)
            ========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />

        {/* ==========================================
            2. KHÔNG GIAN KHÁCH HÀNG (Nhà xe / Đối tác)
            Sử dụng DashboardLayout (Menu xanh, logo DriveLinker...)
            ========================================== */}
        <Route element={<DashboardLayout />}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/partners" element={<ContractManagement />} />
          <Route path="/partners/new" element={<CreateContract />} />
          <Route path="/vehicles" element={<FleetVehicles />} />
          <Route path="/tracking" element={<LiveTracking />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* ==========================================
            3. KHÔNG GIAN SUPER ADMIN (Chủ phần mềm)
            Sử dụng SystemAdminLayout (Giao diện riêng biệt, màu tối/đỏ...)
            ========================================== */}
        <Route path="/sysadmin" element={<SystemAdminLayout />}>
          {/* Mặc định vào thẳng trang Quản lý Doanh nghiệp (Tenants) */}
          <Route index element={<Navigate to="/sysadmin/tenants" replace />} />
          <Route path="tenants" element={<TenantManager />} />
          {/* Tương lai thêm: <Route path="billing" element={<BillingManager />} /> */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}