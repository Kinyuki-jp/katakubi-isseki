const header = document.querySelector("[data-header]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const calendarTitle = document.querySelector("[data-calendar-title]");
const selectedText = document.querySelector("[data-selected-text]");
const slotList = document.querySelector("[data-slot-list]");
const mailLink = document.querySelector("[data-mail-link]");
const adminDate = document.querySelector("[data-admin-date]");
const adminTime = document.querySelector("[data-admin-time]");
const adminSlotList = document.querySelector("[data-admin-slot-list]");
const saveStatus = document.querySelector("[data-save-status]");
const importJson = document.querySelector("[data-import-json]");

const STORAGE_KEY = "katakubi-isseki-availability-v1";

const defaultAvailability = {
  "2026-06-26": ["12:10", "16:40", "18:20"],
  "2026-06-27": ["10:30", "13:30"],
  "2026-06-30": ["12:10", "17:40"],
  "2026-07-01": ["12:10", "16:40"],
  "2026-07-03": ["11:30", "18:20"],
  "2026-07-04": ["10:30", "14:20"],
  "2026-07-07": ["12:10", "17:40"],
  "2026-07-09": ["15:10", "18:20"],
  "2026-07-11": ["10:30", "13:30"],
  "2026-07-14": ["12:10", "16:40"],
  "2026-07-16": ["11:30", "18:20"],
  "2026-07-18": ["10:30", "14:20"],
};

const cloneAvailability = (source) => JSON.parse(JSON.stringify(source));

let availability = cloneAvailability(defaultAvailability);
let viewYear = 2026;
let viewMonth = 5;
let selectedDate = "";
let selectedSlot = "";
let isDirty = false;

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const pad = (value) => String(value).padStart(2, "0");

function normalizeAvailability(source) {
  const normalized = {};
  Object.entries(source || {}).forEach(([dateKey, slots]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Array.isArray(slots)) return;
    const validSlots = [...new Set(slots)]
      .filter((slot) => typeof slot === "string" && /^\d{2}:\d{2}$/.test(slot))
      .sort();
    if (validSlots.length) normalized[dateKey] = validSlots;
  });
  return Object.fromEntries(Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b)));
}

async function loadPublishedAvailability() {
  try {
    const response = await fetch("./availability.json", { cache: "no-store" });
    if (!response.ok) return cloneAvailability(defaultAvailability);
    const parsed = normalizeAvailability(await response.json());
    return Object.keys(parsed).length ? parsed : cloneAvailability(defaultAvailability);
  } catch {
    return cloneAvailability(defaultAvailability);
  }
}

async function loadAvailability() {
  const published = await loadPublishedAvailability();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return published;
    const parsed = normalizeAvailability(JSON.parse(stored));
    return Object.keys(parsed).length ? parsed : published;
  } catch {
    return published;
  }
}

function firstAvailableDate() {
  return Object.keys(availability).sort()[0] || "";
}

const formatDate = (dateKey) => {
  if (!dateKey) return "未選択";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${month}月${day}日(${["日", "月", "火", "水", "木", "金", "土"][date.getDay()]})`;
};

const markDirty = (dirty = true) => {
  isDirty = dirty;
  if (!saveStatus) return;
  saveStatus.textContent = dirty ? "未保存の変更があります" : "保存済み";
  saveStatus.classList.toggle("is-dirty", dirty);
};

const persistAvailability = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(availability));
  markDirty(false);
};

const ensureVisibleMonth = () => {
  if (!selectedDate) return;
  const [year, month] = selectedDate.split("-").map(Number);
  viewYear = year;
  viewMonth = month - 1;
};

const updateMailLink = () => {
  const dateLabel = selectedDate ? formatDate(selectedDate) : "未選択";
  const slotLabel = selectedSlot || "未選択";
  selectedText.textContent = selectedDate ? `${dateLabel} ${slotLabel}` : "日程を選んでください";

  const subject = "肩首一席 予約希望";
  const body = [
    "肩首一席の予約を希望します。",
    "",
    `希望日時：${dateLabel} ${slotLabel}`,
    "コース：30分 1,000円",
    "来店回数：初回 / 2回目",
    "気になる部位：肩 / 首 / 肩甲骨まわり",
    "名前：",
  ].join("\n");

  mailLink.href = `mailto:booking@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const renderSlots = () => {
  slotList.innerHTML = "";
  const slots = selectedDate ? availability[selectedDate] || [] : [];

  if (!slots.length) {
    const empty = document.createElement("p");
    empty.className = "reserve-note";
    empty.textContent = "この日は満席です。別の日を選んでください。";
    slotList.append(empty);
    selectedSlot = "";
    updateMailLink();
    return;
  }

  if (!slots.includes(selectedSlot)) {
    selectedSlot = slots[0];
  }

  slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slot-button${slot === selectedSlot ? " is-selected" : ""}`;
    button.textContent = slot;
    button.addEventListener("click", () => {
      selectedSlot = slot;
      renderSlots();
      updateMailLink();
    });
    slotList.append(button);
  });

  updateMailLink();
};

const renderCalendar = () => {
  calendarGrid.innerHTML = "";
  const monthStart = new Date(viewYear, viewMonth, 1);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  calendarTitle.textContent = `${viewYear}年${viewMonth + 1}月`;

  for (let i = 0; i < firstWeekday; i += 1) {
    const spacer = document.createElement("button");
    spacer.className = "day";
    spacer.type = "button";
    spacer.disabled = true;
    spacer.setAttribute("aria-hidden", "true");
    calendarGrid.append(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    const slots = availability[dateKey] || [];
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "day",
      slots.length ? "is-available" : "",
      selectedDate === dateKey ? "is-selected" : "",
    ].filter(Boolean).join(" ");
    button.disabled = !slots.length;
    button.innerHTML = `<span class="day-number">${day}</span><span class="day-status">${slots.length ? `空き ${slots.length}` : "満席"}</span>`;

    if (slots.length) {
      button.setAttribute("aria-label", `${formatDate(dateKey)} 空き枠${slots.length}件`);
      button.addEventListener("click", () => {
        selectedDate = dateKey;
        selectedSlot = availability[dateKey][0];
        renderCalendar();
        renderSlots();
        renderAdminSlots();
      });
    }

    calendarGrid.append(button);
  }
};

const renderAdminSlots = () => {
  if (!adminSlotList) return;
  adminSlotList.innerHTML = "";
  const entries = Object.entries(availability);

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "reserve-note";
    empty.textContent = "設定済みの時間枠はありません。";
    adminSlotList.append(empty);
    return;
  }

  entries.forEach(([dateKey, slots]) => {
    const row = document.createElement("div");
    row.className = "editor-day";
    row.innerHTML = `<strong>${formatDate(dateKey)}</strong><div class="editor-slot-row"></div>`;
    const slotRow = row.querySelector(".editor-slot-row");

    slots.forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "remove-slot";
      button.innerHTML = `<i data-lucide="x" aria-hidden="true"></i>${slot}`;
      button.setAttribute("aria-label", `${formatDate(dateKey)} ${slot}を削除`);
      button.addEventListener("click", () => {
        availability[dateKey] = availability[dateKey].filter((item) => item !== slot);
        if (!availability[dateKey].length) delete availability[dateKey];
        if (selectedDate === dateKey && selectedSlot === slot) {
          selectedDate = firstAvailableDate();
          selectedSlot = availability[selectedDate]?.[0] || "";
          ensureVisibleMonth();
        }
        markDirty();
        refreshAll();
      });
      slotRow.append(button);
    });

    adminSlotList.append(row);
  });

  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2 } });
};

const addSlot = () => {
  const dateKey = adminDate.value;
  const slot = adminTime.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(slot)) {
    markDirty(true);
    saveStatus.textContent = "日付と時間を選んでください";
    return;
  }

  availability[dateKey] = [...new Set([...(availability[dateKey] || []), slot])].sort();
  selectedDate = dateKey;
  selectedSlot = slot;
  ensureVisibleMonth();
  markDirty();
  refreshAll();
};

const exportAvailability = () => {
  const blob = new Blob([JSON.stringify(availability, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "availability.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const importAvailability = () => {
  try {
    const parsed = normalizeAvailability(JSON.parse(importJson.value));
    if (!Object.keys(parsed).length) throw new Error("empty");
    availability = parsed;
    selectedDate = firstAvailableDate();
    selectedSlot = availability[selectedDate]?.[0] || "";
    ensureVisibleMonth();
    persistAvailability();
    refreshAll();
  } catch {
    saveStatus.textContent = "JSONの形式を確認してください";
    saveStatus.classList.add("is-dirty");
  }
};

const refreshAll = () => {
  renderCalendar();
  renderSlots();
  renderAdminSlots();
};

document.querySelectorAll("[data-month-shift]").forEach((button) => {
  button.addEventListener("click", () => {
    const shift = Number(button.dataset.monthShift);
    const next = new Date(viewYear, viewMonth + shift, 1);
    viewYear = next.getFullYear();
    viewMonth = next.getMonth();
    renderCalendar();
  });
});

document.querySelector("[data-add-slot]")?.addEventListener("click", addSlot);
document.querySelector("[data-save-slots]")?.addEventListener("click", persistAvailability);
document.querySelector("[data-export-slots]")?.addEventListener("click", exportAvailability);
document.querySelector("[data-import-slots]")?.addEventListener("click", importAvailability);
document.querySelector("[data-reset-slots]")?.addEventListener("click", () => {
  availability = cloneAvailability(defaultAvailability);
  selectedDate = firstAvailableDate();
  selectedSlot = availability[selectedDate]?.[0] || "";
  ensureVisibleMonth();
  persistAvailability();
  refreshAll();
});

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const boot = async () => {
  availability = await loadAvailability();
  selectedDate = firstAvailableDate();
  selectedSlot = availability[selectedDate]?.[0] || "";
  if (adminDate) adminDate.value = selectedDate || "2026-06-26";
  if (adminTime) adminTime.value = selectedSlot || "12:10";
  ensureVisibleMonth();
  refreshAll();
  markDirty(false);

  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2,
      },
    });
  }
};

boot();
