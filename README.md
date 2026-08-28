# Health Tiles Cards

Two Lovelace cards — **Sleep Summary** and **Daily Activity** — styled like the
Health Assistant Link tiles, but configured entirely through Home Assistant's
UI editor with no dependencies on any specific app. No YAML editing, no hardcoded entity IDs, and no HACS add-ons
required (no button-card / card-mod).

## Install

1. Copy `health-tiles-cards.js` into your `config/www/` folder (use the File
   Editor add-on, Samba, or Studio Code Server — whatever you normally use to
   reach `config/www`).
2. **Settings → Dashboards → ⋮ → Resources → Add Resource**
   - URL: `/local/health-tiles-cards.js`
   - Type: `JavaScript Module`
3. Reload the dashboard (hard refresh, Ctrl/Cmd+Shift+R, if you don't see it).

## Add a tile

1. Edit your dashboard → **Add Card**.
2. Search for **"Sleep Summary"** or **"Daily Activity"** in the card picker.
3. Use the entity dropdowns in the editor to pick your sensors — no code.

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
