type OrderActionBarProps = {
  onConfirm: () => void;
  onRequestChanges: () => void;
};

export function OrderActionBar({
  onConfirm,
  onRequestChanges,
}: OrderActionBarProps) {
  return (
    <div className="order-actions">
      <button type="button" className="button" onClick={onConfirm}>
        Confirm Draft
      </button>
      <button
        type="button"
        className="button button-secondary"
        onClick={onRequestChanges}
      >
        Request Changes
      </button>
    </div>
  );
}
