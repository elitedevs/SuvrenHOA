# Security Notes

## Supabase Service Role Key Rotation Required

The Supabase service role key was previously committed to `frontend/.env.local` in git history.
The file has been removed from tracking and added to `.gitignore`, but the key remains in historical commits.

**Action required:** Rotate the Supabase service role key in the Supabase dashboard:
1. Go to Supabase Dashboard > Project Settings > API
2. Rotate the service role key
3. Update the new key in your deployment environment variables

Git history rewriting was not performed to avoid disrupting collaborators.

## Alchemy API Key Rotation

Alchemy RPC API keys were previously hardcoded in `contracts/foundry.toml`.
They have been replaced with environment variable references.

**Action required:** Rotate the Alchemy API key at https://dashboard.alchemy.com and set the new key as `ALCHEMY_API_KEY` in your environment.
