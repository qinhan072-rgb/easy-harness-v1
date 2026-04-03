type PageHeaderProps = {
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({
  title,
  description,
  badge,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">Easy Harness</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {badge ? <div className="status-pill">{badge}</div> : null}
    </header>
  );
}
