import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useOpsAccess } from '../context/OpsAccessContext';

type LocationState = {
  from?: string;
};

export function OpsEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpsUnlocked, unlockOps } = useOpsAccess();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectPath =
    ((location.state as LocationState | undefined)?.from ?? '/ops/requests');

  if (isOpsUnlocked) {
    return <Navigate to={redirectPath} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await unlockOps(passcode);
      navigate(redirectPath, { replace: true });
    } catch (unlockError) {
      setError(
        unlockError instanceof Error
          ? unlockError.message
          : 'Unable to unlock internal access.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Ops Access"
        description="Enter the shared passcode to open internal intake handling."
        badge="Internal"
      />

      <section className="panel ops-entry-panel">
        <div className="panel-heading">
          <h3>Internal intake access</h3>
          <p>Use the shared passcode to open the request queue and internal handling records.</p>
        </div>

        <form className="request-inline-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Passcode</span>
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Enter shared ops passcode"
            />
          </label>

          {error ? <div className="info-banner info-banner--error">{error}</div> : null}

          <div className="action-row">
            <button type="submit" className="button" disabled={isSubmitting || !passcode.trim()}>
              {isSubmitting ? 'Checking passcode...' : 'Open Inbox'}
            </button>
            <Link to="/" className="button button-ghost">
              Back to Site
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
