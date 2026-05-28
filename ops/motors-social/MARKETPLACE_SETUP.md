# Facebook Marketplace — Vehicles Catalog Setup

RoadHouse Motors feed-URL approach. FB pulls the catalog on a schedule — no per-vehicle API calls, no Python script required. The catalog stays in sync automatically as inventory changes in KV.

---

## How it works

```
Vercel KV (live inventory)
       |
       v
GET /api/motors/feed/catalog   ← this repo: app/api/motors/feed/catalog/route.ts
       |
       v
FB Commerce Manager (scheduled feed pull, hourly)
       |
       v
FB Marketplace > Vehicles  (Saskatchewan buyers)
```

The catalog endpoint returns a Facebook Vehicles Catalog CSV with one row per available vehicle. FB refreshes it on the schedule you configure. When a vehicle sells and is removed from KV by the daily sync, it disappears from Marketplace on the next refresh.

---

## Required env vars (Vercel dashboard)

Add these to the `roadhouse_v6` Vercel project. Without the address vars, FB Marketplace cannot geo-target listings to Saskatchewan buyers.

```bash
# Dealer address — required for Marketplace geo-targeting
DEALER_NAME=RoadHouse Motors
DEALER_PHONE=+13063818222
DEALER_ADDR1=            # street address (e.g. 123 Main St)
DEALER_CITY=             # e.g. North Battleford
DEALER_POSTAL=           # e.g. S9A 1A1
DEALER_LAT=              # decimal latitude  (e.g. 52.7575)
DEALER_LNG=              # decimal longitude (e.g. -108.2861)

# Catalog metadata (for future Python-side push, not needed for feed URL approach)
META_CATALOG_ID=         # from Commerce Manager after catalog creation
META_BUSINESS_ID=        # from Business Manager
META_SYSTEM_USER_TOKEN=  # System User token with catalog_management scope
```

After adding vars: **Vercel dashboard → Project → Settings → Environment Variables → Redeploy**.

---

## Step 1 — Verify the feed endpoint

```bash
curl -s "https://motors.roadhouse.capital/api/motors/feed/catalog" \
  -H "Authorization: Bearer {CRON_SECRET}" \
  --output catalog.csv

# Should download a CSV. Open in Excel or check row count:
wc -l catalog.csv   # expect 117 lines (1 header + 116 vehicles)
head -2 catalog.csv # inspect header + first vehicle row
```

**Sample row (abbreviated):**

```
vehicle_id,vin,title,description,url,make,model,year,...,image[0].url,...
2HKRW2H85NH213905,2HKRW2H85NH213905,"2022 Honda CR-V EX-L","2022 Honda CR-V EX-L. 85,700 km. Platinum White Pearl. Automatic. ...","https://motors.roadhouse.capital/vehicle/2HKRW2H85NH213905",Honda,CR-V,2022,EX-L,SUV,GASOLINE,AUTOMATIC,,USED,"Platinum White Pearl","Black",85700,KM,"36800.00 CAD",IN_STOCK,GOOD,https://cdn.prod.website-files.com/...
```

---

## Step 2 — Create a Vehicles Catalog in Commerce Manager

1. Go to **business.facebook.com** → **Business Settings** → **Data Sources** → **Catalogs**
2. Click **Add** → **Create a new catalog**
3. **Catalog type**: select **Vehicles** (not Products — schema is different)
4. **Name**: `RoadHouse Motors Inventory`
5. Click **Create catalog** — note the **Catalog ID** (add to Vercel as `META_CATALOG_ID`)

---

## Step 3 — Add the feed URL as a Data Source

1. Inside the catalog → **Data Sources** tab → **Add Data Source**
2. Choose **Use a URL** (scheduled feed)
3. **Feed URL**: `https://motors.roadhouse.capital/api/motors/feed/catalog`
4. **File format**: CSV
5. Under **Request headers** → **Add header**:
   - Header name: `Authorization`
   - Value: `Bearer {CRON_SECRET}` (paste the actual secret from Vercel)
6. **Schedule**: Hourly (recommended — keeps sold vehicles off Marketplace within 1 hour of the daily sync removing them from KV)
7. **Default currency**: CAD
8. Click **Start upload** — FB will immediately fetch and validate the feed

If the first upload shows errors, click **See details** → common causes:
- Auth header missing or wrong → re-check the CRON_SECRET value
- Address fields empty → add `DEALER_ADDR1`, `DEALER_CITY`, etc. to Vercel and redeploy
- Image URLs not publicly reachable → confirm CDN images load in a browser (they should — they're Webflow CDN)

---

## Step 4 — Connect the catalog to the RoadHouse Motors FB Page

1. Commerce Manager → catalog → **Settings** → **Facebook Pages**
2. Click **Add Facebook Page** → select **RoadHouse Motors** (page ID `1047748735096733`)
3. Enable **Marketplace** surface

After connecting, listings appear in **Facebook Marketplace > Vehicles** for users near the dealer address. FB uses the `latitude`/`longitude` fields to determine proximity.

---

## Step 5 — Token requirements

**The Page access token used by `social_manager.py` may not be sufficient.**

The `catalog_management` permission required to create/manage catalogs programmatically (for future Python push) is only grantable to a **System User** token, not a standard Page token.

| Token type | Can set up feed URL manually | Can call Catalog API programmatically |
|---|---|---|
| Page access token | Yes (through UI only) | No |
| System User token | Yes | Yes |

**For v1 (feed URL approach):** A Page token is sufficient — you're just pasting the URL into the UI. No API calls needed.

**For future Python-side push (if feed refresh proves too slow):** Generate a System User token:
1. Business Settings → **System Users** → **Add**
2. Role: **Admin**
3. Assign assets: the catalog + the FB Page
4. **Generate token** → select `catalog_management` + `business_management` scopes
5. Save to Vercel as `META_SYSTEM_USER_TOKEN`

---

## Step 6 — Verify listings are live

After the first successful feed upload (usually within 5 minutes):

1. Commerce Manager → catalog → **Items** tab — should show ~116 vehicles
2. Click any vehicle → verify title, price, images, and URL look correct
3. On Facebook, search Marketplace → Vehicles → filter by Saskatchewan → RoadHouse Motors listings should appear

---

## Notes

- **Sold vehicles**: when the daily sync at 9am CST removes a sold VIN from KV, it disappears from the catalog CSV on the next hourly FB refresh. No manual action needed.
- **Contact-for-price vehicles**: the scraper already excludes these (price sentinel = 1000), so they never appear in the catalog.
- **Placeholder images**: 31 vehicles currently have no CDN images and show `rh-coming-soon.svg`. The catalog endpoint filters these out (`img.startsWith('http')`), so those vehicles will have 0 image columns. FB may suppress listings with no images in Marketplace display — this is a dealer-side photography gap.
- **Drivetrain**: not available in the scraped data (not on obrians.ca listing pages). The `drivetrain` column is intentionally blank. FB accepts empty values for optional fields.
- **`condition` field**: defaulted to `GOOD` for all vehicles. If O'Brian's starts publishing condition grading, wire it through the scraper and update `buildDescription()` + the catalog row builder.
- **Python-side Marketplace push** (`marketplace.py`): if FB's hourly feed refresh proves too slow for same-day sold-vehicle removal, a Python script can push individual vehicle updates via the Catalog Batch API. The `META_CATALOG_ID` and `META_SYSTEM_USER_TOKEN` env vars are pre-plumbed for this. See FB docs: `POST /{catalog_id}/items_batch`.
