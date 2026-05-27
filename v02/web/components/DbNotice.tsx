export function DbNotice({ error }: { error?: string }) {
  return (
    <div className="db-notice" role="status">
      Datenbank nicht verbunden — bitte <code>docker compose up postgres && pnpm db:migrate && pnpm db:seed</code>
      {error ? <small>DB-Hinweis: {error}</small> : null}
    </div>
  );
}
