import { Navigate, Route, Routes } from 'react-router-dom';
import { AIAgentWorkspacePage } from './pages/AIAgentWorkspacePage';
import { OpsLayout } from './components/OpsLayout';
import { PublicAppLayout } from './components/PublicAppLayout';
import { RequireOpsAccess } from './components/RequireOpsAccess';
import { ConfiguratorCanvasPage } from './pages/ConfiguratorCanvasPage';
import { GeneratedPreviewPage } from './pages/GeneratedPreviewPage';
import { HomeLandingPage } from './pages/HomeLandingPage';
import { OpsEntryPage } from './pages/OpsEntryPage';
import { OpsRequestWorkbenchPage } from './pages/OpsRequestWorkbenchPage';
import { RequestTrackingPage } from './pages/RequestTrackingPage';
import { RequestInboxPage } from './pages/RequestInboxPage';

function App() {
  return (
    <Routes>
      <Route element={<PublicAppLayout />}>
        <Route path="/" element={<HomeLandingPage />} />
        <Route path="/ai-agent" element={<AIAgentWorkspacePage />} />
        <Route path="/configurator" element={<ConfiguratorCanvasPage />} />
        <Route path="/upload" element={<Navigate to="/ai-agent" replace />} />
        <Route path="/processing" element={<RequestTrackingPage />} />
        <Route path="/processing/:requestId" element={<RequestTrackingPage />} />
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
              <OpsRequestWorkbenchPage />
            </OpsLayout>
          </RequireOpsAccess>
        }
      />
    </Routes>
  );
}

export default App;
