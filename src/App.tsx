import { Navigate, Route, Routes } from 'react-router-dom';
import { AIAgentPage } from './pages/AIAgentPage';
import { AppLayout } from './components/AppLayout';
import { OpsLayout } from './components/OpsLayout';
import { RequireOpsAccess } from './components/RequireOpsAccess';
import { ConfiguratorCanvasPage } from './pages/ConfiguratorCanvasPage';
import { HomePage } from './pages/HomePage';
import { OpsEntryPage } from './pages/OpsEntryPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { ProcessingStatusPage } from './pages/ProcessingStatusPage';
import { ReviewOrderPage } from './pages/ReviewOrderPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { RequestInboxPage } from './pages/RequestInboxPage';
import { UploadRequestPage } from './pages/UploadRequestPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/ai-agent" element={<AIAgentPage />} />
        <Route path="/configurator" element={<ConfiguratorCanvasPage />} />
        <Route path="/upload" element={<UploadRequestPage />} />
        <Route path="/processing" element={<ProcessingStatusPage />} />
        <Route path="/processing/:requestId" element={<ProcessingStatusPage />} />
        <Route path="/review-order/:requestId" element={<ReviewOrderPage />} />
        <Route
          path="/order-confirmation"
          element={<OrderConfirmationPage />}
        />
        <Route
          path="/order-confirmation/:requestId"
          element={<OrderConfirmationPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="/ops" element={<OpsEntryPage />} />
      <Route
        path="/ops/requests"
        element={
          <RequireOpsAccess>
            <OpsLayout>
              <RequestInboxPage />
            </OpsLayout>
          </RequireOpsAccess>
        }
      />
      <Route
        path="/ops/requests/:requestId"
        element={
          <RequireOpsAccess>
            <OpsLayout>
              <RequestDetailPage />
            </OpsLayout>
          </RequireOpsAccess>
        }
      />
    </Routes>
  );
}

export default App;
