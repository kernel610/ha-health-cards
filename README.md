# Health Tiles Cards

Two Lovelace cards — **Sleep Summary** and **Daily Activity** — styled like the
Health Assistant Link tiles, but configured entirely through Home Assistant's
UI editor with no dependencies on any specific app. No YAML editing, no hardcoded entity IDs, and no HACS add-ons
required (no button-card / card-mod).

### Install via HACS
 
1. In Home Assistant: **HACS → ⋮ (top right) → Custom repositories**.
2. Paste this repo's URL, set category to **Dashboard**, click **Add**.
3. Find **Health Tiles Cards** in the HACS store list and install it.
   HACS automatically adds the Lovelace resource for you — no manual
   resource step needed.
4. Reload the dashboard (hard refresh if it doesn't show up right away).
5. Edit your dashboard → **Add Card** → search **"Sleep Summary"** or
   **"Daily Activity"** → pick your entities from the dropdowns in the
   editor.

## Fields

**Sleep Summary**
- Time asleep (minutes) — required
- Restorative sleep (minutes) — optional, defaults to Deep + REM
- Bedtime / Wake time
- Deep / REM / Core / Awake (minutes) — sleep stage breakdown

**Daily Activity**
- Primary stat (e.g. steps) + label — optional
- Heart rate / Resting heart rate
- Active calories / Distance / Exercise minutes / Flights climbed

Any field you leave blank is simply hidden on the card — you don't need every
entity to use it. Distance and other units are read from each entity's own
`unit_of_measurement`, so km vs. mi just works based on your sensor.

## Notes

- Duration entities (asleep, deep, REM, core, awake, exercise) are expected
  as **minutes** — this matches how most Apple Health / Health Assistant
  Link sensors expose them.
- Bedtime/wake accept either a timestamp entity or a sensor whose state is
  already a time string.
