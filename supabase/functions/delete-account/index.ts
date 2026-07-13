// GUAU · Edge Function: eliminación completa de cuenta (derecho de supresión).
//
// Flujo: el cliente autenticado invoca esta función; se verifica su JWT, se
// eliminan sus archivos de Storage y después su usuario de Auth. Las filas de
// las tablas public.* caen en cascada (FK on delete cascade). El evento queda
// registrado en audit_log antes del borrado.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Cliente con el JWT del usuario solo para identificarlo.
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey);

  // 1. Registro de auditoría (sin datos personales más allá del id).
  await admin.from("audit_log").insert({
    actor: userId,
    action: "account_delete_requested",
    entity: "auth.users",
    entity_id: userId,
  });

  // 2. Archivos del usuario en buckets privados.
  const buckets = ["pet-photos", "memory-audio"];
  for (const bucket of buckets) {
    // Lista recursiva de objetos bajo el prefijo del usuario (carpeta por pet).
    const { data: topLevel } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    const paths: string[] = [];
    for (const entry of topLevel ?? []) {
      if (entry.id === null) {
        // carpeta (p. ej. petId): listar su contenido
        const { data: nested } = await admin.storage
          .from(bucket)
          .list(`${userId}/${entry.name}`, { limit: 1000 });
        for (const file of nested ?? []) {
          paths.push(`${userId}/${entry.name}/${file.name}`);
        }
      } else {
        paths.push(`${userId}/${entry.name}`);
      }
    }
    if (paths.length > 0) {
      const { error: rmError } = await admin.storage.from(bucket).remove(paths);
      if (rmError) {
        return new Response(JSON.stringify({ error: "storage_cleanup_failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // 3. Usuario de Auth (cascada sobre profiles, pets, ledger, etc.).
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return new Response(JSON.stringify({ error: "auth_delete_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  await admin.from("audit_log").insert({
    actor: userId,
    action: "account_deleted",
    entity: "auth.users",
    entity_id: userId,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
