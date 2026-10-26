import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './UI/DashboardLayout';

// Import toàn bộ các file trong thư mục render
import Login from './render/Login';
import Overview from './render/Overview';
import Settings from './render/Settings';
import TenantManager from './render/TenantManager';
import FleetVehicles from './render/FleetVehicles';
import LiveTracking from './render/LiveTracking';
import Alerts from './render/Alerts';
import Analytics from './render/Analytics';
import SystemLogs from './render/SystemLogs';
import ContractManagement from './render/ContractManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/portal/login" replace />} />
        <Route path="/portal/login" element={<Login />} />

        {/* CỔNG THÔNG TIN HỢP NHẤT (UNIFIED PORTAL) */}
        <Route element={<DashboardLayout />}>

          {/* Nhóm chức năng dùng chung */}
          <Route path="/overview" element={<Overview />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/vehicles" element={<FleetVehicles />} />
          <Route path="/tracking" element={<LiveTracking />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />

          {/* Route dành cho phần Đối tác & Hợp đồng (Partners & Leases) */}
          <Route path="/partners" element={<ContractManagement />} />

          {/* Nhóm chức năng ĐẶC QUYỀN của System Admin */}
          <Route path="/sysadmin/tenants" element={<TenantManager />} />
          <Route path="/sysadmin/logs" element={<SystemLogs />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}