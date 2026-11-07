#Terminal commands

### Startup

The python tools start up a docker for the local database tests. (No i don't know what half of that means) Whenever you load the site while the docker is active, it will instead use the local database instead of the cloud one. The database functions must be ran from the repo's root folder. You might have to edit the commands a bit to work on windows & mac.

```
nvm use 24
python3 tools/local_supabase.py start
python3 tools/local_supabase.py status
python3 tools/local_supabase.py frontend-env
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```


### Teardown

This python script stops the local database.

```
cd ..
python3 tools/local_supabase.py stop
```

# Local Port Locations

### Vite Website:

> http://127.0.0.1:5173

### Local Supabase Interface

> http://127.0.0.1:55323

### Extra Local Supabase info

Seems important but you probably dont need it

- Volume: supabase_db_team6310-phase2-verification
- Inside the container: /var/lib/postgresql/data
- Studio: http://127.0.0.1:55323
- API: http://127.0.0.1:55321
- PostgreSQL database address: 127.0.0.1:55322
