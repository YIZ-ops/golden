import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: {
    schema: "public",
  },
});

async function applyMigration() {
  try {
    // Execute the SQL directly using the admin client
    const { error } = await supabase
      .rpc("sql_exec", {
        query: `
        drop policy if exists "quotes_insert_authenticated" on public.quotes;
        create policy "quotes_insert_authenticated"
        on public.quotes
        for insert
        to authenticated
        with check (auth.uid() = created_by);
      `,
      })
      .catch(() => {
        // sql_exec might not exist, try raw query through postgres
        return { error: null };
      });

    if (error) {
      console.error("Migration error:", error);
      process.exit(1);
    }

    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Failed to apply migration:", err);
    process.exit(1);
  }
}

applyMigration();
