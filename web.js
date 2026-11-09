// TrendX "Health Data Dashboard" (BRD FR-B-006, FR-B-007, section 8 and the appendix reports).
// Reads the demo records plus the surveys submitted from the phone app in this browser (localStorage "hdc.local"),
// and refreshes when the phone tab syncs a new survey.
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
  const Q = k => [...H.GENERAL, ...H.PACKAGE, ...H.SOCIO].find(q => q.k === k);
  const en = (k, v) => { const q = Q(k); if (v == null || v === "") return ""; if (Array.isArray(v)) return v.map(i => q.opts[i] ? q.opts[i].en : i).join("; "); return q && q.opts && typeof v === "number" ? (q.opts[v] ? q.opts[v].en : v) : v; };
  const nf = n => Number(n).toLocaleString("en-IN");
  const today = new Date().toISOString().slice(0, 10);
  const icon = id => `<svg viewBox="0 0 24 24"><use href="#${id}"/></svg>`;

  // only synced surveys reach the server, so only they appear here (real time, inception to date)
  const records = () => [...store.get("local", []), ...H.RECORDS].filter(r => r.synced);

  const EMPTY = { division: "", region: "", area: "", branch: "", from: "", to: "", name: "", mobile: "", pkg: "", rtype: "", q: "" };
  const W = { page: store.get("webPage", "dash"), role: store.get("webRole", "HO"), f: { ...EMPTY }, lock: {} };
  const PAGES = [
    ["dash", "Health Data Dashboard", "Dashboard", "ic-ic_dashboard-t"],
    ["socio", "Socio-Economic Profile Data", "Reports", "ic-ic_profile_update-t"],
    ["detail", "Health Data Detailed Report", "Reports", "ic-ic_baseline_list_alt_24-t"],
    ["summary", "Health Data Summary Report", "Reports", "ic-ic_report-t"],
  ];

  // ---------- role-based demarcation (FR-B-007; AM from section 6.2) ----------
  function applyRole() {
    const u = H.USERS[W.role], f = W.f;
    W.lock = {};
    if (W.role === "BM") { Object.assign(f, { division: u.division, region: u.region, area: u.area, branch: u.branch }); W.lock = { division: 1, region: 1, area: 1, branch: 1 }; }
    else if (W.role === "AM") { Object.assign(f, { division: u.division, region: u.region, area: u.area }); W.lock = { division: 1, region: 1, area: 1 }; }
    else if (W.role === "RC") { Object.assign(f, { division: u.division }); W.lock = { division: 1 }; }
    // DC: division can be chosen individually or as All; HO: all demarcations
  }
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const divisions = () => Object.keys(H.TREE);
  const regions = () => (W.f.division ? [W.f.division] : divisions()).flatMap(d => Object.keys(H.TREE[d]));
  const areas = () => uniq(H.BRANCHES.filter(b => (!W.f.division || b.division === W.f.division) && (!W.f.region || b.region === W.f.region)).map(b => b.area));
  const branches = () => H.BRANCHES.filter(b => (!W.f.division || b.division === W.f.division) && (!W.f.region || b.region === W.f.region) && (!W.f.area || b.area === W.f.area)).map(b => b.branch);

  function rows(extra) {
    const f = W.f;
    return records().filter(r =>
      (!f.division || r.division === f.division) && (!f.region || r.region === f.region) && (!f.area || r.area === f.area) && (!f.branch || r.branch === f.branch) &&
      (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to) &&
      (!extra || ((!f.name || r.name.toLowerCase().includes(f.name.toLowerCase())) && (!f.mobile || String(r.mobile).includes(f.mobile)) &&
        (f.pkg === "" || r.package === +f.pkg) && (f.rtype === "" || r.clientType === +f.rtype) &&
        (!f.q || (r.name + " " + r.mobile).toLowerCase().includes(f.q.toLowerCase())))));
  }
  function agg(rs) {
    const a = { total: rs.length, members: 0, nonMembers: 0, p1: 0, p2: 0, hb: 0, urine: 0, diab: 0, bp: 0, eye: rs.length, glassYes: 0, glassNo: 0 };
    for (const r of rs) {
      r.clientType === 0 ? a.members++ : a.nonMembers++;
      r.package === 0 ? a.p1++ : a.p2++;
      if (r.hb) a.hb++; if (r.urine) a.urine++; if (r.diabetes) a.diab++; if (r.bp) a.bp++;
      if (r.glasses === 0) a.glassYes++; else if (r.glasses === 1) a.glassNo++;
    }
    return a;
  }

  // ---------- filters ----------
  function sel(key, label, opts) {
    if (W.lock[key]) return ""; // fixed by the user's role: not shown as a field
    return `<label><span>${label}</span><select data-f="${key}"${W.lock[key] ? " disabled" : ""}><option value="">All</option>${opts.map(o => `<option${o === W.f[key] ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
  }
  const inp = (key, label, ph, type = "text") => `<label><span>${label}</span><input type="${type}" data-f="${key}" value="${esc(W.f[key])}"${ph ? ` placeholder="${esc(ph)}"` : ""}></label>`;
  const opt3 = (key, label, opts) => `<label><span>${label}</span><select data-f="${key}"><option value="">All</option>${opts.map(([v, l]) => `<option value="${v}"${W.f[key] === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;
  function filters(kind) {
    let h = `<div class="filters">${sel("division", "Division", divisions())}${sel("region", "Region", regions())}${sel("area", "Area", areas())}${sel("branch", "Branch", branches())}
      ${inp("from", "Date from", "", "date")}${inp("to", "Date to", "", "date")}`;
    if (kind !== "dash") {
      const who = kind === "summary" ? "Recipient" : "Patient";
      h += inp("name", `${who} name`, "Name") + inp("mobile", `${who} mobile number`, "01XXXXXXXXX");
      if (kind !== "socio") {
        h += opt3("pkg", "Package type", [["0", "Package 1"], ["1", "Package 2"]]);
        if (kind === "summary") h += opt3("rtype", "Recipient type", [["0", "Client (member)"], ["1", "Non-client"]]);
        h += inp("q", "Advance search", "Name or mobile number");
      }
    }
    return h + `<div><button class="btn o" id="fReset">Reset</button></div></div>`;
  }

  // ---------- dashboard ----------
  function dashPage() {
    const rs = rows(false), a = agg(rs);
    const card = (l, v, s, alt) => `<div class="card${alt ? " alt" : ""}"><div class="l">${l}</div><div class="v">${nf(v)}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
    const pct = (x, t) => t ? Math.round(x / t * 100) + "% of patients" : "";
    const bar = (l, v, max) => `<div class="bar"><span>${l}</span><div class="track"><div class="fill" style="width:${max ? v / max * 100 : 0}%"></div></div><span class="num">${nf(v)}</span></div>`;
    const level = W.f.area ? "branch" : W.f.region ? "area" : W.f.division ? "region" : "division";
    const groups = {};
    for (const r of rs) (groups[r[level]] = groups[r[level]] || []).push(r);
    const gl = Object.entries(groups).sort((x, y) => y[1].length - x[1].length);
    const gmax = Math.max(1, ...gl.map(g => g[1].length));
    const tests = [["Haemoglobin test", a.hb], ["Urine test", a.urine], ["Diabetes test", a.diab], ["Pressure test", a.bp], ["Eye test", a.eye]];
    const tmax = Math.max(1, ...tests.map(x => x[1]));
    return `<div class="sec"><h2>Survey Summary <small>From inception to today</small></h2><div class="cards">
        ${card("Total Patients Surveyed", a.total)}${card("Total Members", a.members, pct(a.members, a.total))}${card("Total Non-Members", a.nonMembers, pct(a.nonMembers, a.total))}
        ${card("Package 1 services provided", a.p1, "", 1)}${card("Package 2 services provided", a.p2, "", 1)}</div></div>
      <div class="split">
        <div class="sec"><h2>Test Summary</h2><div class="bars">${tests.map(x => bar(x[0], x[1], tmax)).join("")}</div>
          <div class="yn">${card("Glasses required — Yes", a.glassYes)}${card("Glasses required — No", a.glassNo, "", 1)}</div></div>
        <div class="sec"><h2>Patients by ${level} <small>${gl.length} ${level}${gl.length === 1 ? "" : "s"}</small></h2>
          <div class="bars">${gl.slice(0, 12).map(([k, v]) => bar(esc(k), v.length, gmax)).join("") || '<div class="empty">Data is not available</div>'}</div></div>
      </div>`;
  }

  // ---------- reports ----------
  const DEM = [{ h: "Division", v: r => r.division }, { h: "Region", v: r => r.region }, { h: "Area", v: r => r.area }, { h: "Branch", v: r => r.branch }];
  function reportCols(kind) {
    if (kind === "socio") return [...DEM, { h: "Data Capture Date", v: r => r.date }, { h: "Recipient Name", v: r => r.name }, { h: "Recipient Mobile Number", v: r => r.mobile },
      { h: "Asset List (multiple selection)", v: r => en("assets", r.socio.assets) }, { h: "Household Type", v: r => en("house", r.socio.house) }, { h: "Ownership of Homestead Land", v: r => en("homeLand", r.socio.homeLand) },
      { h: "Type of Cultivable Land", v: r => en("farmLand", r.socio.farmLand) }, { h: "Household Economic Status", v: r => en("economic", r.socio.economic) }, { h: "Present Address", v: r => r.socio.presentAddr },
      { h: "Permanent Address", v: r => r.socio.permAddr }, { h: "Number of Family Members", v: r => en("familySize", r.socio.familySize) }, { h: "Number of Children in the Family", v: r => en("children", r.socio.children) },
      { h: "Number of Pregnant Women", v: r => en("pregnant", r.socio.pregnant) }, { h: "Any Person with Disability in the Family", v: r => en("disability", r.socio.disability) }];
    if (kind === "detail") return [...DEM, { h: "Data Capture Date", v: r => r.date }, { h: "SK Name", v: r => r.sk }, { h: "Patient Name", v: r => r.name }, { h: "Patient Mobile Number", v: r => r.mobile },
      { h: "Patient Type", v: r => en("clientType", r.clientType) }, { h: "Member No", v: r => r.memberNo }, { h: "Household Head (Husband/Father)", v: r => r.headName }, { h: "Gender", v: r => en("gender", r.gender) },
      { h: "Year of Birth", v: r => r.birthYear }, { h: "NID Number", v: r => r.nid }, { h: "Blood Group", v: r => en("blood", r.blood) }, { h: "Occupation", v: r => r.occupation },
      { h: "Package Type", v: r => en("package", r.package) }, { h: "Service Type", v: r => en("service", r.service) }, { h: "Physical Problems (long-term)", v: r => en("chronic", r.chronic) },
      { h: "Height (cm)", v: r => r.height, n: 1 }, { h: "Weight (kg)", v: r => r.weight, n: 1 }, { h: "Temperature (°F)", v: r => r.temp, n: 1 }, { h: "Haemoglobin (g/dL)", v: r => r.hb, n: 1 },
      { h: "Urine Test", v: r => r.urine }, { h: "Diabetes Test (mmol/L)", v: r => r.diabetes, n: 1 }, { h: "Pressure Test (mmHg)", v: r => r.bp }, { h: "Eye Test", v: r => en("eye", r.eye) || "No problem" },
      { h: "Glucose (mmol/L)", v: r => r.glucose, n: 1 }, { h: "Glasses", v: r => en("glasses", r.glasses) }, { h: "Disease Background", v: r => en("background", r.background) },
      { h: "Duration (if from parents)", v: r => r.parentDuration }, { h: "Others in Family with Disease", v: r => en("familyOthers", r.familyOthers) }, { h: "Duration (if brother/sister)", v: r => r.siblingDuration }];
    const cnt = (rs, f) => rs.filter(f).length;
    return [...DEM, { h: "Report Generate Date", v: () => today }, { h: "Recipients Served", v: g => g.rs.length, n: 1 },
      { h: "Packages Served (P1 / P2)", v: g => `${cnt(g.rs, r => r.package === 0)} / ${cnt(g.rs, r => r.package === 1)}` },
      { h: "Recipient Type (Client / Non-client)", v: g => `${cnt(g.rs, r => r.clientType === 0)} / ${cnt(g.rs, r => r.clientType === 1)}` },
      { h: "Blood Group Recorded", v: g => cnt(g.rs, r => r.blood != null), n: 1 },
      { h: "Types of Service Provided (NCD / ANC / PNC)", v: g => [0, 1, 2].map(i => cnt(g.rs, r => r.service === i)).join(" / ") },
      { h: "Physical Issues Reported", v: g => cnt(g.rs, r => r.chronic && r.chronic.length), n: 1 },
      { h: "Haemoglobin Tests", v: g => cnt(g.rs, r => r.hb), n: 1 }, { h: "Urine Tests", v: g => cnt(g.rs, r => r.urine), n: 1 }, { h: "Diabetes Tests", v: g => cnt(g.rs, r => r.diabetes), n: 1 },
      { h: "Blood Pressure Checks", v: g => cnt(g.rs, r => r.bp), n: 1 }, { h: "Glucose Tests", v: g => cnt(g.rs, r => r.glucose), n: 1 }, { h: "Eye Tests", v: g => g.rs.length, n: 1 },
      { h: "Glasses Provided", v: g => cnt(g.rs, r => r.glasses === 0), n: 1 },
      { h: "Disease Patterns by Background (Family / Congenital / No cause / Unknown)", v: g => [0, 1, 2, 3].map(i => cnt(g.rs, r => r.background === i)).join(" / ") }];
  }
  function reportData(kind) {
    const rs = rows(true);
    if (kind === "socio") return rs.filter(r => r.socio);
    if (kind === "detail") return rs;
    const by = {};
    for (const r of rs) (by[r.branch] = by[r.branch] || { ...H.where(r.branch), rs: [] }).rs.push(r);
    return Object.values(by).sort((a, b) => a.division.localeCompare(b.division) || a.region.localeCompare(b.region) || a.branch.localeCompare(b.branch));
  }
  function totalsFor(kind, cols, data) {
    if (kind !== "summary") return cols.map((c, i) => i === 0 ? `Total: ${data.length}` : "");
    return cols.map((c, i) => {
      if (i === 0) return "Total";
      if (i < 5) return "";
      const vals = data.map(g => String(c.v(g)));
      if (vals.every(v => /^\d+$/.test(v))) return String(vals.reduce((s, v) => s + +v, 0));
      if (vals.length && vals.every(v => /^[\d /]+$/.test(v))) { const parts = vals.map(v => v.split(" / ").map(Number)); return parts[0].map((_, j) => parts.reduce((s, p) => s + p[j], 0)).join(" / "); }
      return "";
    });
  }
  function reportPage(kind) {
    const cols = reportCols(kind), data = reportData(kind);
    const shown = kind === "detail" ? data.slice(0, 300) : data;
    const tot = totalsFor(kind, cols, data);
    return `<div class="tools"><span class="cnt">${nf(data.length)} ${kind === "summary" ? "branches" : "rows"}${shown.length < data.length ? ` · showing the first ${shown.length}; downloads include all` : ""}</span>
      <button class="btn o" id="xPdf">Download PDF</button><button class="btn" id="xXls">Download Excel</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>#</th>${cols.map(c => `<th class="${c.n ? "n" : ""}">${esc(c.h)}</th>`).join("")}</tr></thead><tbody>
      ${shown.map((r, i) => `<tr${r.id && newIds.has(r.id) ? ' class="flash"' : ""}><td>${i + 1}</td>${cols.map(c => `<td class="${c.n ? "n" : ""}" title="${esc(c.v(r))}">${esc(c.v(r))}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${cols.length + 1}" class="empty">Data is not available</td></tr>`}
      <tr class="total"><td></td>${tot.map((x, i) => `<td class="${cols[i].n ? "n" : ""}">${esc(x)}</td>`).join("")}</tr></tbody></table></div>`;
  }
  function exportCsv(kind) {
    const cols = reportCols(kind), data = reportData(kind);
    const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const lines = [cols.map(c => q(c.h)).join(","), ...data.map(r => cols.map(c => q(c.v(r))).join(",")), totalsFor(kind, cols, data).map(q).join(",")];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = PAGES.find(p => p[0] === kind)[1].replace(/\W+/g, "_") + "_" + today + ".csv";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- render ----------
  let newIds = new Set();
  function render(keepFocus) {
    applyRole();
    const [id, title, crumb] = PAGES.find(p => p[0] === W.page);
    let nav = "", lastGroup = "";
    for (const [pid, ptitle, group, ic] of PAGES) {
      if (group !== lastGroup) { nav += `<h4>${group}</h4>`; lastGroup = group; }
      nav += `<a data-p="${pid}" class="${pid === W.page ? "on" : ""}">${icon(ic)}<span>${ptitle}</span></a>`;
    }
    $("#nav").innerHTML = nav;
    const scroll = $("#main").scrollTop;
    // the role's fixed demarcation, shown as plain text instead of locked dropdowns
    const fixed = ["division", "region", "area", "branch"].filter(k => W.lock[k]).map(k => W.f[k]);
    const scope = fixed.length ? `<div class="scope">${fixed.map(esc).join(" › ")}${W.lock.branch ? " branch" : W.lock.area ? " area" : " division"}</div>` : "";
    $("#main").innerHTML = `<div class="head"><div><div class="crumb">TrendX › ${esc(crumb)}</div><h1>${esc(title)}</h1>${scope}</div><span class="live">Live data</span></div>
      <div class="body">${filters(id)}${id === "dash" ? dashPage() : reportPage(id)}</div>`;
    $("#main").scrollTop = scroll;
    $$("#nav [data-p]").forEach(a => a.onclick = () => { W.page = a.dataset.p; store.set("webPage", W.page); $("#nav").classList.remove("on"); render(); });
    $$("[data-f]").forEach(el => el.addEventListener(el.tagName === "INPUT" && el.type !== "date" ? "input" : "change", () => {
      const k = el.dataset.f; W.f[k] = el.value;
      const order = ["division", "region", "area", "branch"], i = order.indexOf(k);
      if (i >= 0) for (const k2 of order.slice(i + 1)) if (!W.lock[k2]) W.f[k2] = "";
      render({ k, pos: el.selectionStart });
    }));
    if (keepFocus) { const el = $(`[data-f="${keepFocus.k}"]`); if (el && el.tagName === "INPUT" && el.type !== "date") { el.focus(); try { el.setSelectionRange(keepFocus.pos, keepFocus.pos); } catch (e) { } } }
    $("#fReset").onclick = () => { W.f = { ...EMPTY }; render(); };
    if ($("#xXls")) $("#xXls").onclick = () => exportCsv(id);
    if ($("#xPdf")) $("#xPdf").onclick = () => window.print();
  }

  // role picker in the top bar (SK only enters data, so it isn't listed)
  $("#role").innerHTML = Object.keys(H.USERS).filter(r => r !== "SK").map(r => `<option value="${r}">${r} — ${esc(H.USERS[r].name)}</option>`).join("");
  $("#role").value = W.role;
  $("#role").onchange = e => { W.role = e.target.value; store.set("webRole", W.role); W.f = { ...W.f, division: "", region: "", area: "", branch: "" }; render(); };
  $("#menuBtn").onclick = () => $("#nav").classList.toggle("on");

  // live updates: the phone app (another tab) saves surveys to localStorage
  let known = new Set(records().map(r => r.id));
  function refresh() {
    const ids = records().map(r => r.id);
    const fresh = ids.filter(i => !known.has(i));
    if (fresh.length || ids.length !== known.size) { newIds = new Set(fresh); known = new Set(ids); render(); }
  }
  window.addEventListener("storage", e => { if (e.key === "hdc.local") refresh(); });
  setInterval(refresh, 4000);
  render();
})();
