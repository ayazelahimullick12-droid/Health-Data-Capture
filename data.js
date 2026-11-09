// Health Data Capture prototype - questionnaire (from BRD appendix 13) and demo data.
// Everything here is invented sample data. Nothing is sent anywhere.
(function () {
  "use strict";

  // ---------- Questionnaire: BRD 13 "Mandatory Survey" ----------
  // type: text | tel | number | year | select | multi | bp | readonly ; req: mandatory ; pkg: which packages show it
  const O = (bn, en) => ({ bn, en });
  const YES_NO = [O("হ্যাঁ", "Yes"), O("না", "No")];
  const BACKGROUND = [O("পারিবারিক", "Family history"), O("জন্মগত", "Congenital"), O("কোনো নির্দিষ্ট কারণ ছাড়া", "No specific cause"), O("অজানা", "Unknown")];
  const EYE = [O("কাছের সমস্যা", "Near-vision problem"), O("দূরের সমস্যা", "Distance-vision problem")];
  const FAMILY_OTHERS = [O("ভাই", "Brother"), O("বোন", "Sister"), O("অন্যান্য", "Others")];

  const GENERAL = [
    { k: "name", bn: "রোগীর নাম", en: "Patient name", type: "text", req: true },
    { k: "clientType", bn: "রোগীর ধরণ", en: "Patient type", type: "readonly", req: true, opts: [O("মেম্বার", "Member"), O("নন-মেম্বার", "Non-member")] },
    { k: "mobile", bn: "রোগীর মোবাইল নম্বর", en: "Patient mobile number", type: "tel", req: true, max: 11 },
    { k: "headName", bn: "পরিবার প্রধানের নাম (স্বামী/পিতা)", en: "Household head's name (husband/father)", type: "text", req: true },
    { k: "gender", bn: "লিঙ্গ", en: "Gender", type: "select", req: true, opts: [O("নারী", "Female"), O("পুরুষ", "Male")] },
    { k: "birthYear", bn: "জন্মের সাল", en: "Year of birth", type: "year", req: true },
    { k: "nid", bn: "NID নম্বর", en: "NID number", type: "readonly", req: true },
    { k: "blood", bn: "রক্তের গ্রুপ", en: "Blood group", type: "select", req: false, opts: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(x => O(x, x)) },
    { k: "occupation", bn: "পেশা", en: "Occupation", type: "text", req: true },
    { k: "package", bn: "প্যাকেজের ধরন", en: "Package type", type: "select", req: true, opts: [O("প্যাকেজ ১", "Package 1"), O("প্যাকেজ ২", "Package 2")] },
    { k: "service", bn: "সেবার ধরণ", en: "Service type", type: "select", req: true, opts: [O("এনসিডি", "NCD"), O("গর্ভকালীন সেবা", "Antenatal care"), O("প্রসূতি পরবর্তী সেবা", "Postnatal care")] },
    { k: "chronic", bn: "শারীরিক সমস্যা (দীর্ঘমেয়াদী)", en: "Physical problems (long-term)", type: "multi", req: false, opts: [O("ডায়াবেটিস", "Diabetes"), O("প্রেশার", "Blood pressure"), O("অন্যান্য", "Others")] },
    { k: "height", bn: "উচ্চতা", en: "Height", type: "number", req: true, unit: "cm" },
    { k: "weight", bn: "ওজন", en: "Weight", type: "number", req: true, unit: "kg" },
    { k: "temp", bn: "টেম্পারেচার", en: "Temperature", type: "number", req: true, unit: "°F" },
  ];
  // Package 1 has haemoglobin and urine tests; Package 2 does not (BRD 13).
  const PACKAGE = [
    { k: "hb", bn: "হিমোগ্লোবিন টেস্ট", en: "Haemoglobin test", type: "number", req: true, unit: "g/dL", pkg: [1] },
    { k: "urine", bn: "ইউরিন টেস্ট", en: "Urine test", type: "text", req: true, pkg: [1], ph: O("ফলাফল", "Result") },
    { k: "diabetes", bn: "ডায়াবেটিস টেস্ট", en: "Diabetes test", type: "number", req: true, unit: "mmol/L", pkg: [1, 2] },
    { k: "bp", bn: "প্রেশার টেস্ট", en: "Blood pressure test", type: "bp", req: true, unit: "mmHg", pkg: [1, 2] },
    { k: "eye", bn: "চোখের টেস্ট", en: "Eye test", type: "multi", req: false, opts: EYE, pkg: [1, 2] },
    { k: "glucose", bn: "Glucose", en: "Glucose", type: "number", req: true, unit: "mmol/L", pkg: [1, 2] },
    { k: "glasses", bn: "চশমা", en: "Glasses", type: "select", req: true, opts: YES_NO, pkg: [1, 2] },
    { k: "background", bn: "রোগের প্রেক্ষাপট", en: "Disease background", type: "select", req: true, opts: BACKGROUND, pkg: [1, 2] },
    { k: "parentDuration", bn: "যদি বাবা মায়ের থেকে হয়ে থাকে তাহলে রোগের সময়কাল", en: "If inherited from parents, how long they have had it", type: "text", req: false, pkg: [1, 2] },
    { k: "familyOthers", bn: "পরিবারের অন্যান্য কারও মধ্যে এই রোগ", en: "Anyone else in the family with this disease", type: "multi", req: false, opts: FAMILY_OTHERS, pkg: [1, 2] },
    { k: "siblingDuration", bn: "যদি ভাই/বোনের হয়ে থাকে তাহলে তাদের এই রোগের সময়কাল", en: "If a brother/sister has it, for how long", type: "text", req: false, pkg: [1, 2] },
  ];

  // ---------- BRD 13 "Socio Economic Profile Questions (Not Mandatory)" ----------
  const SOCIO = [
    { k: "assets", bn: "সম্পদের তালিকা (একাধিক নির্বাচন করুন)", en: "Assets owned (select all that apply)", type: "multi", group: "asset", opts: [
      O("খাট", "Bed"), O("চেয়ার/টেবিল", "Chair/table"), O("আলমারি", "Almirah"), O("টেলিভিশন", "Television"), O("মোবাইল ফোন", "Mobile phone"),
      O("সাইকেল", "Bicycle"), O("মোটরসাইকেল", "Motorcycle"), O("রিকশা/ভ্যান", "Rickshaw/van"), O("সেলাই মেশিন", "Sewing machine"), O("ফ্রিজ", "Fridge"),
      O("বৈদ্যুতিক ফ্যান", "Electric fan"), O("কম্পিউটার/ল্যাপটপ", "Computer/laptop"), O("গবাদি পশু (গরু/ছাগল)", "Livestock (cow/goat)"), O("অন্যান্য (উল্লেখ করুন)", "Others (specify)")] },
    { k: "house", bn: "গৃহস্থালির ধরন", en: "Household type", type: "select", group: "asset", opts: [
      O("কাচা (মাটি, বাঁশ, খড় ইত্যাদি)", "Kutcha (mud, bamboo, straw)"), O("আধা-পাকা", "Semi-pucca"), O("পাকা (ইট, সিমেন্ট, কংক্রিট)", "Pucca (brick, cement, concrete)"), O("গৃহহীন", "Homeless")] },
    { k: "homeLand", bn: "বাড়ির জমির মালিকানা", en: "Ownership of homestead land", type: "select", group: "asset", opts: [O("নিজস্ব", "Own"), O("ভাড়ায় নেওয়া", "Rented"), O("অন্যান্য (উল্লেখ করুন)", "Others (specify)")] },
    { k: "farmLand", bn: "আবাদি জমির ধরণ", en: "Type of cultivable land", type: "select", group: "asset", opts: [O("নিজস্ব জমি", "Own land"), O("ভাড়ায় নেওয়া জমি", "Leased land"), O("নেই", "None"), O("অংশীদারত্বে", "Sharecropping"), O("অন্যান্য (উল্লেখ করুন)", "Others (specify)")] },
    { k: "economic", bn: "পরিবারের আর্থিক অবস্থা", en: "Household economic status", type: "select", group: "asset", opts: [
      O("অতিদরিদ্র (প্রয়োজনীয় খাদ্য জোগাড় করতেও কষ্ট হয়)", "Ultra poor (struggles to get enough food)"), O("দরিদ্র (অনিয়মিত আয়, খাদ্য সংগ্রহ হয়)", "Poor (irregular income, manages food)"),
      O("মধ্যবিত্ত (নিয়মিত আয়, প্রয়োজন মেটাতে পারে)", "Middle (regular income, meets needs)"), O("সচ্ছল/ধনী (সঞ্চয়, সম্পদ বা বিলাসী সামগ্রী কিনতে পারে)", "Well-off (has savings, can buy assets)")] },
    { k: "presentAddr", bn: "বর্তমান ঠিকানা", en: "Present address", type: "text", group: "personal" },
    { k: "permAddr", bn: "স্থায়ী ঠিকানা", en: "Permanent address", type: "text", group: "personal" },
    { k: "familySize", bn: "পরিবারের সদস্য সংখ্যা", en: "Number of family members", type: "select", group: "personal", opts: [O("২", "2"), O("৩", "3"), O("৪", "4"), O("৪ এর অধিক", "More than 4")] },
    { k: "children", bn: "পরিবারের সন্তান সংখ্যা", en: "Number of children in the family", type: "select", group: "personal", opts: [O("০", "0"), O("১", "1"), O("২", "2"), O("২ এর বেশি", "More than 2")] },
    { k: "pregnant", bn: "গর্ভবতী নারীর সংখ্যা", en: "Number of pregnant women", type: "select", group: "personal", opts: [O("০", "0"), O("১", "1"), O("২", "2"), O("২ এর বেশি", "More than 2")] },
    { k: "disability", bn: "পরিবারে প্রতিবন্ধী ব্যক্তি আছে কি", en: "Any person with a disability in the family", type: "select", group: "personal", opts: YES_NO },
  ];

  // ---------- Demarcation (Division > Region > Area > Branch) ----------
  const TREE = {
    Rangpur: { Nilphamari: { Domar: ["Chilahati", "Domar Sadar"], Dimla: ["Dimla", "Jaldhaka"] }, Rangpur: { Pirganj: ["Pirganj", "Mithapukur"] } },
    Rajshahi: { Bogura: { Sherpur: ["Sherpur", "Dhunat"] }, Naogaon: { Manda: ["Manda", "Niamatpur"] } },
    Mymensingh: { Jamalpur: { Islampur: ["Islampur", "Melandah"] } },
  };
  const BRANCHES = [];
  for (const [dv, rs] of Object.entries(TREE)) for (const [rg, as] of Object.entries(rs)) for (const [ar, bs] of Object.entries(as)) for (const b of bs) BRANCHES.push({ division: dv, region: rg, area: ar, branch: b });
  const where = b => BRANCHES.find(x => x.branch === b);

  // Demo users (login role picker). SSO itself is not reproduced.
  const USERS = {
    SK: { pin: "260114", name: "Shahnaz Parvin", role: "SK", title: "Shastho Kormi", ...where("Chilahati") },
    BM: { pin: "182828", name: "Md. Rahat Miah", role: "BM", title: "Branch Manager", ...where("Chilahati") },
    AM: { pin: "150322", name: "Farzana Akter", role: "AM", title: "Area Manager", ...where("Chilahati") },
    RC: { pin: "110945", name: "Kamrul Hasan", role: "RC", title: "Regional Coordinator", ...where("Chilahati") },
    DC: { pin: "090118", name: "Nasrin Sultana", role: "DC", title: "Division Coordinator", ...where("Chilahati") },
    HO: { pin: "010101", name: "Tanvir Alam", role: "HO", title: "Head Office", ...where("Chilahati") },
  };

  // ---------- Demo people & NIDs ----------
  // BRAC members of the SK's branch (Chilahati) - validated by NID
  const MEMBERS = [
    { nid: "1987654321098", name: "Rahima Khatun", memberNo: "2050-00124", vo: "2050 - Kacha Bazar Mohila Samity", mobile: "01712345678", headName: "Jamal Uddin", gender: 0, birthYear: 1988, branch: "Chilahati" },
    { nid: "1990123456789", name: "Jorina Begum", memberNo: "2051-00125", vo: "2051 - Sundarganj Mohila Samity", mobile: "01819224466", headName: "Abdul Karim", gender: 0, birthYear: 1990, branch: "Chilahati" },
    { nid: "1985987654321", name: "Fatema Akter", memberNo: "2052-00126", vo: "2052 - Boalmari Mohila Samity", mobile: "01911556677", headName: "Mokbul Hossain", gender: 0, birthYear: 1985, branch: "Chilahati" },
    { nid: "5512348765", name: "Shahida Parvin", memberNo: "2053-00127", vo: "2053 - Notun Para Mohila Samity", mobile: "01611778899", headName: "Rafiq Mia", gender: 0, birthYear: 1979, branch: "Chilahati" },
    // a BRAC member of another branch (fails the branch check)
    { nid: "1979246813579", name: "Morsheda Khatun", memberNo: "3310-00412", vo: "3310 - Pirganj Mohila Samity", mobile: "01556112233", headName: "Selim Reza", gender: 0, birthYear: 1979, branch: "Pirganj" },
  ];
  // Non-members already surveyed before (their record is found by NID)
  const KNOWN_NON_MEMBERS = [
    { nid: "1995112233445", name: "Amena Bibi", mobile: "01311445566", headName: "Harun Or Rashid", gender: 0, birthYear: 1995, branch: "Chilahati" },
  ];

  // ---------- Demo survey records (seeded, so the same every load) ----------
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const FIRST = ["Rokeya", "Nasima", "Hasina", "Momena", "Salma", "Shirin", "Kulsum", "Rina", "Joynab", "Ayesha", "Monowara", "Taslima", "Rashida", "Sufia", "Halima", "Rabeya"];
  const LAST = ["Begum", "Khatun", "Akter", "Bibi", "Sultana", "Parvin"];
  const MALE = ["Abdul Malek", "Rafiqul Islam", "Shahidul Haque", "Mizanur Rahman", "Abul Kalam", "Nurul Amin"];
  const OCC = ["Housewife", "Small business", "Farmer", "Day labourer", "Tailor", "Poultry rearing"];
  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);

  function makeRecord(i, b, opts = {}) {
    const daysAgo = Math.floor(rnd() * 120);
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    const pkg = rnd() < 0.6 ? 1 : 2;
    const member = opts.member != null ? opts.member : rnd() < 0.62;
    const female = rnd() < 0.88;
    const chronic = [0, 1, 2].filter(() => rnd() < 0.3);
    const sys = 105 + Math.floor(rnd() * 55), dia = 65 + Math.floor(rnd() * 30);
    const r = {
      id: "HD-" + String(10000 + i), date: iso(d), ...b, sk: pick(["Shahnaz Parvin", "Mitu Rani", "Sabina Yasmin", "Lovely Akter"]),
      clientType: member ? 0 : 1, memberNo: member ? `${2050 + Math.floor(rnd() * 6)}-${String(100 + Math.floor(rnd() * 400)).padStart(5, "0")}` : "",
      name: female ? `${pick(FIRST)} ${pick(LAST)}` : pick(MALE), mobile: "01" + (3 + Math.floor(rnd() * 7)) + String(Math.floor(rnd() * 1e8)).padStart(8, "0"),
      headName: pick(MALE), gender: female ? 0 : 1, birthYear: 1955 + Math.floor(rnd() * 50), nid: String(1950000000000 + Math.floor(rnd() * 49999999999)),
      blood: rnd() < 0.7 ? Math.floor(rnd() * 8) : null, occupation: pick(OCC), package: pkg - 1,
      service: female ? (rnd() < 0.7 ? 0 : rnd() < 0.5 ? 1 : 2) : 0, chronic,
      height: 145 + Math.floor(rnd() * 30), weight: 40 + Math.floor(rnd() * 35), temp: (97.4 + rnd() * 3).toFixed(1),
      hb: pkg === 1 ? (9 + rnd() * 5).toFixed(1) : "", urine: pkg === 1 ? pick(["Normal", "Normal", "Normal", "Sugar +", "Albumin +"]) : "",
      diabetes: (4.5 + rnd() * 7).toFixed(1), bp: `${sys}/${dia}`, eye: [0, 1].filter(() => rnd() < 0.25), glucose: (4.2 + rnd() * 6).toFixed(1),
      glasses: rnd() < 0.3 ? 0 : 1, background: Math.floor(rnd() * 4), parentDuration: rnd() < 0.3 ? `${2 + Math.floor(rnd() * 15)} years` : "",
      familyOthers: [0, 1, 2].filter(() => rnd() < 0.15), siblingDuration: "", synced: true,
      socio: rnd() < 0.55 ? {
        assets: [...Array(14).keys()].filter(() => rnd() < 0.3), house: Math.floor(rnd() * 3), homeLand: rnd() < 0.8 ? 0 : 1, farmLand: Math.floor(rnd() * 4),
        economic: Math.floor(rnd() * 4), presentAddr: `${pick(["Kacha Bazar", "Sundarganj", "Boalmari", "Notun Para"])}, ${b.branch}`, permAddr: `${pick(["Kacha Bazar", "Sundarganj", "Boalmari"])}, ${b.branch}`,
        familySize: Math.floor(rnd() * 4), children: Math.floor(rnd() * 4), pregnant: rnd() < 0.85 ? 0 : 1, disability: rnd() < 0.1 ? 0 : 1,
      } : null,
    };
    Object.assign(r, opts.override || {});
    if (r.package === 1) { r.hb = ""; r.urine = ""; } // Package 2 has no haemoglobin / urine test
    else { if (!r.hb) r.hb = (9 + rnd() * 5).toFixed(1); if (!r.urine) r.urine = "Normal"; }
    return r;
  }
  const RECORDS = [];
  let n = 0;
  for (const b of BRANCHES) {
    const count = b.branch === "Chilahati" ? 26 : 8 + Math.floor(rnd() * 14);
    for (let i = 0; i < count; i++) RECORDS.push(makeRecord(n++, b));
  }
  // previous health history for the demo people
  const ch = where("Chilahati");
  const hist = (p, member, ago, override) => { const r = makeRecord(n++, ch, { member, override: { name: p.name, nid: p.nid, mobile: p.mobile, headName: p.headName, gender: p.gender, birthYear: p.birthYear, memberNo: p.memberNo || "", ...override } }); const d = new Date(today); d.setDate(d.getDate() - ago); r.date = iso(d); RECORDS.push(r); };
  hist(MEMBERS[0], true, 92, { package: 0, service: 0, chronic: [1], bp: "142/92", hb: "10.4", glasses: 0, eye: [0] });
  hist(MEMBERS[0], true, 31, { package: 1, service: 0, chronic: [1], bp: "136/88" });
  hist(MEMBERS[1], true, 45, { package: 0, service: 1, chronic: [] });
  hist(KNOWN_NON_MEMBERS[0], false, 60, { package: 1, service: 0, chronic: [0], diabetes: "9.8", glucose: "8.9" });
  RECORDS.sort((a, b) => b.date.localeCompare(a.date));

  window.HDC = { GENERAL, PACKAGE, SOCIO, TREE, BRANCHES, USERS, MEMBERS, KNOWN_NON_MEMBERS, RECORDS, where };
})();
