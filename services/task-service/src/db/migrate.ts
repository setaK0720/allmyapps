import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migration complete");
process.exit(0);
