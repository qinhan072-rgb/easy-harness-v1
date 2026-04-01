type TimelineItem = {
  stage: string;
  time: string;
  state: 'done' | 'active' | 'upcoming';
};

type StatusTimelineProps = {
  items: readonly TimelineItem[];
};

export function StatusTimeline({ items }: StatusTimelineProps) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.stage} className={`timeline-item is-${item.state}`}>
          <span className="timeline-dot" aria-hidden="true" />
          <div>
            <strong>{item.stage}</strong>
            <p>{item.time}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
