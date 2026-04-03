import { Navigate, Route, Routes } from 'react-router-dom';
import { AIAgentPage } from './pages/AIAgentPage';
import { AppLayout } from './components/AppLayout';
import { OpsLayout } from './components/OpsLayout';
import { RequireOpsAccess } from './components/RequireOpsAccess';
import { ConfiguratorCanvasPage } from './pages/ConfiguratorCanvasPage';
import { GeneratedPreviewPage } from './pages/GeneratedPreviewPage';
import { HomePage } from './pages/HomePage';
import { OpsEntryPage } from './pages/OpsEntryPage';
import { ProcessingStatusPage } from './pages/ProcessingStatusPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { RequestInboxPage } from './pages/RequestInboxPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/ai-agent" element={<AIAgentPage />} />
        <Route path="/configurator" element={<ConfiguratorCanvasPage />} />
        <Route path="/upload" element={<Navigate to="/ai-agent" replace />} />
        <Route path="/processing" element={<ProcessingStatusPage />} />
        <Route path="/processing/:requestId" element={<ProcessingStatusPage />} />
        <Route path="/preview/:requestId" element={<GeneratedPreviewPage />} />
        <Route path="/review-order/:requestId" element={<GeneratedPreviewPage />} />
        <Route path="/order-confirmation" element={<Navigate to="/processing" replace />} />
        <Route
          path="/order-confirmation/:requestId"
          element={<GeneratedPreviewPage />}
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
