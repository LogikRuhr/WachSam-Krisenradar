import "server-only";

import { redirect } from "next/navigation";
import { NotAuthorizedError } from "./permissions";

export async function withEditorRedirect<T>(loader: () => Promise<T>): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      redirect("/login");
    }
    throw error;
  }
}
