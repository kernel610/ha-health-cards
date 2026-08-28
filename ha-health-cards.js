/**
 * Health Tiles Cards for Home Assistant
 * -------------------------------------
 * Two Lovelace cards inspired by the Health Assistant Link sleep/activity
 * tiles, but fully configurable through Home Assistant's card editor UI
 * (entity pickers) instead of hand-edited YAML with hardcoded entity_ids.
 *
 * Cards registered:
 *   - sleep-summary-card
 *   - daily-activity-card
 *
 * No HACS dependencies required (no button-card / card-mod needed).
 *
 * Install:
 *   1. Copy this file to config/www/health-tiles-cards.js
 *   2. Settings -> Dashboards -> Resources -> Add Resource
 *        URL: /local/health-tiles-cards.js   Type: JavaScript Module
 *   3. Edit Dashboard -> Add Card -> search "Sleep Summary" or "Daily Activity"
 *   4. Pick your entities from the dropdowns in the card editor.
 */
(() => {
  const LitElement = Object.getPrototypeOf(
    customElements.get("hui-masonry-view") ||
      customElements.get("home-assistant-main")
  );
  const html = LitElement.prototype.html;
  const css = LitElement.prototype.css;

  const STAGE_COLORS = {
    deep: "#5e5ce6",
    rem: "#64d2ff",
    core: "#0a84ff",
    awake: "#ff9f0a",
  };

  // ---------- helpers ----------
  function getState(hass, entityId) {
    if (!entityId || !hass) return undefined;
    return hass.states[entityId];
  }

  function num(hass, entityId) {
    const st = getState(hass, entityId);
    if (!st) return null;
    const n = parseFloat(st.state);
    return isNaN(n) ? null : n;
  }

  function unitOf(hass, entityId, fallback) {
    const st = getState(hass, entityId);
    return (st && st.attributes && st.attributes.unit_of_measurement) || fallback || "";
  }

  function fmtDuration(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return "—";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h <= 0) return `${m}m`;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }

  function fmtTime(stateObj) {
    if (!stateObj) return "—";
    const raw = stateObj.state;
    if (raw === "unknown" || raw === "unavailable") return "—";
    const d = new Date(raw);
    if (!isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(raw)) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return raw;
  }

  function fmtNum(hass, entityId, decimals, fallbackUnit) {
    const n = num(hass, entityId);
    if (n === null) return "—";
    const val = decimals ? n.toFixed(decimals) : Math.round(n).toString();
    const unit = unitOf(hass, entityId, fallbackUnit);
    return unit ? `${val} ${unit}` : val;
  }

  // ---------- shared styles ----------
  const baseStyles = css`
    ha-card {
      position: relative;
      overflow: hidden;
      padding: 20px 20px 18px;
      border-radius: var(--ha-card-border-radius, 16px);
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      opacity: 0.75;
      margin-bottom: 10px;
    }
    .hero {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .hero .value {
      font-size: 34px;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1;
      color: var(--primary-text-color);
    }
    .hero .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      opacity: 0.75;
    }
    .desc {
      font-size: 13px;
      color: var(--secondary-text-color);
      line-height: 1.4;
      margin: 6px 0 16px;
    }
    .split-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 1px solid var(--divider-color);
      border-bottom: 1px solid var(--divider-color);
      margin-bottom: 14px;
    }
    .split-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .split-item.right {
      align-items: flex-end;
    }
    .dot-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--secondary-text-color);
    }
    .split-item.right .dot-label {
      flex-direction: row-reverse;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex: none;
    }
    .split-value {
      font-size: 17px;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .split-icon {
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
      opacity: 0.45;
    }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      opacity: 0.65;
      margin-bottom: 10px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 16px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .stat-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .empty {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding: 8px 0;
    }
  `;

  // ================= SLEEP SUMMARY CARD =================

  const SLEEP_SCHEMA = [
    { name: "title", selector: { text: {} } },
    { name: "asleep_entity", required: true, selector: { entity: { domain: "sensor" } } },
    { name: "restorative_entity", selector: { entity: { domain: "sensor" } } },
    { name: "bedtime_entity", selector: { entity: { domain: "sensor" } } },
    { name: "wake_entity", selector: { entity: { domain: "sensor" } } },
    { name: "deep_entity", selector: { entity: { domain: "sensor" } } },
    { name: "rem_entity", selector: { entity: { domain: "sensor" } } },
    { name: "core_entity", selector: { entity: { domain: "sensor" } } },
    { name: "awake_entity", selector: { entity: { domain: "sensor" } } },
    { name: "description", selector: { text: {} } },
  ];

  const SLEEP_LABELS = {
    title: "Title",
    asleep_entity: "Time asleep (minutes) — required",
    restorative_entity: "Restorative sleep, minutes (optional — deep + REM used if blank)",
    bedtime_entity: "Bedtime",
    wake_entity: "Wake time",
    deep_entity: "Deep sleep (minutes)",
    rem_entity: "REM sleep (minutes)",
    core_entity: "Core sleep (minutes)",
    awake_entity: "Awake during night (minutes)",
    description: "Description override (optional)",
  };

  class SleepSummaryCard extends LitElement {
    static get properties() {
      return { hass: {}, _config: {} };
    }

    setConfig(config) {
      if (!config.asleep_entity) {
        throw new Error("Please choose a 'Time asleep' entity in the card editor.");
      }
      this._config = config;
    }

    getCardSize() {
      return 4;
    }

    static getStubConfig() {
      return { title: "Morning Recovery" };
    }

    static getConfigElement() {
      return document.createElement("sleep-summary-card-editor");
    }

    static get styles() {
      return baseStyles;
    }

    render() {
      if (!this._config || !this.hass) return html``;
      const c = this._config;
      const hass = this.hass;

      const asleepMin = num(hass, c.asleep_entity);
      const deepMin = num(hass, c.deep_entity);
      const remMin = num(hass, c.rem_entity);
      const coreMin = num(hass, c.core_entity);
      const awakeMin = num(hass, c.awake_entity);
      const restorativeMin = c.restorative_entity
        ? num(hass, c.restorative_entity)
        : (deepMin || 0) + (remMin || 0);

      const bedtime = fmtTime(getState(hass, c.bedtime_entity));
      const wake = fmtTime(getState(hass, c.wake_entity));

      const desc =
        c.description ||
        (restorativeMin
          ? `${fmtDuration(restorativeMin)} restorative sleep — a strong foundation for today.`
          : "");

      const showSplit = c.bedtime_entity || c.wake_entity;
      const showStages = c.deep_entity || c.rem_entity || c.core_entity || c.awake_entity;

      return html`
        <ha-card>
          <div class="eyebrow">${c.title || "Morning Recovery"}</div>
          <div class="hero">
            <span class="value">${fmtDuration(asleepMin)}</span>
            <span class="label">Asleep</span>
          </div>
          ${desc ? html`<div class="desc">${desc}</div>` : ""}
          ${showSplit
            ? html`
                <div class="split-row">
                  <div class="split-item">
                    <div class="dot-label">
                      <span class="dot" style="background:#8e8e93"></span>Asleep
                    </div>
                    <div class="split-value">${bedtime}</div>
                  </div>
                  <ha-icon class="split-icon" icon="mdi:moon-waning-crescent"></ha-icon>
                  <div class="split-item right">
                    <div class="dot-label">
                      <span class="dot" style="background:#ff9f0a"></span>Awake
                    </div>
                    <div class="split-value">${wake}</div>
                  </div>
                </div>
              `
            : ""}
          ${showStages
            ? html`
                <div class="section-label">Last Night's Mix · Sleep Stages</div>
                <div class="stat-grid">
                  ${c.deep_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:${STAGE_COLORS.deep}"></span>Deep
                        </div>
                        <div class="stat-value">${fmtDuration(deepMin)}</div>
                      </div>`
                    : ""}
                  ${c.rem_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:${STAGE_COLORS.rem}"></span>REM
                        </div>
                        <div class="stat-value">${fmtDuration(remMin)}</div>
                      </div>`
                    : ""}
                  ${c.core_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:${STAGE_COLORS.core}"></span>Core
                        </div>
                        <div class="stat-value">${fmtDuration(coreMin)}</div>
                      </div>`
                    : ""}
                  ${c.awake_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:${STAGE_COLORS.awake}"></span>Awake
                        </div>
                        <div class="stat-value">${fmtDuration(awakeMin)}</div>
                      </div>`
                    : ""}
                </div>
              `
            : ""}
        </ha-card>
      `;
    }
  }
  customElements.define("sleep-summary-card", SleepSummaryCard);

  class SleepSummaryCardEditor extends LitElement {
    static get properties() {
      return { hass: {}, _config: {} };
    }
    setConfig(config) {
      this._config = config;
    }
    render() {
      if (!this.hass || !this._config) return html``;
      return html`
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${SLEEP_SCHEMA}
          .computeLabel=${(schema) => SLEEP_LABELS[schema.name] || schema.name}
          @value-changed=${this._valueChanged}
        ></ha-form>
      `;
    }
    _valueChanged(ev) {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: ev.detail.value },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
  customElements.define("sleep-summary-card-editor", SleepSummaryCardEditor);

  // ================= DAILY ACTIVITY CARD =================

  const DAILY_SCHEMA = [
    { name: "title", selector: { text: {} } },
    { name: "primary_entity", selector: { entity: { domain: "sensor" } } },
    { name: "primary_label", selector: { text: {} } },
    { name: "heart_rate_entity", selector: { entity: { domain: "sensor" } } },
    { name: "resting_hr_entity", selector: { entity: { domain: "sensor" } } },
    { name: "active_calories_entity", selector: { entity: { domain: "sensor" } } },
    { name: "distance_entity", selector: { entity: { domain: "sensor" } } },
    { name: "exercise_entity", selector: { entity: { domain: "sensor" } } },
    { name: "flights_entity", selector: { entity: { domain: "sensor" } } },
    { name: "description", selector: { text: {} } },
  ];

  const DAILY_LABELS = {
    title: "Title",
    primary_entity: "Primary stat, e.g. steps (optional)",
    primary_label: "Primary stat label (optional, e.g. 'Steps')",
    heart_rate_entity: "Heart rate",
    resting_hr_entity: "Resting heart rate",
    active_calories_entity: "Active calories",
    distance_entity: "Distance",
    exercise_entity: "Exercise minutes",
    flights_entity: "Flights climbed",
    description: "Description override (optional)",
  };

  class DailyActivityCard extends LitElement {
    static get properties() {
      return { hass: {}, _config: {} };
    }

    setConfig(config) {
      this._config = config || {};
    }

    getCardSize() {
      return 4;
    }

    static getStubConfig() {
      return { title: "Today's Activity" };
    }

    static getConfigElement() {
      return document.createElement("daily-activity-card-editor");
    }

    static get styles() {
      return baseStyles;
    }

    render() {
      if (!this._config || !this.hass) return html``;
      const c = this._config;
      const hass = this.hass;

      const showHero = !!c.primary_entity;
      const activeCal = num(hass, c.active_calories_entity);
      const desc =
        c.description ||
        (activeCal !== null
          ? `${Math.round(activeCal)} kcal burned — great pace, keep it going.`
          : "");

      const showSplit = c.heart_rate_entity || c.resting_hr_entity;
      const showGrid =
        c.active_calories_entity ||
        c.distance_entity ||
        c.exercise_entity ||
        c.flights_entity;

      return html`
        <ha-card>
          <div class="eyebrow">${c.title || "Today's Activity"}</div>
          ${showHero
            ? html`
                <div class="hero">
                  <span class="value">${fmtNum(hass, c.primary_entity, 0)}</span>
                  <span class="label">${c.primary_label || "Steps"}</span>
                </div>
              `
            : ""}
          ${desc ? html`<div class="desc">${desc}</div>` : ""}
          ${showSplit
            ? html`
                <div class="split-row">
                  <div class="split-item">
                    <div class="dot-label">
                      <span class="dot" style="background:#ff375f"></span>Heart Rate
                    </div>
                    <div class="split-value">${fmtNum(hass, c.heart_rate_entity, 0, "bpm")}</div>
                  </div>
                  <ha-icon class="split-icon" icon="mdi:heart-pulse"></ha-icon>
                  <div class="split-item right">
                    <div class="dot-label">
                      <span class="dot" style="background:#8e8e93"></span>Resting
                    </div>
                    <div class="split-value">${fmtNum(hass, c.resting_hr_entity, 0, "bpm")}</div>
                  </div>
                </div>
              `
            : ""}
          ${showGrid
            ? html`
                <div class="stat-grid">
                  ${c.active_calories_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:#ff9f0a"></span>Active
                        </div>
                        <div class="stat-value">${fmtNum(hass, c.active_calories_entity, 0, "kcal")}</div>
                      </div>`
                    : ""}
                  ${c.distance_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:#30d158"></span>Distance
                        </div>
                        <div class="stat-value">${fmtNum(hass, c.distance_entity, 1, "km")}</div>
                      </div>`
                    : ""}
                  ${c.exercise_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:#64d2ff"></span>Exercise
                        </div>
                        <div class="stat-value">${fmtNum(hass, c.exercise_entity, 0, "min")}</div>
                      </div>`
                    : ""}
                  ${c.flights_entity
                    ? html`<div class="stat-item">
                        <div class="dot-label">
                          <span class="dot" style="background:#5e5ce6"></span>Flights
                        </div>
                        <div class="stat-value">${fmtNum(hass, c.flights_entity, 0)}</div>
                      </div>`
                    : ""}
                </div>
              `
            : ""}
          ${!showHero && !showSplit && !showGrid
            ? html`<div class="empty">Choose entities in the card editor to get started.</div>`
            : ""}
        </ha-card>
      `;
    }
  }
  customElements.define("daily-activity-card", DailyActivityCard);

  class DailyActivityCardEditor extends LitElement {
    static get properties() {
      return { hass: {}, _config: {} };
    }
    setConfig(config) {
      this._config = config;
    }
    render() {
      if (!this.hass || !this._config) return html``;
      return html`
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${DAILY_SCHEMA}
          .computeLabel=${(schema) => DAILY_LABELS[schema.name] || schema.name}
          @value-changed=${this._valueChanged}
        ></ha-form>
      `;
    }
    _valueChanged(ev) {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: ev.detail.value },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
  customElements.define("daily-activity-card-editor", DailyActivityCardEditor);

  // ================= registration =================
  window.customCards = window.customCards || [];
  window.customCards.push(
    {
      type: "sleep-summary-card",
      name: "Sleep Summary",
      description: "A styled sleep tile with total time asleep, bedtime/wake, and sleep stage breakdown.",
      preview: true,
    },
    {
      type: "daily-activity-card",
      name: "Daily Activity",
      description: "A styled daily activity tile with heart rate, active calories, distance, exercise and flights.",
      preview: true,
    }
  );
})();
