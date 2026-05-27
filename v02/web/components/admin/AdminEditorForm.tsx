"use client";

import { useActionState } from "react";
import type { AdminFormState } from "@/app/admin/actions";
import type { EditorialItem, EditorialTypeMeta } from "@/lib/admin/editorial-read";

const initialState: AdminFormState = { ok: true };

function valueForField(item: EditorialItem | null, name: string, kind: string) {
  const value = item?.[name];
  if (value === null || value === undefined) {
    if (kind === "json") return name === "germanyRelevance" ? "{}" : "[]";
    return "";
  }
  if (kind === "json") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AdminEditorForm({
  meta,
  item,
  mode,
  action,
}: {
  meta: EditorialTypeMeta;
  item: EditorialItem | null;
  mode: "create" | "update";
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const editable = mode === "create" || item?.editorialStatus === "draft" || item?.editorialStatus === "rejected";

  return (
    <form action={formAction} className="admin-form">
      {!editable ? (
        <div className="admin-notice">
          Dieses Item ist nicht im Status Entwurf oder Abgelehnt. Bearbeitung ist gesperrt; Statuswechsel erfolgen über die Listenansicht.
        </div>
      ) : null}
      {!state.ok && state.message ? <div className="admin-error">{state.message}</div> : null}

      {meta.fields.map((field) => {
        const error = state.fieldErrors?.[field.name];
        const commonProps = {
          id: field.name,
          name: field.name,
          defaultValue: valueForField(item, field.name, field.kind),
          required: field.required,
          disabled: !editable || (mode === "update" && field.name === "id"),
          className: error ? "admin-input admin-input-error" : "admin-input",
        };

        return (
          <label className="admin-field" key={field.name} htmlFor={field.name}>
            <span className="admin-label">{field.label}{field.required ? " *" : ""}</span>
            {field.kind === "textarea" || field.kind === "json" ? (
              <textarea {...commonProps} rows={field.kind === "json" ? 9 : 4} />
            ) : field.kind === "select" ? (
              <select
                id={field.name}
                name={field.name}
                defaultValue={valueForField(item, field.name, field.kind)}
                required={field.required}
                disabled={!editable}
                className={commonProps.className}
              >
                <option value="">Bitte wählen</option>
                {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input {...commonProps} />
            )}
            {mode === "update" && field.name === "id" ? <input type="hidden" name="id" value={String(item?.id ?? "")} /> : null}
            {field.help ? <span className="admin-help">{field.help}</span> : null}
            {error ? <span className="admin-field-error">{error}</span> : null}
          </label>
        );
      })}

      <div className="admin-form-actions">
        <button className="btn-primary auth-inline-button" type="submit" disabled={!editable || pending}>
          {pending ? "Speichern …" : mode === "create" ? "Draft anlegen" : "Draft speichern"}
        </button>
      </div>
    </form>
  );
}
