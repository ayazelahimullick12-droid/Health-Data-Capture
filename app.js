// Health Data Capture prototype - SK mobile app (BRD FR-B-001..005) + shared state for the dashboard.
(function () {
  "use strict";
  const H = window.HDC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("hdc." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("hdc." + k, JSON.stringify(v)); } catch (e) { } },
  };

  // ---------------- shared state ----------------
  const S = {
    lang: store.get("lang", "bn"), online: store.get("online", true), user: null, stack: [], fails: 0, lockUntil: 0,
    local: store.get("local", []), // surveys entered in this browser (demo)
    listeners: [],
  };
  const allRecords = () => [...S.local, ...H.RECORDS];
  const synced = () => allRecords().filter(r => r.synced);
  const onChange = fn => S.listeners.push(fn);
  const changed = () => { store.set("local", S.local); S.listeners.forEach(f => f()); };

  // ---------------- language ----------------
  const L = {
    appName: ["হেলথ ডাটা ক্যাপচার", "Health Data Capture"],
    home: ["হোম", "Home"], create: ["তৈরি করুন", "Create"], surveys: ["জরিপের তালিকা", "Survey List"], pending: ["সিঙ্ক বাকি", "Pending Sync"],
    dashboard: ["ড্যাশবোর্ড", "Dashboard"], logout: ["লগআউট", "Logout"], syncNow: ["এখন সিঙ্ক করুন", "Sync now"],
    goOffline: ["অফলাইন মোড (ডেমো)", "Go offline (demo)"], goOnline: ["অনলাইন মোড (ডেমো)", "Go online (demo)"],
    selectApp: ["অ্যাপ্লিকেশন নির্বাচন করুন", "Select Application"], healthApp: ["হেলথ ডাটা রেকর্ড", "Health Data Record"], healthDash: ["হেলথ ডাটা ড্যাশবোর্ড", "Health Data Dashboard"],
    isMember: ["ক্লায়েন্ট কি ব্র্যাক মেম্বার?", "Is client BRAC member or not?"], member: ["ব্র্যাক মেম্বার", "BRAC Member"], nonMember: ["নন-ব্র্যাক মেম্বার", "Non-BRAC Member"], cancel: ["বাতিল", "Cancel"],
    nidTitle: ["NID / স্মার্ট আইডি", "NID / Smart ID"], nidHint: ["ক্লায়েন্টের NID বা স্মার্ট আইডি নম্বর লিখুন", "Enter the client's NID or Smart ID number"],
    validate: ["যাচাই করুন", "Validate"], proceed: ["এগিয়ে যান", "Proceed"], back: ["পেছনে", "Back"], backHome: ["মূল মেনুতে ফিরে যান", "Back to main menu"],
    history: ["পূর্ববর্তী স্বাস্থ্য ইতিহাস", "Previous health history"], noHistory: ["পূর্ববর্তী কোনো স্বাস্থ্য তথ্য নেই", "No previous health history"],
    newPerson: ["নতুন ব্যক্তি — আগের কোনো তথ্য পাওয়া যায়নি। এগিয়ে গিয়ে নতুন তথ্য দিন।", "New person — no existing profile or previous information. Proceed to enter new data."],
    nidFormat: ["NID ১০, ১৩ বা ১৭ সংখ্যার হতে হবে", "NID must be 10, 13 or 17 digits"],
    branchMismatch: ["এই NID/Smart ID আপনার বর্তমান ব্রাঞ্চের কোনো মেম্বারের সাথে মেলেনি।", "NID/Smart ID does not match a member of your current branch."],
    isMemberStop: ["আপনি যে ব্যক্তির NID/Smart ID দিয়েছেন উনি একজন ব্র্যাক মেম্বার, দয়া করে Back বাটনে ক্লিক করে পুনরায় সঠিক তথ্য প্রদান করুন।", "The NID/Smart ID you entered belongs to a BRAC member. Please press Back and enter the correct information."],
    survey: ["স্বাস্থ্য জরিপ", "Health Data Survey"], general: ["সাধারণ", "General"], pkg: ["প্যাকেজ", "Package"], selectPkg: ["প্যাকেজের প্রশ্ন দেখতে উপরে প্যাকেজের ধরন নির্বাচন করুন", "Select the package type above to see the package questions"],
    socio: ["আর্থ-সামাজিক জরিপ", "Socio Economic Survey"], optional: ["ঐচ্ছিক", "Optional"], assetInfo: ["সম্পদের তথ্য", "Asset info"], personal: ["ব্যক্তিগত", "Personal"],
    submit: ["জমা দিন", "Submit"], select: ["নির্বাচন করুন", "Select"], required: ["এই তথ্যটি আবশ্যক", "This field is required"],
    fixErrors: ["লাল চিহ্নিত আবশ্যক ঘরগুলো পূরণ করুন", "Fill in the required fields marked in red"],
    submitted: ["জরিপ সফলভাবে জমা হয়েছে", "Survey submitted"], savedOffline: ["অফলাইনে সংরক্ষিত — ইন্টারনেট পেলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে", "Saved offline — it will sync automatically when internet is available"],
    syncing: ["সার্ভারের সাথে সিঙ্ক হচ্ছে… (ডেমো)", "Syncing with server… (demo)"], synced: ["সিঙ্ক সম্পন্ন", "Sync complete"],
    offlineBanner: ["আপনি অফলাইনে আছেন। জরিপ ফোনে সংরক্ষিত হবে এবং ইন্টারনেট পেলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।", "You are offline. Surveys are saved on the phone and sync automatically when internet is back."],
    lastSync: ["সর্বশেষ সিঙ্ক", "Last sync"], todayCount: ["আজকের জরিপ", "Today's surveys"], waiting: ["অপেক্ষমাণ", "waiting"],
    noData: ["কোনো তথ্য পাওয়া যায়নি", "Data is not available"], details: ["বিস্তারিত", "Details"], memberNo: ["মেম্বার নং", "Member No"], vo: ["ভিও", "VO"],
    pin: ["পিন", "PIN"], password: ["পাসওয়ার্ড", "Password"], login: ["এসএসও দিয়ে লগইন", "Login with SSO"],
    badPin: ["ভুল পিন বা পাসওয়ার্ড", "Wrong PIN or password"], locked: ["অনেকবার ভুল চেষ্টা। কিছুক্ষণ পর আবার চেষ্টা করুন।", "Too many failed attempts. Try again shortly."],
    surveyed: ["জরিপকৃত রোগী", "Patients surveyed"], members: ["মেম্বার", "Members"], nonMembers: ["নন-মেম্বার", "Non-members"], p1: ["প্যাকেজ ১ সেবা", "Package 1 services"], p2: ["প্যাকেজ ২ সেবা", "Package 2 services"],
    testSummary: ["টেস্ট সারসংক্ষেপ", "Test Summary"], surveySummary: ["জরিপ সারসংক্ষেপ", "Survey Summary"], glassesYes: ["চশমা প্রয়োজন: হ্যাঁ", "Glasses needed: Yes"], glassesNo: ["চশমা প্রয়োজন: না", "Glasses needed: No"],
    tHb: ["হিমোগ্লোবিন টেস্ট", "Haemoglobin test"], tUrine: ["ইউরিন টেস্ট", "Urine test"], tDiab: ["ডায়াবেটিস টেস্ট", "Diabetes test"], tBp: ["প্রেশার টেস্ট", "Pressure test"], tEye: ["চোখের টেস্ট", "Eye test"],
    scope: ["এলাকা", "Scope"], recent: ["সাম্প্রতিক জরিপ", "Recent surveys"], seeAll: ["সব দেখুন", "See all"], date: ["তারিখ", "Date"], synced2: ["সিঙ্কড", "Synced"], pend2: ["বাকি", "Pending"],
  };
  const t = k => (L[k] ? L[k][S.lang === "bn" ? 0 : 1] : k);
  const lbl = q => (S.lang === "bn" ? q.bn : q.en);
  const opt = (q, i) => (q.opts && q.opts[i] ? (S.lang === "bn" ? q.opts[i].bn : q.opts[i].en) : "");
  const bnDigits = s => S.lang === "bn" ? String(s).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]) : String(s);
  const toAscii = s => String(s || "").replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
  const fmtDate = iso => { const [y, m, d] = iso.split("-"); return bnDigits(`${d}-${m}-${y}`); };
  const todayIso = () => new Date().toISOString().slice(0, 10);

  // ---------------- role scope (FR-B-007) ----------------
  function scopeOf(user) {
    if (!user) return {};
    switch (user.role) {
      case "BM": return { branch: user.branch };
      case "AM": return { area: user.area };
      case "RC": return { region: user.region };
      case "DC": return { division: user.division };
      default: return {};
    }
  }
  const inScope = (r, sc) => Object.entries(sc).every(([k, v]) => !v || r[k] === v);
  function agg(rs) {
    const a = { total: rs.length, members: 0, nonMembers: 0, p1: 0, p2: 0, hb: 0, urine: 0, diab: 0, bp: 0, eye: 0, glassYes: 0, glassNo: 0 };
    for (const r of rs) {
      r.clientType === 0 ? a.members++ : a.nonMembers++;
      r.package === 0 ? a.p1++ : a.p2++;
      if (r.hb !== "" && r.hb != null) a.hb++;
      if (r.urine) a.urine++;
      if (r.diabetes) a.diab++;
      if (r.bp) a.bp++;
      a.eye++; // eye test is part of both packages
      if (r.glasses === 0) a.glassYes++; else if (r.glasses === 1) a.glassNo++;
    }
    return a;
  }
  window.HDCX = { S, allRecords, synced, onChange, changed, scopeOf, inScope, agg, store };

  // ---------------- shell helpers ----------------
  const content = $("#content"), layer = $("#layer");
  const SYNC = size => `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px"><path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`;
  const icon = (id, size = 24, color) => `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px${color ? ";color:" + color : ""}"><use href="#${id}"/></svg>`;
  function toast(msg, ms = 2400) { $$(".toast", layer).forEach(x => x.remove()); const d = document.createElement("div"); d.className = "toast"; d.textContent = msg; layer.appendChild(d); setTimeout(() => d.remove(), ms); }
  function closeLayer() { layer.innerHTML = ""; }
  function scrim(html, dismiss = true) {
    const sc = document.createElement("div"); sc.className = "dlg-scrim"; sc.innerHTML = html;
    if (dismiss) sc.addEventListener("click", e => { if (e.target === sc) sc.remove(); });
    layer.appendChild(sc); return sc;
  }
  function alertDlg(title, msg, buttons = [{ label: "OK" }]) {
    const sc = scrim(`<div class="alert">${title ? `<h3>${esc(title)}</h3>` : ""}<p>${esc(msg)}</p><div class="acts"></div></div>`);
    for (const b of buttons) { const el = document.createElement("button"); el.textContent = b.label; el.onclick = () => { sc.remove(); b.fn && b.fn(); }; $(".acts", sc).appendChild(el); }
  }
  function progress(msg, ms, done) { const sc = scrim(`<div class="progress"><div class="spin"></div><div>${esc(msg)}</div></div>`, false); setTimeout(() => { sc.remove(); done && done(); }, ms); }

  function setTitle(s) { $("#title").textContent = s; }
  function chrome(on) { $(".abar").style.display = on ? "" : "none"; }
  function go(name, arg, opt = {}) { if (opt.replace) S.stack.pop(); S.stack.push([name, arg]); render(); }
  function back() {
    if ($(".dlg-scrim", layer) || $(".menu-pop", layer)) return closeLayer();
    if ($("#drawer").classList.contains("on")) return drawer(false);
    if (S.stack.length > 1) { S.stack.pop(); render(); } else toast(S.lang === "bn" ? "এটিই প্রথম স্ক্রিন" : "Already on the first screen");
  }
  function homeName() { return S.user && S.user.role === "SK" ? "home" : "mhome"; }
  function goHome() { S.stack = [["apps"], [homeName()]]; render(); }

  function render() {
    closeLayer(); drawer(false);
    const [name, arg] = S.stack[S.stack.length - 1] || ["login"];
    content.scrollTop = 0;
    chrome(name !== "login");
    SCREENS[name](arg);
    updateChrome(name);
    document.dispatchEvent(new CustomEvent("hdc:screen", { detail: { name, arg } }));
  }
  function updateChrome(name) {
    $("#net").textContent = S.online ? "4G" : (S.lang === "bn" ? "অফলাইন" : "Offline");
    $("#net").style.background = S.online ? "" : "#b71c1c";
    $$("#lsw span").forEach(s => s.classList.toggle("on", s.dataset.l === S.lang));
    // like DCS, the language switch sits in the toolbar on the home screen only
    $("#lsw").style.display = name === "home" || name === "mhome" || name === "apps" ? "" : "none";
  }

  // ---------------- screens ----------------
  const SCREENS = {};

  SCREENS.login = () => {
    setTitle("");
    const roles = Object.keys(H.USERS);
    const sel = store.get("role", "SK");
    content.innerHTML = `<div class="login">
      <div class="lsw lsw-login" id="lswLogin"><span data-l="en" class="${S.lang === "en" ? "on" : ""}">En</span><span data-l="bn" class="${S.lang === "bn" ? "on" : ""}">বাং</span></div>
      <img src="img/logo_text.png" alt="BRAC">
      <h1>${esc(t("appName"))}</h1><div class="sub">BRAC Microfinance · Dabi</div>
      <div class="lf">${esc(t("pin"))}<input id="pin" inputmode="numeric" maxlength="6" value="${esc(H.USERS[sel].pin)}"></div>
      <div class="lf">${esc(t("password"))}<input id="pwd" type="password" value="demo1234"></div>
      <div id="lerr"></div>
      <button class="lbtn" id="lbtn">${esc(t("login"))}</button>
      <div class="demo-box"><div class="demo">${S.lang === "bn" ? "ডেমো ব্যবহারকারী (পিন বসিয়ে দেয়)" : "Demo users (fills the PIN)"}</div>
      <div class="roles">${roles.map(r => `<button data-r="${r}" class="${r === sel ? "on" : ""}">${r}</button>`).join("")}</div>
      <div class="demo">${S.lang === "bn" ? "প্রোটোটাইপ — কোনো সার্ভারে সংযোগ হয় না" : "Prototype — never contacts a server"}</div></div></div>`;
    $("#lswLogin").onclick = () => setLang(S.lang === "bn" ? "en" : "bn");
    $$(".roles button").forEach(b => b.onclick = () => { store.set("role", b.dataset.r); $("#pin").value = H.USERS[b.dataset.r].pin; $$(".roles button").forEach(x => x.classList.toggle("on", x === b)); $("#lerr").innerHTML = ""; });
    $("#lbtn").onclick = () => {
      const err = m => $("#lerr").innerHTML = `<div class="lerr">${esc(m)}</div>`;
      if (Date.now() < S.lockUntil) return err(t("locked") + ` (${Math.ceil((S.lockUntil - Date.now()) / 1000)}s)`);
      const pin = toAscii($("#pin").value.trim());
      const user = Object.values(H.USERS).find(u => u.pin === pin);
      if (!user || !$("#pwd").value) {
        S.fails++;
        if (S.fails >= 3) { S.lockUntil = Date.now() + 30000; S.fails = 0; return err(t("locked") + " (30s)"); }
        return err(`${t("badPin")} — ${3 - S.fails} ${S.lang === "bn" ? "বার চেষ্টা বাকি" : "attempts left"}`);
      }
      S.fails = 0; S.user = user;
      progress(S.lang === "bn" ? "এসএসও যাচাই হচ্ছে…" : "Signing in with SSO…", 700, () => { S.stack = [["apps"]]; buildDrawer(); render(); });
    };
  };

  // Process flow: "User Select Health Application"
  SCREENS.apps = () => {
    setTitle(t("selectApp"));
    content.innerHTML = `<div class="head-info">${esc(S.user.pin)} - ${esc(S.user.name)}<br>${esc(S.user.title)} · ${esc(S.user.branch)}</div>
      <div class="tiles one"><div class="tile" id="appHealth"><div class="box">${icon("ic-ic_survey-t", 40)}</div><div class="lbl">${esc(t("healthApp"))}</div></div></div>`;
    $("#appHealth").onclick = () => go(homeName());
  };

  SCREENS.home = () => {
    setTitle(t("appName"));
    const mine = S.local.filter(r => r.skPin === S.user.pin);
    const pend = mine.filter(r => !r.synced).length;
    const today = allRecords().filter(r => r.date === todayIso() && r.branch === S.user.branch).length;
    const recent = allRecords().filter(r => r.branch === S.user.branch).slice(0, 3);
    content.innerHTML = `<div class="head-info">${esc(S.user.pin)} - ${esc(S.user.name)}<br>${esc(S.user.branch)} · ${esc(S.user.area)}</div>
      <div class="sync-msg ${S.online ? "ok" : "warn"}">${S.online ? `${esc(t("lastSync"))}: ${bnDigits(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))}` : esc(S.lang === "bn" ? "অফলাইন" : "Offline")}</div>
      ${S.online ? "" : `<div class="banner warn">${esc(t("offlineBanner"))}</div>`}
      <button class="create-btn" id="createBtn">${icon("ic-ic_admission-t", 26)}${esc(t("create"))}</button>
      <div class="tiles">
        <div class="tile" data-go="list"><div class="box">${icon("ic-ic_baseline_list_alt_24-t", 40)}</div><div class="lbl">${esc(t("surveys"))}</div></div>
        <div class="tile" data-go="pending"><div class="box">${SYNC(40)}${pend ? `<span class="badge">${bnDigits(pend)}</span>` : ""}</div><div class="lbl">${esc(t("pending"))}</div></div>
        <div class="tile" data-go="today"><div class="box">${icon("ic-ic_baseline_date_range_24-t", 40)}${today ? `<span class="badge">${bnDigits(today)}</span>` : ""}</div><div class="lbl">${esc(t("todayCount"))}</div></div>
      </div>
      <div class="recent-head"><span>${esc(t("recent"))}</span><a id="seeAll">${esc(t("seeAll"))}</a></div>
      ${recent.length ? recent.map(r => surveyCard(r)).join("") : `<div class="empty">${esc(t("noData"))}</div>`}<div style="height:12px"></div>`;
    $$("[data-rid]").forEach(c => c.onclick = () => go("record", c.dataset.rid));
    $("#seeAll").onclick = () => go("list", "all");
    $("#createBtn").onclick = askClientType;
    $$("[data-go]").forEach(el => el.onclick = () => {
      const g = el.dataset.go;
      if (g === "list") go("list", "all"); else if (g === "pending") go("list", "pending"); else go("list", "today");
    });
  };

  // FR-B-003
  function askClientType() {
    const sc = scrim(`<div class="dcs-dlg"><div class="dt">${esc(t("isMember"))}</div><div class="db">
      <button data-ct="0">${esc(t("member"))}</button><button data-ct="1">${esc(t("nonMember"))}</button><button class="x">${esc(t("cancel"))}</button></div></div>`);
    $$("[data-ct]", sc).forEach(b => b.onclick = () => { sc.remove(); go("nid", +b.dataset.ct); });
    $(".x", sc).onclick = () => sc.remove();
  }

  // demo NIDs that exercise each validation path (prototype only)
  const DEMO_NIDS = [
    { ct: 0, nid: "1987654321098", bn: "এই ব্রাঞ্চের মেম্বার, আগের ইতিহাস আছে", en: "Member of this branch, with history" },
    { ct: 0, nid: "1985987654321", bn: "এই ব্রাঞ্চের মেম্বার, আগের ইতিহাস নেই", en: "Member of this branch, no history" },
    { ct: 0, nid: "1979246813579", bn: "অন্য ব্রাঞ্চের মেম্বার — আটকে যাবে", en: "Member of another branch — blocked" },
    { ct: 1, nid: "1990123456789", bn: "আসলে মেম্বার — থামিয়ে দেওয়া হবে", en: "Actually a member — process stops" },
    { ct: 1, nid: "1995112233445", bn: "আগে জরিপ হয়েছে — পুরনো তথ্য দেখাবে", en: "Surveyed before — shows existing record" },
    { ct: 1, nid: "1234567890", bn: "নতুন ব্যক্তি — কোনো আগের তথ্য নেই", en: "New person — no previous data" },
  ];

  // FR-B-004 - NID / Smart ID entry and validation
  SCREENS.nid = (ct) => {
    setTitle(t("nidTitle"));
    content.innerHTML = `<div class="nid-hero"><span class="ct">${esc(ct === 0 ? t("member") : t("nonMember"))}</span>
        <h3>${esc(t("nidTitle"))}</h3><p>${esc(t("nidHint"))}</p></div>
      <div class="pad"><div class="frow stack"><div class="fin"><div class="fbox" id="nidBox"><input id="nidIn" inputmode="numeric" maxlength="17" placeholder="NID / Smart ID" style="font-size:20px;letter-spacing:.06em"></div><div id="nidErr"></div></div></div>
      <div style="margin-top:16px"><button class="bt block" id="valBtn">${esc(t("validate"))}</button></div></div>
      <div id="nidResult"></div>
      <div class="section collapse demo-nids" id="demoNids"><div class="st"><span>${S.lang === "bn" ? "ডেমো NID" : "Demo NIDs"}</span><small>${S.lang === "bn" ? "পরীক্ষার জন্য" : "for testing"}</small><span class="chev">▾</span></div>
        <div class="body">${DEMO_NIDS.filter(d => d.ct === ct).map(d => `<button class="dn" data-nid="${d.nid}"><b>${bnDigits(d.nid)}</b><span>${esc(S.lang === "bn" ? d.bn : d.en)}</span></button>`).join("")}</div></div>`;
    const inp = $("#nidIn"); inp.focus();
    $("#demoNids .st").onclick = () => $("#demoNids").classList.toggle("open");
    $$("#demoNids [data-nid]").forEach(b => b.onclick = () => { inp.value = b.dataset.nid; $("#valBtn").click(); });
    inp.addEventListener("keydown", e => { if (e.key === "Enter") $("#valBtn").click(); });
    $("#valBtn").onclick = () => {
      const nid = toAscii(inp.value).replace(/\D/g, "");
      $("#nidErr").innerHTML = ""; $("#nidBox").classList.remove("err");
      if (![10, 13, 17].includes(nid.length)) { $("#nidBox").classList.add("err"); $("#nidErr").innerHTML = `<div class="errtext">${esc(t("nidFormat"))}</div>`; return; }
      progress(S.lang === "bn" ? "NID যাচাই হচ্ছে…" : "Validating NID…", 600, () => validate(ct, nid));
    };
  };
  function validate(ct, nid) {
    const member = H.MEMBERS.find(m => m.nid === nid);
    const prev = allRecords().filter(r => r.nid === nid).sort((a, b) => b.date.localeCompare(a.date));
    const res = $("#nidResult");
    const backBtn = label => `<div class="btn-row"><button class="bt grey" id="toHome">${esc(label)}</button></div>`;
    if (ct === 0) {
      if (!member || member.branch !== S.user.branch) {
        res.innerHTML = `<div class="banner err">${icon("ic-ic_alert-t", 22, "#b71c1c")}<div>${esc(t("branchMismatch"))}</div></div>${backBtn(t("backHome"))}`;
        $("#toHome").onclick = goHome; return;
      }
      return go("profile", { ct, nid, person: { ...member, clientType: 0 }, prev }, { replace: false });
    }
    if (member) {
      res.innerHTML = `<div class="banner err" style="font-family:var(--app-font)">${icon("ic-ic_alert-t", 22, "#b71c1c")}<div>${esc(L.isMemberStop[0])}${S.lang === "en" ? `<div style="margin-top:6px;opacity:.85">${esc(L.isMemberStop[1])}</div>` : ""}</div></div>${backBtn(t("back"))}`;
      $("#toHome").onclick = goHome; return;
    }
    const known = H.KNOWN_NON_MEMBERS.find(k => k.nid === nid) || (prev[0] && { name: prev[0].name, nid, mobile: prev[0].mobile, headName: prev[0].headName, gender: prev[0].gender, birthYear: prev[0].birthYear });
    go("profile", { ct, nid, person: known ? { ...known, clientType: 1 } : null, prev });
  }

  // matched profile + previous health history
  SCREENS.profile = (a) => {
    setTitle(a.ct === 0 ? t("member") : t("nonMember"));
    const p = a.person;
    let h = "";
    if (p) {
      h += `<div class="profile"><div class="avatar"></div><div class="pi"><b>${esc(p.name)}</b><br>
        ${p.memberNo ? `${esc(t("memberNo"))}: ${bnDigits(p.memberNo)}<br>${esc(t("vo"))}: ${esc(p.vo)}<br>` : ""}
        NID: ${bnDigits(p.nid)}<br>${S.lang === "bn" ? "মোবাইল" : "Mobile"}: ${bnDigits(p.mobile)}<br>
        <span class="verified">${a.ct === 0 ? (S.lang === "bn" ? "মেম্বার যাচাইকৃত" : "Member verified") : (S.lang === "bn" ? "আগের রেকর্ড পাওয়া গেছে" : "Existing record found")}</span></div></div>`;
    } else h += `<div class="banner info">${esc(t("newPerson"))}</div>`;
    if (p) {
      h += `<div class="section" style="margin-top:12px"><div class="st">${icon("ic-ic_baseline_date_range_24-t", 20)}${esc(t("history"))}<small>${bnDigits(a.prev.length)}</small></div>`;
      h += a.prev.length ? a.prev.map(r => histCard(r)).join("") : `<div class="empty">${esc(t("noHistory"))}</div>`;
      h += `</div>`;
    }
    h += `<div class="sticky-bottom"><div class="btn-row"><button class="bt grey" id="pBack">${esc(t("back"))}</button><button class="bt" id="pGo">${esc(t("proceed"))}</button></div></div>`;
    content.innerHTML = h;
    $$("[data-rid]").forEach(c => c.onclick = () => go("record", c.dataset.rid));
    $("#pBack").onclick = back;
    $("#pGo").onclick = () => go("survey", { ct: a.ct, nid: a.nid, person: p });
  };
  function histCard(r) {
    const pk = H.GENERAL.find(q => q.k === "package"), sv = H.GENERAL.find(q => q.k === "service");
    return `<div class="card" data-rid="${esc(r.id)}" style="margin:8px 0"><div class="acc${r.synced ? "" : " pending"}"></div><div class="cb">
      <div class="row"><b>${fmtDate(r.date)}</b><span class="pill pk">${esc(opt(pk, r.package))}</span></div>
      <div>${esc(opt(sv, r.service))} · BP ${bnDigits(r.bp)}${r.hb ? ` · Hb ${bnDigits(r.hb)}` : ""}</div>
      <div class="muted">${esc(r.branch)} · ${esc(r.sk || "")}</div></div></div>`;
  }

  // read-only details of one survey (tap on a history item)
  SCREENS.record = (id) => {
    const r = allRecords().find(x => x.id === id);
    setTitle(t("details"));
    if (!r) { content.innerHTML = `<div class="empty">${esc(t("noData"))}</div>`; return; }
    const val = (q, v) => {
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return "—";
      if (q.type === "multi") return v.map(i => opt(q, i)).join(", ");
      if (q.opts && typeof v === "number") return opt(q, v);
      return bnDigits(v) + (q.unit ? " " + q.unit : "");
    };
    let h = `<div class="profile"><div class="avatar"></div><div class="pi"><b>${esc(r.name)}</b><br>${fmtDate(r.date)} · ${esc(r.id)}<br>${esc(r.branch)}, ${esc(r.area)}<br>
      <span class="pill ${r.synced ? "ok" : "pend"}">${esc(r.synced ? t("synced2") : t("pend2"))}</span></div></div>`;
    h += `<div class="section"><div class="st">${esc(t("general"))}</div>` + H.GENERAL.map(q => `<div class="kv"><span>${esc(lbl(q))}</span><span>${esc(val(q, r[q.k]))}</span></div>`).join("") + `</div>`;
    h += `<div class="section"><div class="st">${esc(opt(H.GENERAL.find(q => q.k === "package"), r.package))}</div>` + H.PACKAGE.filter(q => q.pkg.includes(r.package + 1)).map(q => `<div class="kv"><span>${esc(lbl(q))}</span><span>${esc(val(q, r[q.k]))}</span></div>`).join("") + `</div>`;
    if (r.socio) h += `<div class="section"><div class="st">${esc(t("socio"))}</div>` + H.SOCIO.map(q => `<div class="kv"><span>${esc(lbl(q))}</span><span>${esc(val(q, r.socio[q.k]))}</span></div>`).join("") + `</div>`;
    content.innerHTML = h;
  };

  // ---------------- the survey form (Mandatory Survey + optional Socio-Economic) ----------------
  function field(q, v, o = {}) {
    const req = q.req ? `<span class="star">*</span>` : "";
    let input;
    if (q.type === "readonly") input = `<div class="fbox ro"><input data-k="${q.k}" value="${esc(q.opts ? opt(q, v) : v)}" readonly></div>`;
    else if (q.type === "select") input = `<div class="fbox"><select data-k="${q.k}"><option value="">${esc(t("select"))}</option>${q.opts.map((x, i) => `<option value="${i}"${v === i ? " selected" : ""}>${esc(opt(q, i))}</option>`).join("")}</select></div>`;
    else if (q.type === "multi") return `<div class="frow stack" data-row="${q.k}"><label>${esc(lbl(q))}${req}</label><div class="fin"><div class="checks" data-k="${q.k}">${q.opts.map((x, i) => `<label><input type="checkbox" value="${i}"${(v || []).includes(i) ? " checked" : ""}>${esc(opt(q, i))}</label>`).join("")}</div></div></div>`;
    else if (q.type === "bp") { const [s, d] = String(v || "").split("/"); input = `<div class="fbox"><input data-k="bp_s" inputmode="numeric" maxlength="3" placeholder="${bnDigits(120)}" value="${esc(s || "")}"><span class="bpsep">/</span><input data-k="bp_d" inputmode="numeric" maxlength="3" placeholder="${bnDigits(80)}" value="${esc(d || "")}"><span class="unit">${q.unit}</span></div>`; }
    else {
      const im = q.type === "tel" || q.type === "year" ? "numeric" : q.type === "number" ? "decimal" : "text";
      const ph = q.ph ? (S.lang === "bn" ? q.ph.bn : q.ph.en) : q.type === "year" ? (S.lang === "bn" ? "যেমন ১৯৮৮" : "e.g. 1988") : "";
      input = `<div class="fbox"><input data-k="${q.k}" inputmode="${im}"${q.max ? ` maxlength="${q.max}"` : q.type === "year" ? ' maxlength="4"' : ""} placeholder="${esc(ph)}" value="${esc(v == null ? "" : v)}">${q.unit ? `<span class="unit">${q.unit}</span>` : ""}</div>`;
    }
    const long = lbl(q).length > 30;
    return `<div class="frow${o.stack || long ? " stack" : ""}" data-row="${q.k}"><label>${esc(lbl(q))}${req}</label><div class="fin">${input}</div></div>`;
  }
  SCREENS.survey = (a) => {
    setTitle(t("survey"));
    const p = a.person || {};
    const v = { name: p.name || "", clientType: a.ct, mobile: p.mobile || "", headName: p.headName || "", gender: p.gender, birthYear: p.birthYear || "", nid: a.nid };
    content.innerHTML = `<div class="section"><div class="st">${esc(t("general"))}<small>${esc(a.ct === 0 ? t("member") : t("nonMember"))}</small></div>${H.GENERAL.map(q => field(q, v[q.k])).join("")}</div>
      <div class="section" id="pkgSec"><div class="st">${esc(t("pkg"))}</div><div id="pkgBody"><div class="empty" style="padding:10px">${esc(t("selectPkg"))}</div></div></div>
      <div class="section collapse" id="socioSec"><div class="st"><span>${esc(t("socio"))}</span><small>${esc(t("optional"))}</small><span class="chev">▾</span></div><div class="body">
        <div class="subhead">${esc(t("assetInfo"))}</div>${H.SOCIO.filter(q => q.group === "asset").map(q => field(q, null, { stack: q.type === "multi" || q.k === "economic" || q.k === "house" })).join("")}
        <div class="subhead">${esc(t("personal"))}</div>${H.SOCIO.filter(q => q.group === "personal").map(q => field(q, null)).join("")}
      </div></div>
      <div class="sticky-bottom"><div class="btn-row"><button class="bt" id="subBtn">${esc(t("submit"))}</button></div></div>`;
    const pkgSel = $('select[data-k="package"]');
    const renderPkg = () => {
      const pk = pkgSel.value === "" ? null : +pkgSel.value + 1;
      $("#pkgSec .st").textContent = pk ? opt(H.GENERAL.find(q => q.k === "package"), pk - 1) : t("pkg");
      $("#pkgBody").innerHTML = pk ? H.PACKAGE.filter(q => q.pkg.includes(pk)).map(q => field(q, null)).join("") : `<div class="empty" style="padding:10px">${esc(t("selectPkg"))}</div>`;
    };
    pkgSel.addEventListener("change", renderPkg);
    $("#socioSec .st").onclick = () => $("#socioSec").classList.toggle("open");
    content.addEventListener("input", e => { const row = e.target.closest(".frow"); if (row) { $$(".fbox.err", row).forEach(b => b.classList.remove("err")); $$(".errtext", row).forEach(x => x.remove()); } });
    $("#subBtn").onclick = () => submit(a);
  };
  function readField(q) {
    if (q.type === "readonly") return null;
    if (q.type === "multi") { const box = $(`.checks[data-k="${q.k}"]`, content); return box ? $$("input:checked", box).map(i => +i.value) : []; }
    if (q.type === "bp") { const s = toAscii($('[data-k="bp_s"]', content)?.value || "").trim(), d = toAscii($('[data-k="bp_d"]', content)?.value || "").trim(); return s && d ? `${s}/${d}` : ""; }
    const el = $(`[data-k="${q.k}"]`, content); if (!el) return null;
    if (q.type === "select") return el.value === "" ? null : +el.value;
    return toAscii(el.value).trim();
  }
  function submit(a) {
    const rec = {}; const errs = [];
    const pkgV = readField(H.GENERAL.find(q => q.k === "package"));
    const qs = [...H.GENERAL, ...(pkgV == null ? [] : H.PACKAGE.filter(q => q.pkg.includes(pkgV + 1)))];
    for (const q of qs) {
      if (q.type === "readonly") continue;
      const v = readField(q); rec[q.k] = v;
      let bad = q.req && (v == null || v === "" || (Array.isArray(v) && !v.length && q.k !== "chronic"));
      if (q.k === "mobile" && v && !/^01\d{9}$/.test(v)) bad = true;
      if (q.k === "birthYear" && v && !(+v >= 1900 && +v <= new Date().getFullYear())) bad = true;
      if (bad) errs.push(q.k);
    }
    if (pkgV == null) errs.push("package");
    $$(".fbox.err", content).forEach(b => b.classList.remove("err")); $$(".errtext", content).forEach(x => x.remove());
    if (errs.length) {
      for (const k of errs) { const row = $(`[data-row="${k}"]`, content); if (!row) continue; const fb = $(".fbox", row); if (fb) fb.classList.add("err"); $(".fin", row).insertAdjacentHTML("beforeend", `<div class="errtext">${esc(t("required"))}</div>`); }
      const first = $(`[data-row="${errs[0]}"]`, content); if (first) content.scrollTop = first.offsetTop - 80;
      return toast(t("fixErrors"));
    }
    let socio = null;
    if ($("#socioSec").classList.contains("open") || H.SOCIO.some(q => { const v = readField(q); return v != null && v !== "" && !(Array.isArray(v) && !v.length); })) {
      socio = {}; for (const q of H.SOCIO) socio[q.k] = readField(q);
      if (!Object.values(socio).some(v => v != null && v !== "" && !(Array.isArray(v) && !v.length))) socio = null;
    }
    const u = S.user;
    const r = { ...rec, id: "HD-L" + Date.now().toString().slice(-6), date: todayIso(), division: u.division, region: u.region, area: u.area, branch: u.branch, sk: u.name, skPin: u.pin,
      clientType: a.ct, nid: a.nid, memberNo: a.person && a.person.memberNo || "", socio, synced: S.online, temp: rec.temp };
    progress(S.lang === "bn" ? "সংরক্ষণ হচ্ছে…" : "Saving…", 700, () => {
      S.local.unshift(r); changed();
      const sc = scrim(`<div class="alert"><h3>✓ ${esc(t("submitted"))}</h3><p>${esc(S.online ? (S.lang === "bn" ? "তথ্য সার্ভারে পাঠানো হয়েছে এবং ড্যাশবোর্ডে দেখা যাবে। (ডেমো)" : "Sent to the server and visible on the dashboard. (demo)") : t("savedOffline"))}</p><div class="acts"><button>OK</button></div></div>`, false);
      $("button", sc).onclick = () => { sc.remove(); goHome(); };
    });
  }

  // list of surveys entered on this phone + branch history
  SCREENS.list = (mode) => {
    const rs = (mode === "pending" ? S.local.filter(r => !r.synced) : mode === "today" ? allRecords().filter(r => r.date === todayIso() && r.branch === S.user.branch) : allRecords().filter(r => r.branch === S.user.branch));
    setTitle(mode === "pending" ? t("pending") : mode === "today" ? t("todayCount") : t("surveys"));
    content.innerHTML = (mode === "pending" && rs.length && S.online ? `<div class="pad"><button class="bt block" id="syncBtn">${esc(t("syncNow"))}</button></div>` : "")
      + (rs.length ? rs.slice(0, 60).map(r => surveyCard(r)).join("") : `<div class="empty">${esc(t("noData"))}</div>`);
    $$("[data-rid]").forEach(c => c.onclick = () => go("record", c.dataset.rid));
    if ($("#syncBtn")) $("#syncBtn").onclick = syncNow;
  };

  function surveyCard(r) {
    return `<div class="card" data-rid="${esc(r.id)}"><div class="acc${r.synced ? "" : " pending"}"></div><div class="cb">
      <div class="row"><b>${esc(r.name)}</b><span class="pill ${r.synced ? "ok" : "pend"}">${esc(r.synced ? t("synced2") : t("pend2"))}</span></div>
      <div>${fmtDate(r.date)} · ${esc(opt(H.GENERAL.find(q => q.k === "package"), r.package))} · ${esc(r.clientType === 0 ? t("member") : t("nonMember"))}</div>
      <div class="muted">NID ${bnDigits(r.nid)} · ${bnDigits(r.mobile || "")}</div></div></div>`;
  }

  // managers in the app: role-scoped dashboard (process flow lanes BM/AM, DC/RC, HO)
  SCREENS.mhome = () => {
    setTitle(t("healthDash"));
    const sc = scopeOf(S.user);
    const rs = synced().filter(r => inScope(r, sc));
    const LVL = { branch: ["ব্রাঞ্চ", "Branch"], area: ["এরিয়া", "Area"], region: ["রিজিয়ন", "Region"], division: ["বিভাগ", "Division"] };
    const scopeTxt = S.user.role === "HO" ? (S.lang === "bn" ? "সকল এলাকা" : "All demarcations") : Object.entries(sc).map(([k, v]) => `${LVL[k][S.lang === "bn" ? 0 : 1]}: ${v}`).join("");
    if (!rs.length) { content.innerHTML = `<div class="head-info">${esc(S.user.name)} (${esc(S.user.role)})<br>${esc(scopeTxt)}</div><div class="empty">${esc(t("noData"))}</div>`; return; }
    const a = agg(rs);
    content.innerHTML = `<div class="head-info">${esc(S.user.pin)} - ${esc(S.user.name)} (${esc(S.user.role)})<br>${esc(scopeTxt)}</div>
      <div class="section"><div class="st">${esc(t("surveySummary"))}<small>${S.lang === "bn" ? "শুরু থেকে আজ পর্যন্ত" : "Inception to date"}</small></div><div class="stats">
        <div class="stat w full"><span>${esc(t("surveyed"))}</span><b>${bnDigits(a.total)}</b></div>
        <div class="stat g"><span>${esc(t("members"))}</span><b>${bnDigits(a.members)}</b></div><div class="stat n"><span>${esc(t("nonMembers"))}</span><b>${bnDigits(a.nonMembers)}</b></div>
        <div class="stat y"><span>${esc(t("p1"))}</span><b>${bnDigits(a.p1)}</b></div><div class="stat o"><span>${esc(t("p2"))}</span><b>${bnDigits(a.p2)}</b></div></div></div>
      <div class="section"><div class="st">${esc(t("testSummary"))}</div><div class="stats">
        <div class="stat g"><span>${esc(t("tHb"))}</span><b>${bnDigits(a.hb)}</b></div><div class="stat g"><span>${esc(t("tUrine"))}</span><b>${bnDigits(a.urine)}</b></div>
        <div class="stat y"><span>${esc(t("tDiab"))}</span><b>${bnDigits(a.diab)}</b></div><div class="stat y"><span>${esc(t("tBp"))}</span><b>${bnDigits(a.bp)}</b></div>
        <div class="stat n"><span>${esc(t("tEye"))}</span><b>${bnDigits(a.eye)}</b></div><div class="stat o"><span>${esc(t("glassesYes"))}</span><b>${bnDigits(a.glassYes)}</b></div>
        <div class="stat w full"><span>${esc(t("glassesNo"))}</span><b>${bnDigits(a.glassNo)}</b></div></div></div>`;
  };

  // ---------------- sync / offline ----------------
  function syncNow() {
    const pend = S.local.filter(r => !r.synced);
    if (!S.online) return toast(t("offlineBanner"));
    if (!pend.length) return toast(t("synced"));
    progress(t("syncing"), 1200, () => { pend.forEach(r => r.synced = true); changed(); toast(`${t("synced")} (${bnDigits(pend.length)})`); render(); });
  }
  function setOnline(on) {
    S.online = on; store.set("online", on);
    if (S.user) render(); else updateChrome();
    if (on && S.local.some(r => !r.synced) && S.user) syncNow(); // auto-sync when the connection returns
    document.dispatchEvent(new CustomEvent("hdc:net"));
  }

  // ---------------- drawer & menu ----------------
  function drawer(on) { $("#drawer").classList.toggle("on", on); $("#scrim").classList.toggle("on", on); }
  function buildDrawer() {
    if (!S.user) return;
    const items = S.user.role === "SK"
      ? [["home", "ic-ic_baseline_home_24-t", t("home")], ["create", "ic-ic_admission-t", t("create")], ["list", "ic-ic_baseline_list_alt_24-t", t("surveys")], ["pending", "sync", t("pending")]]
      : [["mhome", "ic-ic_dashboard-t", t("healthDash")]];
    items.push(["logout", "ic-ic_exit-t", t("logout")]);
    $("#drawer").innerHTML = `<div class="dr-head"><img src="img/logo_text.png" alt=""></div><div class="dr-user"><b>${esc(S.user.name)}</b>${esc(S.user.title)} · ${esc(S.user.branch)}</div>`
      + items.map(([k, ic, l]) => `<div class="dr-item" data-k="${k}">${ic === "sync" ? SYNC(24) : icon(ic)}<span>${esc(l)}</span></div>`).join("");
    $$(".dr-item").forEach(el => el.onclick = () => {
      drawer(false); const k = el.dataset.k;
      if (k === "home" || k === "mhome") goHome(); else if (k === "create") { goHome(); askClientType(); }
      else if (k === "list") go("list", "all"); else if (k === "pending") go("list", "pending"); else if (k === "logout") logout();
    });
  }
  function logout() { S.user = null; S.stack = [["login"]]; render(); }
  function overflow() {
    closeLayer();
    const sc = document.createElement("div"); sc.style.cssText = "position:absolute;inset:0"; sc.onclick = closeLayer; layer.appendChild(sc);
    const m = document.createElement("div"); m.className = "menu-pop";
    const items = [["sync", t("syncNow")], ["net", S.online ? t("goOffline") : t("goOnline")]];
    if (S.local.length) items.push(["clear", S.lang === "bn" ? `ডেমো জরিপ মুছুন (${bnDigits(S.local.length)})` : `Clear demo surveys (${S.local.length})`]);
    items.push(["logout", t("logout")]);
    m.innerHTML = items.map(([k, l]) => `<div data-k="${k}">${esc(l)}</div>`).join(""); layer.appendChild(m);
    $$("div", m).forEach(d => d.onclick = () => {
      closeLayer(); const k = d.dataset.k;
      if (k === "sync") syncNow(); else if (k === "net") setOnline(!S.online);
      else if (k === "clear") alertDlg("", S.lang === "bn" ? "এই ব্রাউজারে জমা দেওয়া ডেমো জরিপগুলো মুছে যাবে।" : "Surveys entered in this browser will be removed.", [{ label: t("cancel") }, { label: "OK", fn: () => { S.local.length = 0; changed(); render(); } }]);
      else logout();
    });
  }

  // ---------------- init ----------------
  function setLang(l) { S.lang = l; store.set("lang", l); document.documentElement.lang = l; buildDrawer(); if (S.stack.length) render(); }
  $("#menuBtn").onclick = () => S.user && drawer(true);
  $("#scrim").onclick = () => drawer(false);
  $("#moreBtn").onclick = overflow;
  $("#lsw").onclick = () => setLang(S.lang === "bn" ? "en" : "bn");
  $("#navBack").onclick = back; $("#navHome").onclick = () => S.user ? goHome() : null;
  document.addEventListener("keydown", e => { if (e.key === "Escape") back(); });
  const clock = () => $("#clock").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  clock(); setInterval(clock, 15000);
  // scale the phone to fit the window
  function fit() {
    const ph = $("#phone");
    const k = Math.min(1, (window.innerHeight - 24) / ph.offsetHeight, (window.innerWidth - 16) / ph.offsetWidth);
    ph.style.transform = `scale(${k})`;
  }
  window.addEventListener("resize", fit); fit();
  document.documentElement.lang = S.lang;
  window.HDCX.ui = { setOnline, setLang, go, goHome, render, logout };
  S.stack = [["login"]]; render();
})();
