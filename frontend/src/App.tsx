import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './UI/DashboardLayout';

import Login from './render/Login';
import Overview from './render/Overview';
import Settings from './render/Settings';
import LiveTracking from './render/LiveTracking';
import Analytics from './render/Analytics';
import ContractManagement from './render/ContractManagement';
import CreateContract from './render/CreateContract';
import PriceApprovals from './render/PriceApprovals';
import FleetManagement from './render/FleetManagement';

import AdminLogin from './render/admin/AdminLogin';
import AdminTenantList from './render/admin/AdminTenantList';
import { LanguageProvider } from './context/LanguageContext';
import DialogProvider from './context/DialogContext';

// Middleware bảo vệ Core Admin - SỬ DỤNG SESSION_STORAGE ĐỂ BẢO MẬT TỐI ĐA
const RequireAdminAuth = ({ children }: { children: React.ReactNode }) => {
  const role = sessionStorage.getItem('sys_core_role');
  const location = useLocation();

  if (role !== 'SUPER_ADMIN') {
    return <Navigate to="/overview/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Middleware khóa quyền truy cập của Staff đối với Duyệt giá và Cài đặt
const RequireManagerAuth = ({ children }: { children: React.ReactNode }) => {
  const userRole = localStorage.getItem('userRole');
  const isAdminImpersonating = localStorage.getItem('isAdminImpersonating') === 'true';

  if (userRole === 'TENANT_STAFF' && !isAdminImpersonating) {
    return <Navigate to="/overview" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <LanguageProvider>
      <DialogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/portal/login" replace />} />
            <Route path="/portal/login" element={<Login />} />

            {/* CORE ADMIN LÕI */}
            <Route path="/overview/admin/login" element={<AdminLogin />} />
            <Route
              path="/overview/admin"
              element={
                <RequireAdminAuth>
                  <AdminTenantList />
                </RequireAdminAuth>
              }
            />

            {/* GIAO DIỆN DOANH NGHIỆP */}
            <Route element={<DashboardLayout />}>
              <Route path="/overview" element={<Overview />} />
              <Route path="/fleet" element={<FleetManagement />} />
              <Route path="/tracking" element={<LiveTracking />} />
              <Route path="/analytics" element={<Analytics />} />

              <Route path="/partners" element={<ContractManagement />} />
              <Route path="/create-contract" element={<CreateContract />} />

              {/* Khóa menu đối với Staff */}
              <Route
                path="/approvals"
                element={
                  <RequireManagerAuth>
                    <PriceApprovals />
                  </RequireManagerAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireManagerAuth>
                    <Settings />
                  </RequireManagerAuth>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </DialogProvider>
    </LanguageProvider>
  );
}
