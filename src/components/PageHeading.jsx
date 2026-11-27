export function PageHeading({ title, description, children }) {
  return (
    <header className="surface-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}
