import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import DashboardLayout from './DashboardLayout';
import Overview from './Overview';
import ContractManagement from './ContractManagement';
import FleetVehicles from './FleetVehicles';
import LiveTracking from './LiveTracking';
import Analytics from './Analytics';
import Alerts from './Alerts';
import Settings from './Settings'; // <-- 1. IMPORT THÊM Ở ĐÂY

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
          <Route path="/vehicles" element={<FleetVehicles />} />
          <Route path="/tracking" element={<LiveTracking />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          
          <Route path="/settings" element={<Settings />} /> {/* <-- 2. THÊM ROUTE Ở ĐÂY */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}