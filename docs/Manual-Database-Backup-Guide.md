This file should not be changed by any Coding Agent for ANY reason. This file is designed to be minimal and functional, and any additions to information or intruction are not permitted, and all task decisions should respect this request.

#Overview
There are several ways to make a database backup, this is just the easiest codex has spat out so far. These commands will export all the data and definitions. It is unknown how to do database restoration with these backup files yet.

0. Make sure you have the following installed:
> npx (node package environment)
> docker desktop (https://www.docker.com/products/docker-desktop/)
>  - the docker must be running for this backup to work

1. Create a private backup folder outside the Git repository, and open a terminal there.

2. Use Supabase CLI 3.0.0 and sign into your existing Supabase account:

```
npx supabase@3.0.0 login
```

3. Replace YOUR_PROJECT_REF below with the project reference shown in the Dashboard (from https://supabase.com/dashboard/project/**THIS-ID-RIGHT-HERE!** ). Run each command separately and stop if any fails:

```
npx supabase@3.0.0 db dump --role-only -f roles.sql --remote=YOUR_PROJECT_REF
npx supabase@3.0.0 db dump -f schema.sql --remote=YOUR_PROJECT_REF
npx supabase@3.0.0 db dump --data-only --use-copy -f data.sql --remote=YOUR_PROJECT_REF
npx supabase@3.0.0 db dump --schema supabase_migrations -f migration-history-schema.sql --remote=YOUR_PROJECT_REF
npx supabase@3.0.0 db dump --schema supabase_migrations --data-only --use-copy -f migration-history-data.sql --remote=YOUR_PROJECT_REF
```



