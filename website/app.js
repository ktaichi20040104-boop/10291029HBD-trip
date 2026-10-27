(() => {
  "use strict";

  const STORAGE_KEY = "hbd-mizusa-static-v1";
  const SESSION_KEY = "hbd-mizusa-static-session-v1";
  const SESSION_MS = 15 * 60 * 60 * 1000;
  const PARKS = {
    land: { name: "ディズニーランド", date: "NOVEMBER 1", dateLabel: "11.01", icon: "✦" },
    sea: { name: "ディズニーシー", date: "NOVEMBER 2", dateLabel: "11.02", icon: "☾" }
  };
  const app = document.querySelector("#app");

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        pin: typeof stored.pin === "string" ? stored.pin : "",
        items: Array.isArray(stored.items) ? stored.items.filter(validItem) : []
      };
    } catch {
      return { pin: "", items: [] };
    }
  }

  function validItem(item) {
    return item && typeof item.id === "string" && typeof item.title === "string" &&
      Object.hasOwn(PARKS, item.park) && typeof item.completed === "boolean";
  }

  let state = readState();
  let message = "";
  let toastTimer;

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function hasSession() {
    const expiry = Number(sessionStorage.getItem(SESSION_KEY));
    if (Number.isFinite(expiry) && expiry > Date.now()) return true;
    sessionStorage.removeItem(SESSION_KEY);
    return false;
  }

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
    message = "";
    render();
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function renderPinSetup() {
    app.className = "trip-app";
    const isSetup = !state.pin;
    app.innerHTML = `
      <section class="pin-shell"><div class="pin-card">
        <p class="hero-kicker">A LITTLE PRIVATE TRIP</p>
        <h1>ふたりの旅へ<br><span>おかえりなさい</span></h1>
        <p class="pin-copy">${isSetup ? "最初に4桁の暗証番号を決めてね。" : "暗証番号を入力して、旅のアプリを開いてね。"}</p>
        ${message ? `<p class="pin-message" role="alert">${escapeHTML(message)}</p>` : ""}
        <form id="pin-form" class="pin-form">
          <label for="pin">4桁の暗証番号</label>
          <input id="pin" name="pin" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="${isSetup ? "new-password" : "current-password"}" required autofocus>
          ${isSetup ? `<label for="pin-confirmation">確認のためもう一度入力</label><input id="pin-confirmation" name="pinConfirmation" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password" required>` : ""}
          <button class="pin-submit" type="submit">${isSetup ? "暗証番号を設定して始める" : "旅のアプリを開く"}</button>
        </form>
        <p class="pin-expiry">解除後15時間で、もう一度暗証番号が必要になります。</p>
      </div></section>`;
    document.querySelector("#pin-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const pin = String(form.get("pin") || "");
      if (!/^\d{4}$/.test(pin)) {
        message = "暗証番号は数字4桁で入力してね。";
      } else if (isSetup) {
        if (pin !== form.get("pinConfirmation")) message = "2回の暗証番号が一致しないよ。もう一度確認してね。";
        else { state.pin = pin; saveState(); unlock(); return; }
      } else if (pin === state.pin) {
        unlock();
        return;
      } else {
        message = "暗証番号が違うみたい。もう一度試してね。";
      }
      renderPinSetup();
    });
  }

  function renderHome() {
    app.className = "trip-app is-home";
    app.innerHTML = `
      <header class="hero">
        <p class="hero-kicker">OUR BIRTHDAY TRIP · OCT 31 — NOV 2</p>
        <h1>ふたりでつくる<br><span>ディズニーの思い出</span></h1>
        <p class="hero-copy">やってみたい日を選んでね。</p>
        <nav class="day-nav" aria-label="旅行の日程">
          ${Object.entries(PARKS).map(([key, park]) => `<a class="day-choice" href="?park=${key}"><span class="choice-date">${park.dateLabel}</span><strong>${key.toUpperCase()}</strong><span class="choice-action">タップして選ぶ <b aria-hidden="true">›</b></span></a>`).join("")}
        </nav>
      </header>
      <footer class="trip-footer">10.31 HOTEL & DINNER　·　11.01 LAND　·　11.02 SEA <span>♡</span><button class="lock-link" type="button" data-action="lock">今すぐロック</button></footer>`;
  }

  function renderPark(parkKey) {
    const park = PARKS[parkKey];
    const items = state.items.filter((item) => item.park === parkKey);
    const completed = items.filter((item) => item.completed).length;
    const progress = items.length ? Math.round(completed * 100 / items.length) : 0;
    app.className = "trip-app";
    app.innerHTML = `
      <header class="hero">
        <p class="hero-kicker">OUR BIRTHDAY TRIP · OCT 31 — NOV 2</p>
        <h1>ふたりでつくる<br><span>ディズニーの思い出</span></h1>
        <p class="hero-copy">やりたいことをチェックして、思い出にしよう。</p>
        <a class="back-button" href="./index.html">← 日付選択に戻る</a>
      </header>
      <section class="park-grid" aria-label="パークのやりたいこと">
        <article class="park-card ${parkKey}-card">
          <div class="park-heading"><div><p class="park-date">${park.date}</p><h2>${park.name}</h2></div><span class="park-icon" aria-hidden="true">${park.icon}</span></div>
          <div class="progress-label"><span>思い出のチェック</span><strong>${completed} / ${items.length}</strong></div>
          <div class="progress-track" role="progressbar" aria-label="達成した項目" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="${completed}"><span style="width:${progress}%"></span></div>
          ${items.length ? `<ul class="wish-list">${items.map((item) => `<li class="wish-item ${item.completed ? "is-completed" : ""}"><button class="check-button" type="button" data-action="toggle" data-id="${escapeHTML(item.id)}" aria-label="${item.completed ? "未達成に戻す" : "達成にする"}"><span aria-hidden="true">${item.completed ? "✓" : ""}</span></button><span class="wish-title">${escapeHTML(item.title)}</span><button class="remove-button" type="button" data-action="remove" data-id="${escapeHTML(item.id)}" aria-label="${escapeHTML(item.title)}を削除">×</button></li>`).join("")}</ul>` : `<p class="empty-state">まだリストは空っぽ。<br>ふたりの「やりたい」を追加しよう。</p>`}
        </article>
      </section>
      <section class="add-card">
        <div><p class="section-kicker">MAKE A LITTLE PLAN</p><h2>やりたいことを追加</h2><p class="add-copy">思いついたらここに書き留めてね。</p></div>
        <form id="wish-form" class="wish-form"><label for="wish-title">やりたいこと</label><div class="input-row"><input id="wish-title" name="title" type="text" placeholder="例：ふたりで写真を撮る" maxlength="80" required><button type="submit">追加する ＋</button></div></form>
      </section>
      <footer class="trip-footer">10.31 HOTEL & DINNER　·　11.01 LAND　·　11.02 SEA <span>♡</span><button class="lock-link" type="button" data-action="lock">今すぐロック</button></footer>
      ${message ? `<p class="toast" role="status">${escapeHTML(message)}</p>` : ""}`;

    document.querySelector("#wish-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.querySelector("#wish-title");
      const title = input.value.trim();
      if (!title) return;
      state.items.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title: title.slice(0, 80), park: parkKey, completed: false });
      saveState();
      message = "やりたいことを追加したよ ✨";
      renderPark(parkKey);
      showToast();
    });
  }

  function showToast() {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      message = "";
      if (hasSession() && new URLSearchParams(location.search).has("park")) renderPark(currentPark());
    }, 2200);
  }

  function currentPark() {
    const selected = new URLSearchParams(location.search).get("park");
    return Object.hasOwn(PARKS, selected) ? selected : "land";
  }

  function render() {
    if (!state.pin || !hasSession()) {
      renderPinSetup();
      return;
    }
    const selected = new URLSearchParams(location.search).get("park");
    if (Object.hasOwn(PARKS, selected)) renderPark(selected);
    else renderHome();
  }

  app.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "lock") {
      sessionStorage.removeItem(SESSION_KEY);
      message = "";
      render();
    } else if (action === "toggle" || action === "remove") {
      const item = state.items.find((entry) => entry.id === button.dataset.id);
      if (!item) return;
      if (action === "toggle") item.completed = !item.completed;
      else if (window.confirm("この項目を削除する？")) state.items = state.items.filter((entry) => entry.id !== item.id);
      else return;
      saveState();
      renderPark(item.park);
    }
  });

  window.addEventListener("pageshow", () => { if (!hasSession()) render(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !hasSession()) render(); });
  render();
})();
