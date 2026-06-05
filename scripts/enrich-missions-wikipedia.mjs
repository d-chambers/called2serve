import { readFile, writeFile } from "node:fs/promises";

const MISSION_FILE = "data/missions.json";
const SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const COMMONS_SEARCH_URL = "https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=";
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/wiki/Special:Search?search=";

const STATE_NAMES = [
  "Washington DC", "New Hampshire", "New Jersey", "New México", "New York",
  "North Carolina", "North Dakota", "South Carolina", "West Virginia",
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Florida",
  "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Tennessee", "Texas", "Utah", "Virginia", "Washington",
  "Wisconsin", "Wyoming",
];

const COUNTRY_PREFIXES = [
  "Democratic Republic of the Congo", "Dominican Republic", "Republic of Congo",
  "Marshall Islands/Kiribati", "Papua New Guinea", "Solomon Islands",
  "South Africa", "New Zealand", "Costa Rica", "El Salvador", "Sierra Leone",
  "Cape Verde", "Cote d'Ivoire", "Cote d.Ivoire", "Czech/Slovak",
  "Scotland/Ireland", "Armenia/Georgia", "Belgium/Netherlands", "Botswana/Namibia",
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Paraguay",
  "Perú", "Uruguay", "Venezuela", "México", "Guatemala", "Honduras", "Nicaragua",
  "Panamá", "Barbados", "Guyana", "Haiti", "Jamaica", "Angola", "Benin",
  "Cameroon", "Ethiopia", "Ghana", "Kenya", "Liberia", "Madagascar", "Malawi",
  "Mozambique", "Nigeria", "Rwanda", "Senegal", "Tanzania", "Togo", "Uganda",
  "Zambia", "Zimbabwe", "Cambodia", "China", "India", "Indonesia", "Japan", "Korea",
  "Mongolia", "Pakistan", "Philippines", "Singapore", "Taiwan", "Thailand", "Vietnam",
  "Australia", "Fiji", "Micronesia", "Samoa", "Tahiti", "Tonga", "Vanuatu", "France",
  "Germany", "Greece", "Hungary", "Italy", "Norway", "Poland", "Portugal", "România",
  "Russia", "Spain", "Sweden", "Ukraine", "Denmark", "England", "Finland", "Albania",
  "Bulgaria",
].sort((a, b) => b.length - a.length);

const REGION_TITLE_OVERRIDES = new Map([
  ["Adriatic", "Adriatic Sea"],
  ["Alpine German-Speaking", "The Church of Jesus Christ of Latter-day Saints in Switzerland"],
  ["Armenia/Georgia", "Armenia"],
  ["Baltic", "Baltic states"],
  ["Belgium/Netherlands", "Belgium"],
  ["Botswana/Namibia", "Botswana"],
  ["Czech/Slovak", "Czech Republic"],
  ["Europe Central", "Central Europe"],
  ["Marshall Islands/Kiribati", "Marshall Islands"],
  ["Micronesia", "Federated States of Micronesia"],
  ["Scotland/Ireland", "Scotland"],
]);

const missions = JSON.parse(await readFile(MISSION_FILE, "utf8"));
let enriched = 0;

for (const mission of missions) {
  const result = await resolveMission(mission);
  mission.wikipediaTitle = result.title;
  mission.wikipediaUrl = result.url;
  mission.photoUrl = result.photoUrl;
  enriched += 1;
  console.log(`Enriched ${enriched}/${missions.length}: ${mission.name} -> ${result.title}`);
}

await writeFile(MISSION_FILE, `${JSON.stringify(missions, null, 2)}\n`, "utf8");

const missingWikipedia = missions.filter((mission) => !mission.wikipediaUrl);
const missingPhotos = missions.filter((mission) => !mission.photoUrl);
console.log(`Wrote Wikipedia metadata for ${missions.length} missions.`);
console.log(`Missing Wikipedia URLs: ${missingWikipedia.length}`);
console.log(`Missing photo URLs: ${missingPhotos.length}`);

async function resolveMission(mission) {
  const candidates = buildTitleCandidates(mission);
  for (const title of candidates) {
    const summary = await fetchSummary(title);
    if (summary?.photoUrl) return summary;
  }

  const fallbackQuery = candidates[0] ?? mission.countryOrRegion;
  return {
    title: fallbackQuery,
    url: `${WIKIPEDIA_SEARCH_URL}${encodeURIComponent(fallbackQuery)}`,
    photoUrl: `${COMMONS_SEARCH_URL}${encodeURIComponent(fallbackQuery)}`,
  };
}

function buildTitleCandidates(mission) {
  const region = normalizePlace(mission.countryOrRegion);
  const override = REGION_TITLE_OVERRIDES.get(mission.countryOrRegion);
  const candidates = [];
  if (override) candidates.push(override);

  const us = splitUsRegion(region);
  if (us) {
    candidates.push(us.city ? `${us.city}, ${us.state}` : us.state);
    if (us.city) candidates.push(us.city);
    candidates.push(us.state);
    return unique(candidates);
  }

  const country = splitCountryRegion(region);
  if (country) {
    if (country.place) candidates.push(`${country.place}, ${country.country}`);
    if (country.place) candidates.push(country.place);
    candidates.push(country.country);
  }

  candidates.push(region, mission.churchArea);
  return unique(candidates.filter(Boolean));
}

function splitUsRegion(region) {
  const state = STATE_NAMES.find((name) => region === normalizePlace(name) || region.startsWith(`${normalizePlace(name)} `));
  if (!state) return null;
  const normalizedState = normalizePlace(state).replace("New Mexico", "New Mexico");
  const city = region.slice(normalizePlace(state).length).trim();
  if (normalizedState === "Washington DC") return { state: "Washington, D.C.", city: "" };
  return { state: normalizedState, city };
}

function splitCountryRegion(region) {
  const country = COUNTRY_PREFIXES.map(normalizePlace).find((name) => region === name || region.startsWith(`${name} `));
  if (!country) return null;
  return { country, place: region.slice(country.length).trim() };
}

async function fetchSummary(title) {
  await sleep(75);
  const response = await fetch(`${SUMMARY_URL}${encodeURIComponent(title)}`, {
    headers: {
      "User-Agent": "Called2ServeQuiz/1.0 (static GitHub Pages data enrichment)",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    await sleep(500);
    return null;
  }

  const data = await response.json();
  if (data.type === "disambiguation" || !data.content_urls?.desktop?.page) return null;

  return {
    title: data.title,
    url: data.content_urls.desktop.page,
    photoUrl: data.originalimage?.source ?? data.thumbnail?.source ?? null,
  };
}

function normalizePlace(value) {
  return String(value)
    .replaceAll("México", "Mexico")
    .replaceAll("Perú", "Peru")
    .replaceAll("Panamá", "Panama")
    .replaceAll("România", "Romania")
    .replaceAll("Cote d.Ivoire", "Cote d'Ivoire")
    .trim();
}

function unique(values) {
  return [...new Set(values)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
