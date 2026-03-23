import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath = "C:\\Users\\14798\\Desktop\\golden\\supabase\\migrations\\20260322_optimize_home_quote_randomness.sql";

describe("home quote randomness migration", () => {
  it("replaces order by random with indexed random-key selection", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain("home_random");
    expect(sql).toContain("quotes_home_random_idx");
    expect(sql).not.toContain("order by random()");
  });
});
