import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import Login from './render/Login';
import CompanyLogin from './render/CompanyLogin';
import DashboardLayout from './UI/DashboardLayout';
import Overview from './render/Overview';
import ContractManagement from './render/ContractManagement';
import CreateContract from './render/CreateContract';
import FleetVehicles from './render/FleetVehicles';
import LiveTracking from './render/LiveTracking';
import Analytics from './render/Analytics';
import Alerts from './render/Alerts';
import Settings from './render/Settings';

import SystemAdminLayout from './UI/SystemAdminLayout';
import TenantManager from './render/TenantManager';
import ProtectedRoute from './UI/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal/login" element={<CompanyLogin />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />

        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN', 'TENANT_STAFF']} />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/partners" element={<ContractManagement />} />
            <Route path="/partners/new" element={<CreateContract />} />
            <Route path="/vehicles" element={<FleetVehicles />} />
            <Route path="/tracking" element={<LiveTracking />} />
            <Route path="/alerts" element={<Alerts />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN']} />}>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['SYS_ADMIN']} />}>
          <Route path="/sysadmin" element={<SystemAdminLayout />}>
            <Route index element={<Navigate to="/sysadmin/tenants" replace />} />
            <Route path="tenants" element={<TenantManager />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}