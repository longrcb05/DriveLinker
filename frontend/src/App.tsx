import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import Login from './render/Login';
import DashboardLayout from './UI/DashboardLayout';
import Overview from './render/Overview';
import ContractManagement from './render/ContractManagement';
import CreateContract from './render/CreateContract'; // <--- MỚI THÊM: Import component
import FleetVehicles from './render/FleetVehicles';
import LiveTracking from './render/LiveTracking';
import Analytics from './render/Analytics';
import Alerts from './render/Alerts';
import Settings from './render/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />

        <Route element={<DashboardLayout />}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/partners" element={<ContractManagement />} />

          {/* <--- MỚI THÊM: Đăng ký router hiển thị giao diện tạo hợp đồng */}
          <Route path="/partners/new" element={<CreateContract />} />

          <Route path="/vehicles" element={<FleetVehicles />} />
          <Route path="/tracking" element={<LiveTracking />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}