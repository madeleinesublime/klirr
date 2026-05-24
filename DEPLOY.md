# Driftsätta Veckis på Railway

Railway rekommenderas — det är enkelt, har en gratisnivå med $5 krediter/månad
(mer än tillräckligt för den här appen) och hanterar allt på ett ställe.

---

## Steg 1 — Skapa konton

1. Skapa konto på [railway.app](https://railway.app) (logga in med GitHub)
2. Skapa konto på [github.com](https://github.com) om du inte redan har ett

---

## Steg 2 — Lägg upp koden på GitHub

```bash
# I projektmappen (C:\Projects\MAD - Veckopeng)
git init
git add .
git commit -m "Initial commit"

# Repo är redan skapat på GitHub:
git remote add origin https://github.com/madeleinesublime/klirr.git
git push -u origin main
```

---

## Steg 3 — Skapa projekt på Railway

1. Gå till [railway.app/dashboard](https://railway.app/dashboard)
2. Klicka **New Project** → **Deploy from GitHub repo**
3. Välj ditt `veckis`-repo
4. Railway börjar bygga automatiskt (tar ~2 min)

---

## Steg 4 — Lägg till persistent lagring (databas)

SQLite-filen måste sparas på en persistent volym, annars försvinner all data
när appen startas om.

1. I ditt Railway-projekt, klicka **+ New** → **Volume**
2. Sätt **Mount Path** till `/data`
3. Anslut volymen till din app-service

---

## Steg 5 — Ange miljövariabler

I din Railway-service, gå till **Variables** och lägg till:

| Variabel | Värde |
|---|---|
| `DATABASE_PATH` | `/data/veckis.db` |
| `CRON_SECRET` | (ett slumpmässigt lösenord, t.ex. 32 tecken) |

---

## Steg 6 — Sätt upp en domän

1. Gå till **Settings** → **Networking** → **Generate Domain**
2. Du får en URL som `veckis-production-xxxx.up.railway.app`
3. Det är adressen du och ditt barn använder i Safari

---

## Steg 7 — Installera på iPhone (Add to Home Screen)

1. Öppna URL:en i **Safari** på iPhone
2. Tryck på **Dela**-ikonen (rutan med pil uppåt)
3. Välj **"Lägg till på hemskärmen"**
4. Tryck **Lägg till**

Upprepa på barnets mobil — de ser bara barnvyn som standard.

---

## Automatisk veckopeng (valfritt)

Appen kontrollerar vid varje öppning om det är dags för veckopeng och
lägger till den automatiskt. Inget extra behövs!

Om du vill ha ett schemalagt jobb som kör varje dag kl. 08:00 även om
ingen öppnar appen, kan du använda [cron-job.org](https://cron-job.org) (gratis):

1. Skapa konto
2. Ny cron job: `POST https://DIN-URL.up.railway.app/api/topup`
3. Body (JSON): `{"secret": "DITT_CRON_SECRET"}`
4. Schema: Varje dag kl. 08:00

---

## Uppdatera appen

När du ändrar kod:

```bash
git add .
git commit -m "Uppdatering"
git push
```

Railway bygger och driftsätter automatiskt inom ~2 minuter.
