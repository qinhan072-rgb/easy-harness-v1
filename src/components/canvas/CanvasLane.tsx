import { Children, type ReactNode } from 'react';

type CanvasLaneProps = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  children: ReactNode;
  addLabel: string;
  onAddClick: () => void;
  addPanel?: ReactNode;
  showHeader?: boolean;
};

export function CanvasLane({
  title,
  subtitle,
  emptyMessage,
  children,
  addLabel,
  onAddClick,
  addPanel,
  showHeader = true,
}: CanvasLaneProps) {
  const hasChildren = Children.count(children) > 0;

  return (
    <section className="canvas-lane">
      {showHeader ? (
        <div className="canvas-lane__header">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      ) : null}
      <div className="canvas-lane__body">
        {hasChildren ? (
          children
        ) : (
          <div className="canvas-lane__empty">{emptyMessage}</div>
        )}
      </div>
      <div className="canvas-lane__footer">
        <button type="button" className="canvas-add-button" onClick={onAddClick}>
          + {addLabel}
        </button>
        {addPanel ? <div className="canvas-inline-picker">{addPanel}</div> : null}
      </div>
    </section>
  );
}
