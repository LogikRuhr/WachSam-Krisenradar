export function DbNotice({ error }: { error?: string }) {
  const showDev = process.env.NODE_ENV !== "production";
  return (
    <div className="db-notice" role="status">
      Die Daten werden gerade nicht geladen — bitte später erneut versuchen.
      {showDev ? (
        <small>
          Entwicklungs-Hinweis: <code>docker compose up postgres &amp;&amp; pnpm db:migrate &amp;&amp; pnpm db:seed</code>
          {error ? ` · ${error}` : null}
        </small>
      ) : null}
    </div>
  );
}
