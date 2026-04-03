import { Children, type ReactNode } from 'react';

type CanvasLaneProps = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  children: ReactNode;
  addLabel: string;
  onAddClick: () => void;
  addPanel?: ReactNode;
};

export function CanvasLane({
  title,
  subtitle,
  emptyMessage,
  children,
  addLabel,
  onAddClick,
  addPanel,
}: CanvasLaneProps) {
  const hasChildren = Children.count(children) > 0;

  return (
    <section className="canvas-lane">
      <div className="canvas-lane__header">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
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
