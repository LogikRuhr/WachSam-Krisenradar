import { connectDatabase, getSeedStats, seedDatabase, validateSeedData } from "../seed";

const isDryRun = process.argv.includes("--dry-run");

const printStats = (): void => {
  const stats = getSeedStats();
  console.log("Seed-Statistik:");
  for (const [name, count] of Object.entries(stats)) {
    console.log(`- ${name}: ${count}`);
  }
};

const main = async (): Promise<void> => {
  console.log(isDryRun ? "WachSam DB Seed: Dry-Run" : "WachSam DB Seed: echter Lauf");

  const errors = validateSeedData();
  if (errors.length > 0) {
    console.error("Validierung fehlgeschlagen:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("Validierung erfolgreich.");
  printStats();

  if (isDryRun) {
    console.log("Dry-Run abgeschlossen. Es wurde keine Datenbankverbindung geöffnet und nichts geschrieben.");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Fehler: DATABASE_URL ist nicht gesetzt. Echter Seed-Lauf abgebrochen.");
    process.exitCode = 1;
    return;
  }

  const connection = connectDatabase(databaseUrl);
  try {
    await seedDatabase(connection.db);
    console.log("Seed-Lauf erfolgreich abgeschlossen. Upserts sind idempotent ausgeführt.");
  } finally {
    await connection.close();
  }
};

main().catch((error: unknown) => {
  console.error("Seed-Lauf fehlgeschlagen:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
