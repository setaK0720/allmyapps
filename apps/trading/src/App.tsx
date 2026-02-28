import { BrowserRouter, Routes, Route } from 'react-router';
import Layout from './components/Layout';
import DashboardPage from './features/dashboard/DashboardPage';
import PositionsPage from './features/positions/PositionsPage';
import StrategiesPage from './features/strategies/StrategiesPage';
import RiskPage from './features/risk/RiskPage';
import HistoryPage from './features/history/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/strategies" element={<StrategiesPage />} />
          <Route path="/risk" element={<RiskPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
