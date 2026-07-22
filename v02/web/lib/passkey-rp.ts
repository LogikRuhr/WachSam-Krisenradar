export type PasskeyRelyingParty = {
  id: string;
  name: string;
  origin: string;
};

export function getPasskeyRelyingParty(authUrl = process.env.AUTH_URL): PasskeyRelyingParty {
  if (!authUrl) {
    throw new Error("AUTH_URL ist fuer Passkeys erforderlich.");
  }

  const url = new URL(authUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Passkeys erfordern einen HTTPS-Origin.");
  }

  return {
    id: url.hostname,
    name: "WachSam",
    origin: url.origin,
  };
}
