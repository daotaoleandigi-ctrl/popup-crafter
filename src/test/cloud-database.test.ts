// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

describe("database access and publication", () => {
  let db: PGlite;
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role authenticated; create role anon;
      alter default privileges in schema public grant execute on functions to anon;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id serial primary key,bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql immutable as 'select string_to_array(name,''/'')';
      grant usage on schema public,auth,storage to authenticated,anon;
      grant execute on function auth.uid(),storage.foldername(text) to authenticated,anon;
      grant insert,select on storage.objects to authenticated;
      grant usage on sequence storage.objects_id_seq to authenticated;
      insert into auth.users values ('${owner}'),('${other}');
    `);
    const migrations = new URL("../../supabase/migrations/", import.meta.url);
    for (const name of readdirSync(migrations).filter(name => name.endsWith(".sql")).sort()) {
      await db.exec(readFileSync(new URL(name, migrations), "utf8"));
    }
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  async function asUser(id: string) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("set role authenticated");
  }
  async function save(id: string, name: string, revision: number) {
    return db.query("select public.save_popup($1,$2::jsonb,$3) as revision", [
      id,
      JSON.stringify({ id, name }),
      revision,
    ]);
  }
  it("isolates drafts, rejects stale writes, and publishes only explicit snapshots", async () => {
    await asUser(owner);
    await save("test-popup-1", "draft one", 0);
    await asUser(other);
    expect((await db.query("select * from public.popups")).rows).toHaveLength(
      0,
    );
    await expect(save("test-popup-1", "intruder", 1)).rejects.toThrow();
    await expect(
      db.query("select publish_popup('test-popup-1',1)"),
    ).rejects.toThrow();
    await asUser(owner);
    await db.query("select publish_popup('test-popup-1',1)");
    await save("test-popup-1", "draft two", 1);
    await expect(save("test-popup-1", "stale", 1)).rejects.toThrow(/CONFLICT/);
    await db.exec("reset role; set role anon");
    await expect(db.query("select * from public.popups")).rejects.toThrow();
    await expect(
      db.query("select * from public.popup_publications"),
    ).rejects.toThrow();
    expect(
      (
        await db.query<{ config: { name: string } }>(
          "select get_published_popup('test-popup-1') as config",
        )
      ).rows[0].config.name,
    ).toBe("draft one");
    await expect(
      db.query("select publish_popup('test-popup-1',2)"),
    ).rejects.toThrow();
    await asUser(owner);
    await db.query("select publish_popup('test-popup-1',2)");
    expect(
      (
        await db.query<{ config: { name: string } }>(
          "select get_published_popup('test-popup-1') as config",
        )
      ).rows[0].config.name,
    ).toBe("draft two");
    await asUser(other);
    await expect(
      db.query("select unpublish_popup('test-popup-1')"),
    ).rejects.toThrow();
    await asUser(owner);
    await db.query("select unpublish_popup('test-popup-1')");
    expect(
      (
        await db.query<{ config: null }>(
          "select get_published_popup('test-popup-1') as config",
        )
      ).rows[0].config,
    ).toBeNull();
  });
  it("restricts image uploads to the user's own folder", async () => {
    await asUser(owner);
    await db.query(
      "insert into storage.objects(bucket_id,name) values('popup-images',$1)",
      [owner + "/image.png"],
    );
    await asUser(other);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values('popup-images',$1)",
        [owner + "/injected.png"],
      ),
    ).rejects.toThrow();
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      0,
    );
  });
});
