import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  formatRequestTimestamp,
  requestSourceLabels,
  requestStatusMeta,
} from '../data/requestMeta';
import type { UnifiedRequest } from '../types/request';
import { listRequests } from '../utils/requestApi';

export function RequestInboxPage() {
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);

      try {
        const nextRequests = await listRequests();
        setRequests(nextRequests);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'We could not load the request list.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadRequests();
  }, []);

  return (
    <div className="page-stack">
      <PageHeader
        title="Request Inbox"
        description="Review incoming intake records and open the next request for handling."
        badge={`${requests.length} request${requests.length === 1 ? '' : 's'}`}
      />

      <section className="panel">
        <div className="panel-heading">
          <h3>Incoming requests</h3>
          <p>Open a request to standardize the intake record, prepare the draft, and update status.</p>
        </div>

        {error ? (
          <div className="info-banner info-banner--error">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="empty-state">
            <strong>Loading requests...</strong>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <strong>No requests have been submitted yet.</strong>
            <p>New intake records from AI Agent, Configurator Canvas, and Upload Intake will appear here.</p>
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="request-table">
            <div className="request-table__head">
              <span>Request ID</span>
              <span>Source</span>
              <span>Project</span>
              <span>Created</span>
              <span>Qty</span>
              <span>Lead time</span>
              <span>Attachments</span>
              <span>Status</span>
            </div>

            {requests.map((request) => (
              <Link
                key={request.id}
                to={`/ops/requests/${request.id}`}
                className="request-table__row"
              >
                <span className="request-table__cell request-table__code">
                  {request.id}
                </span>
                <span className="request-table__cell">
                  {requestSourceLabels[request.source]}
                </span>
                <span className="request-table__cell">{request.projectName}</span>
                <span className="request-table__cell">
                  {formatRequestTimestamp(request.createdAt)}
                </span>
                <span className="request-table__cell">{request.quantity}</span>
                <span className="request-table__cell">
                  {request.leadTimePreference}
                </span>
                <span className="request-table__cell">
                  {request.attachments.length > 0 ? 'Yes' : 'No'}
                </span>
                <span className="request-table__cell">
                  {requestStatusMeta[request.status].label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
