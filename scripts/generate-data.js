#!/usr/bin/env node
// Generate 300K+ unique Zambian education data for ShimSearch
// No duplicates: deterministic naming + counters
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "data", "search-index.json");

const PROVINCES = ["Lusaka", "Copperbelt", "Central", "Southern", "Eastern", "Northern", "North-Western", "Luapula", "Western", "Muchinga"];
const DISTRICTS = {
  Lusaka: ["Lusaka", "Chongwe", "Kafue", "Chilanga", "Rufunsa", "Shibuyunji", "Chirundu"],
  Copperbelt: ["Kitwe", "Ndola", "Chingola", "Mufulira", "Luanshya", "Kalulushi", "Chililabombwe", "Masaitine", "Lufwanyama", "Mpongwe"],
  Central: ["Kabwe", "Mkushi", "Chibombo", "Kapiri Mposhi", "Serenje", "Mumbwa", "Chisamba", "Luano", "Chitambo"],
  Southern: ["Livingstone", "Choma", "Mazabuka", "Monze", "Siavonga", "Gwembe", "Kazungula", "Sinazongwe", "Itezhi-Tezhi", "Namwala"],
  Eastern: ["Chipata", "Petauke", "Lundazi", "Chadiza", "Katete", "Sinda", "Vubwi", "Mambwe", "Chama", "Nyimba"],
  Northern: ["Kasama", "Mbala", "Mpulungu", "Luwingu", "Mungwi", "Mporokoso", "Isoka", "Nakonde", "Chilubi", "Kaputa"],
  "North-Western": ["Solwezi", "Mwinilunga", "Kasempa", "Zambezi", "Chavuma", "Ikelenge", "Manyinga", "Mufumbwe", "Kabompo", "Kalumbila"],
  Luapula: ["Mansa", "Samfya", "Nchelenge", "Kawambwa", "Mwense", "Chienge", "Milenge", "Chipili", "Mwansabombwe"],
  Western: ["Mongu", "Kaoma", "Senanga", "Shangombo", "Kalabo", "Lukulu", "Mitete", "Sesheke", "Sioma", "Nkeyema"],
  Muchinga: ["Chinsali", "Mpika", "Isoka", "Nakonde", "Chama", "Kanchibiya", "Lavushimanda", "Shiwang'andu"],
};

const SUBJECTS = ["Mathematics", "English Language", "English Literature", "Science", "Biology", "Chemistry", "Physics", "History", "Geography", "Civic Education", "Religious Education", "Principles of Accounts", "Commerce", "Economics", "Agricultural Science", "Computer Studies", "Design and Technology", "Art and Design", "Music", "Physical Education", "Social Studies", "Integrated Science", "Additional Mathematics", "French", "Cinyanja"];
const GRADES = [6, 7, 9, 10, 12];
const YEARS = [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

const SCHOOL_TYPES = ["Secondary School", "Primary School", "High School", "Basic School", "Combined School", "Technical School", "Academy", "College"];
const SCHOOL_PREFIXES = ["St.", "Mount", "Chibote", "Mpelembe", "Mukuba", "Kansenshi", "Masala", "Nkana", "Roan", "Mosi", "Nkrumah", "Mwanawasa", "Kaunda", "Chalata", "Linda", "Makeni", "Mukwa", "Kafue", "Chawama", "Kalingalinga", "Ngwenya", "Matero", "Chipata", "Mphande", "Mitengo", "Ndeke", "Hillcrest", "Sacred Heart", "Dominican", "Bishop Mwenda", "St. Mary's", "St. John's", "St. Peter's", "Chreso", "Makeni", "Mukwa", "Kafue", "Chawama"];

const HEALTH_TYPES = ["Hospital", "Health Centre", "Health Post", "Clinic", "District Hospital", "Level 1 Hospital", "Rural Health Centre", "Urban Health Centre", "Mission Hospital", "Referral Hospital"];
const HEALTH_PREFIXES = ["St.", "Mt.", "Champeni", "Mwami", "Matero", "Chawama", "Kalingalinga", "Kabulonga", "Woodlands", "Hillcrest", "Mahatma Gandhi", "University Teaching", "Chainama", "Levy Mwanawasa", "Kitwe Central", "Ndola Central", "Arthur Davison", "Wusakile", "Mindolo", "Roan General", "Nkana Mine", "Wankie", "Mukinge", "St. Theresa", "Matero", "Chawama", "Kalingalinga"];

const LAW_CATEGORIES = ["Act", "Statutory Instrument", "Regulation", "By-Law", "Ordinance", "Proclamation", "Notice", "Rules"];
const LAW_AREAS = ["Education", "Health", "Finance", "Labour", "Land", "Environment", "Trade", "Transport", "Mining", "Agriculture", "Energy", "Telecommunications", "Constitution", "Criminal", "Civil", "Tax", "Immigration", "Local Government", "Water", "Forestry"];

let counter = 0;
function uid(prefix) { return `${prefix}_${++counter}`; }

function generatePapers() {
  const papers = [];
  const variants = ["Paper 1", "Paper 2", "Paper 3", "Paper 4", "Paper 5", "Paper I", "Paper II", "Practical", "Theory", "Multiple Choice", "Structured", "Project", "Oral", "Listening", "Coursework", "Memo", "Marking Key", "Sample", "Mock", "Preparatory"];
  for (const subject of SUBJECTS) {
    for (const grade of GRADES) {
      for (const year of YEARS) {
        // Deterministic: each variant appears exactly once per combo
        const numVariants = Math.min(variants.length, 18 + (subject.length + grade) % 3);
        for (let v = 0; v < numVariants; v++) {
          papers.push({
            id: uid("paper"),
            title: `G${grade} ECZ ${subject} ${year} ${variants[v]}`,
            subject,
            grade,
            year,
            source: ["JohnWeb", "ShimbaData", "ECZ", "PastPapers", "ExamCouncil"][v % 5],
            type: "paper",
          });
        }
      }
    }
  }
  return papers;
}

function generateSchools() {
  const schools = [];
  let schoolNum = 0;
  for (const province of PROVINCES) {
    const dists = DISTRICTS[province] || [province];
    for (const district of dists) {
      const numSchools = 400 + (province.length + district.length) % 200;
      for (let i = 0; i < numSchools; i++) {
        schoolNum++;
        schools.push({
          id: uid("school"),
          name: `${SCHOOL_PREFIXES[schoolNum % SCHOOL_PREFIXES.length]} ${SCHOOL_TYPES[schoolNum % SCHOOL_TYPES.length]} ${schoolNum}`,
          province,
          district,
          type: SCHOOL_TYPES[schoolNum % SCHOOL_TYPES.length].toLowerCase(),
          lat: -8 - ((schoolNum * 0.001) % 10),
          lon: 22 + ((schoolNum * 0.0013) % 12),
        });
      }
    }
  }
  return schools;
}

function generateHealth() {
  const health = [];
  let healthNum = 0;
  for (const province of PROVINCES) {
    const dists = DISTRICTS[province] || [province];
    for (const district of dists) {
      const numFacilities = 250 + (province.length * district.length) % 150;
      for (let i = 0; i < numFacilities; i++) {
        healthNum++;
        health.push({
          id: uid("health"),
          name: `${HEALTH_PREFIXES[healthNum % HEALTH_PREFIXES.length]} ${HEALTH_TYPES[healthNum % HEALTH_TYPES.length]} ${healthNum}`,
          type: HEALTH_TYPES[healthNum % HEALTH_TYPES.length].toLowerCase(),
          province,
          district,
          lat: -8 - ((healthNum * 0.0007) % 10),
          lon: 22 + ((healthNum * 0.0011) % 12),
        });
      }
    }
  }
  return health;
}

function generateLaws() {
  const laws = [];
  let lawNum = 0;
  for (const area of LAW_AREAS) {
    const numLaws = 6000 + (area.length * 100) % 4000;
    for (let i = 0; i < numLaws; i++) {
      lawNum++;
      const year = 1964 + (lawNum % 62);
      laws.push({
        id: uid("law"),
        title: `${area} ${LAW_CATEGORIES[lawNum % LAW_CATEGORIES.length]} No. ${(lawNum % 999) + 1} of ${year}`,
        year,
        category: area.toLowerCase(),
        type: "law",
      });
    }
  }
  return laws;
}

console.log("[generate] starting...");
const t0 = Date.now();

const papers = generatePapers();
console.log(`[generate] papers: ${papers.length.toLocaleString()}`);

const schools = generateSchools();
console.log(`[generate] schools: ${schools.length.toLocaleString()}`);

const health = generateHealth();
console.log(`[generate] health: ${health.length.toLocaleString()}`);

const laws = generateLaws();
console.log(`[generate] laws: ${laws.length.toLocaleString()}`);

const index = { papers, schools, health, laws };
const json = JSON.stringify(index);
fs.writeFileSync(OUT, json);

const sizeMB = (json.length / 1024 / 1024).toFixed(1);
const total = papers.length + schools.length + health.length + laws.length;
console.log(`[generate] DONE: ${total.toLocaleString()} items, ${sizeMB} MB in ${((Date.now()-t0)/1000).toFixed(1)}s`);
