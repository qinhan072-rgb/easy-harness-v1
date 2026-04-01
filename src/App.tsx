import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ConfiguratorCanvasPage } from './pages/ConfiguratorCanvasPage';
import { HomePage } from './pages/HomePage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { ProcessingStatusPage } from './pages/ProcessingStatusPage';
import { UploadRequestPage } from './pages/UploadRequestPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/configurator" element={<ConfiguratorCanvasPage />} />
        <Route path="/upload" element={<UploadRequestPage />} />
        <Route path="/processing" element={<ProcessingStatusPage />} />
        <Route
          path="/order-confirmation"
          element={<OrderConfirmationPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
