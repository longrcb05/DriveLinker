import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { ensureInitialContractSeed } from './services/contractSeedData';
import { vehicleService } from './services/vehicleService';

// Tự động khởi tạo và đồng bộ dữ liệu mẫu hạt giống đồng nhất ngay khi khởi chạy
try {
  ensureInitialContractSeed();
  vehicleService.getVehicles('COMPANY_A');
} catch (e) {
  console.warn('Initial data synchronization:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
