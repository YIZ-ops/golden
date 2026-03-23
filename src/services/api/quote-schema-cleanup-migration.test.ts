import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath = "C:\\Users\\14798\\Desktop\\golden\\supabase\\migrations\\20260323_drop_works_and_redundant_quote_columns.sql";
const bootstrapMigrationPath = "C:\\Users\\14798\\Desktop\\golden\\supabase\\migrations\\20260322_people_works_quotes.sql";
const curatedSeedPath = "C:\\Users\\14798\\Desktop\\golden\\supabase\\seeds\\quotes-curated.sql";

describe("quote schema cleanup migration", () => {
  it("drops works and redundant quote columns while keeping bootstrap SQL clean", () => {
    const cleanupSql = readFileSync(migrationPath, "utf8").toLowerCase();
    const bootstrapSql = readFileSync(bootstrapMigrationPath, "utf8").toLowerCase();
    const curatedSeedSql = readFileSync(curatedSeedPath, "utf8").toLowerCase();

    expect(cleanupSql).toContain("drop table if exists public.works");
    expect(cleanupSql).toContain("drop column if exists work_id");
    expect(cleanupSql).toContain("drop column if exists excerpt_type");
    expect(cleanupSql).toContain("drop column if exists verified");

    expect(bootstrapSql).not.toContain("excerpt_type");
    expect(bootstrapSql).not.toContain("verified");
    expect(curatedSeedSql).not.toContain("excerpt_type");
    expect(curatedSeedSql).not.toContain("verified");
  });
});
