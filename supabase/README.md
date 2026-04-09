# Supabase Scaffold

This directory contains the backend scaffold for the remake.

## Layout

- `config.toml`: local Supabase CLI configuration.
- `migrations/`: schema, helpers, triggers, and RLS.
- `seed.sql`: placeholder for local fixtures.

## Notes

- Auth is designed around `email + username + password`.
- `profiles` are auto-created from `auth.users` metadata when possible.
- The initial schema is normalized enough to support shared tables, memberships,
  invites, join codes, characters, order entries, logs, snapshots, and RLS.
- Avatar uploads are scaffolded through the private `avatars` bucket and storage
  policies in the migrations.
