import { writeFile } from "node:fs/promises";

const SOURCE_URL = "https://missioncall.app/ldsMissionList.html";
const EXPECTED_2026_TOTAL = 506;


const US_STATE_PREFIXES = "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New México|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|South Carolina|Tennessee|Texas|Utah|Virginia|Washington|West Virginia|Wisconsin|Wyoming|Washington DC";

const COUNTRY_RULES = [
  ["United States", new RegExp("^(" + US_STATE_PREFIXES + ")\\b")],
  ["Croatia", /^Adriatic\b/],
  ["Austria", /^Alpine\b/],
  ["Latvia", /^Baltic\b/],
  ["Turkey", /^Europe Central Turkic and Persian-Speaking\b/],
  ["United Kingdom", /^(England|Scotland\/Ireland)\b/],
  ["South Korea", /^Korea\b/],
  ["Ivory Coast", /^Cote d.Ivoire\b/],
  ["Democratic Republic of the Congo", /^Democratic Republic of the Congo\b/],
  ["Republic of the Congo", /^Republic of Congo\b/],
  ["Czech Republic", /^Czech\/Slovak\b/],
  ["Marshall Islands", /^Marshall Islands\/Kiribati\b/],
  ["Armenia", /^Armenia\/Georgia\b/],
  ["Belgium", /^Belgium\/Netherlands\b/],
  ["Botswana", /^Botswana\/Namibia\b/],
  ["Ukraine", /^Ukraine\b/],
  ["Mexico", /^México\b/],
  ["Panama", /^Panamá(?=\s|$)/],
  ["Peru", /^Perú(?=\s|$)/],
  ["Romania", /^România\b/],
  ["Argentina", /^Argentina\b/],
  ["Albania", /^Albania\b/],
  ["Angola", /^Angola\b/],
  ["Australia", /^Australia\b/],
  ["Barbados", /^Barbados\b/],
  ["Benin", /^Benin\b/],
  ["Bolivia", /^Bolivia\b/],
  ["Brazil", /^Brazil\b/],
  ["Bulgaria", /^Bulgaria\b/],
  ["Cambodia", /^Cambodia\b/],
  ["Cameroon", /^Cameroon\b/],
  ["Canada", /^Canada\b/],
  ["Cape Verde", /^Cape Verde\b/],
  ["Chile", /^Chile\b/],
  ["China", /^China\b/],
  ["Colombia", /^Colombia\b/],
  ["Costa Rica", /^Costa Rica\b/],
  ["Denmark", /^Denmark\b/],
  ["Dominican Republic", /^Dominican Republic\b/],
  ["Ecuador", /^Ecuador\b/],
  ["El Salvador", /^El Salvador\b/],
  ["Ethiopia", /^Ethiopia\b/],
  ["Fiji", /^Fiji\b/],
  ["Finland", /^Finland\b/],
  ["France", /^France\b/],
  ["Georgia", /^Georgia\b/],
  ["Germany", /^Germany\b/],
  ["Ghana", /^Ghana\b/],
  ["Greece", /^Greece\b/],
  ["Guatemala", /^Guatemala\b/],
  ["Guyana", /^Guyana\b/],
  ["Haiti", /^Haiti\b/],
  ["Honduras", /^Honduras\b/],
  ["Hungary", /^Hungary\b/],
  ["India", /^India\b/],
  ["Indonesia", /^Indonesia\b/],
  ["Italy", /^Italy\b/],
  ["Jamaica", /^Jamaica\b/],
  ["Japan", /^Japan\b/],
  ["Kenya", /^Kenya\b/],
  ["Liberia", /^Liberia\b/],
  ["Madagascar", /^Madagascar\b/],
  ["Malawi", /^Malawi\b/],
  ["Micronesia", /^Micronesia\b/],
  ["Mongolia", /^Mongolia\b/],
  ["Mozambique", /^Mozambique\b/],
  ["New Zealand", /^New Zealand\b/],
  ["Nicaragua", /^Nicaragua\b/],
  ["Nigeria", /^Nigeria\b/],
  ["Norway", /^Norway\b/],
  ["Pakistan", /^Pakistan\b/],
  ["Papua New Guinea", /^Papua New Guinea\b/],
  ["Paraguay", /^Paraguay\b/],
  ["Philippines", /^Philippines\b/],
  ["Poland", /^Poland\b/],
  ["Portugal", /^Portugal\b/],
  ["Puerto Rico", /^Puerto Rico\b/],
  ["Russia", /^Russia\b/],
  ["Rwanda", /^Rwanda\b/],
  ["Samoa", /^Samoa\b/],
  ["Senegal", /^Senegal\b/],
  ["Sierra Leone", /^Sierra Leone\b/],
  ["Singapore", /^Singapore\b/],
  ["Solomon Islands", /^Solomon Islands\b/],
  ["South Africa", /^South Africa\b/],
  ["Spain", /^Spain\b/],
  ["Sweden", /^Sweden\b/],
  ["French Polynesia", /^Tahiti\b/],
  ["Taiwan", /^Taiwan\b/],
  ["Tanzania", /^Tanzania\b/],
  ["Thailand", /^Thailand\b/],
  ["Togo", /^Togo\b/],
  ["Tonga", /^Tonga\b/],
  ["Uganda", /^Uganda\b/],
  ["Uruguay", /^Uruguay\b/],
  ["Vanuatu", /^Vanuatu\b/],
  ["Venezuela", /^Venezuela\b/],
  ["Vietnam", /^Vietnam\b/],
  ["Zambia", /^Zambia\b/],
  ["Zimbabwe", /^Zimbabwe\b/],
];

const AREA_RULES = [
  ["United States", /^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New México|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|South Carolina|Tennessee|Texas|Utah|Virginia|Washington|West Virginia|Wisconsin|Wyoming|Washington DC)\b/],
  ["North America", /^(Canada|Puerto Rico)\b/],
  ["Mexico", /^México\b/],
  ["Central America", /^(Costa Rica|El Salvador|Guatemala|Honduras|Nicaragua|Panamá)\b/],
  ["Caribbean", /^(Barbados|Dominican Republic|Guyana|Haiti|Jamaica)\b/],
  ["South America", /^(Argentina|Bolivia|Brazil|Chile|Colombia|Ecuador|Paraguay|Perú|Uruguay|Venezuela)\b/],
  ["Europe", /^(Adriatic|Albania|Alpine|Armenia\/Georgia|Baltic|Belgium\/Netherlands|Bulgaria|Czech\/Slovak|Denmark|England|Europe Central|Finland|France|Germany|Greece|Hungary|Italy|Norway|Poland|Portugal|România|Russia|Scotland\/Ireland|Spain|Sweden|Ukraine)\b/],
  ["Africa", /^(Angola|Benin|Botswana\/Namibia|Cameroon|Cape Verde|Cote d.Ivoire|Democratic Republic of the Congo|Ethiopia|Ghana|Kenya|Liberia|Madagascar|Malawi|Mozambique|Nigeria|Republic of Congo|Rwanda|Senegal|Sierra Leone|South Africa|Tanzania|Togo|Uganda|Zambia|Zimbabwe)\b/],
  ["Asia", /^(Cambodia|China|India|Indonesia|Japan|Korea|Mongolia|Pakistan|Philippines|Singapore|Taiwan|Thailand|Vietnam)\b/],
  ["Pacific", /^(Australia|Fiji|Marshall Islands\/Kiribati|Micronesia|New Zealand|Papua New Guinea|Samoa|Solomon Islands|Tahiti|Tonga|Vanuatu)\b/],
];

const LANGUAGE_RULES = [
  ["Spanish", /^(Argentina|Bolivia|Chile|Colombia|Costa Rica|Dominican Republic|Ecuador|El Salvador|Guatemala|Honduras|México|Nicaragua|Panamá|Paraguay|Perú|Puerto Rico|Uruguay|Venezuela|Spain)\b/],
  ["Portuguese", /^(Brazil|Portugal|Angola|Cape Verde|Mozambique)\b/],
  ["French", /^(Belgium\/Netherlands|Benin|Cameroon|Cote d.Ivoire|Democratic Republic of the Congo|France|Haiti|Republic of Congo|Senegal|Tahiti|Togo)\b/],
  ["English", /^(Alabama|Alaska|Arizona|Arkansas|Australia|California|Canada|Colorado|England|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Jamaica|Kansas|Kentucky|Louisiana|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New York|New Zealand|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Scotland\/Ireland|South Carolina|Tennessee|Texas|Utah|Virginia|Washington|West Virginia|Wisconsin|Wyoming|Washington DC)\b/],
  ["German", /^(Alpine|Germany)\b/],
  ["Japanese", /^Japan\b/],
  ["Korean", /^Korea\b/],
  ["Mandarin", /^(China|Taiwan)\b/],
  ["Tagalog", /^Philippines\b/],
];

const HOT = /^(Angola|Arizona|Barbados|Benin|Bolivia|Botswana\/Namibia|Brazil|Cambodia|Cameroon|Cape Verde|Colombia|Costa Rica|Cote d.Ivoire|Democratic Republic of the Congo|Dominican Republic|Ecuador|El Salvador|Ethiopia|Fiji|Florida|Ghana|Guatemala|Guyana|Haiti|Honduras|India|Indonesia|Jamaica|Kenya|Liberia|Madagascar|Malawi|Marshall Islands\/Kiribati|México|Micronesia|Mozambique|Nicaragua|Nigeria|Panamá|Papua New Guinea|Paraguay|Perú|Philippines|Puerto Rico|Republic of Congo|Rwanda|Samoa|Senegal|Sierra Leone|Singapore|Solomon Islands|Tahiti|Tanzania|Thailand|Togo|Tonga|Uganda|Vanuatu|Venezuela|Vietnam|Zambia|Zimbabwe)\b/;
const COLD = /^(Alaska|Baltic|Canada|Denmark|Finland|Mongolia|New Hampshire|New York|North Dakota|Norway|Russia|Sweden|Ukraine|Wyoming)\b/;
const URBAN = /(Barcelona|Bengaluru|Berlin|Bogotá|Boston|Buenos Aires|Chicago|Dallas|Denver|Frankfurt|Hong Kong|Houston|Jakarta|Johannesburg|Kampala|Kinshasa|Lagos|Lima|London|Los Angeles|Madrid|Manila|Melbourne|México City|Milan|Monterrey|Montreal|New York|Paris|Philadelphia|Phoenix|Portland|Quito|Recife|Rome|Salt Lake City|San Francisco|Santiago|São Paulo|Seattle|Seoul|Singapore|Sydney|Taipei|Tokyo|Toronto|Vancouver|Washington DC)/;
const RURAL = /(Alaska|Billings|Bismarck|Daru|Farmington|Flagstaff|Iquitos|Kiribati|Missoula|Montana|Namibia|North Dakota|Papua New Guinea|Reno|Wyoming|Yakima)/;

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Could not fetch ${SOURCE_URL}: ${response.status}`);
}

const html = await response.text();
const names = [...html.matchAll(/<a\s+href="[^"]*missionId=[^"]+">([^<]+)<\/a>/g)]
  .map((match) => decodeEntities(match[1].trim()))
  .filter((name) => name.endsWith(" Mission"));

const uniqueNames = [...new Set(names)].sort((a, b) => a.localeCompare(b));

const missions = uniqueNames.map((name) => {
  const countryOrRegion = deriveRegion(name);
  const churchArea = deriveArea(countryOrRegion);
  const languages = deriveLanguages(countryOrRegion);
  const climate = deriveClimate(countryOrRegion);
  const density = deriveDensity(name, countryOrRegion);
  const tags = deriveTags({ name, countryOrRegion, churchArea, languages, climate, density });
  const scores = deriveScores({ churchArea, languages, climate, density, tags });

  return {
    id: slugify(name),
    name,
    churchCountry: deriveChurchCountry(countryOrRegion),
    churchWebsiteUrl: buildChurchWebsiteUrl(countryOrRegion, name),
    countryOrRegion,
    churchArea,
    languages,
    climate,
    density,
    adventure: scores.adventure,
    cultureShift: scores.cultureShift,
    tags,
    scores,
  };
});

await writeFile(
  "data/missions.json",
  `${JSON.stringify(missions, null, 2)}\n`,
  "utf8",
);

console.log(`Wrote ${missions.length} missions to data/missions.json`);
if (missions.length !== EXPECTED_2026_TOTAL) {
  console.warn(
    `Warning: expected ${EXPECTED_2026_TOTAL} missions from the 2026 Newsroom total, but source produced ${missions.length}.`,
  );
}

function deriveRegion(name) {
  return name.replace(/\s+(East|North|Northeast|Northwest|South|Southeast|West|Central)\s+Mission$/, " Mission")
    .replace(/\s+Mission$/, "")
    .replace(/\s+(East|North|South|West|Central)$/, "");
}

function deriveArea(region) {
  return AREA_RULES.find(([, pattern]) => pattern.test(region))?.[0] ?? "International";
}

function deriveLanguages(region) {
  const languages = LANGUAGE_RULES.filter(([, pattern]) => pattern.test(region)).map(([language]) => language);
  return languages.length ? languages : ["Local language"];
}

function deriveClimate(region) {
  if (HOT.test(region)) return "hot";
  if (COLD.test(region)) return "cold";
  return "temperate";
}

function deriveDensity(name, region) {
  if (URBAN.test(name)) return "urban";
  if (RURAL.test(name) || RURAL.test(region)) return "rural";
  return "mixed";
}

function deriveTags(mission) {
  const tags = new Set([mission.churchArea.toLowerCase().replaceAll(" ", "-"), mission.climate, mission.density]);
  if (mission.languages.some((language) => language !== "English")) tags.add("language");
  if (mission.languages.includes("Spanish")) tags.add("spanish");
  if (mission.languages.includes("Portuguese")) tags.add("portuguese");
  if (["Africa", "Asia", "Pacific"].includes(mission.churchArea)) tags.add("far-from-provo");
  if (mission.density === "urban") tags.add("big-city");
  if (mission.density === "rural") tags.add("wide-open");
  if (/Island|Kiribati|Micronesia|Samoa|Tahiti|Tonga|Vanuatu|Fiji|Hawaii|Cape Verde/.test(mission.name)) {
    tags.add("island");
  }
  return [...tags].slice(0, 6);
}

function deriveScores(mission) {
  return {
    climateWarm: mission.climate === "hot" ? 3 : mission.climate === "cold" ? -2 : 0,
    climateCold: mission.climate === "cold" ? 3 : mission.climate === "hot" ? -2 : 0,
    urban: mission.density === "urban" ? 3 : mission.density === "mixed" ? 1 : -2,
    rural: mission.density === "rural" ? 3 : mission.density === "mixed" ? 1 : -2,
    language: mission.languages.some((language) => language !== "English") ? 3 : -1,
    adventure: ["Africa", "Asia", "Pacific", "South America"].includes(mission.churchArea) ? 3 : 1,
    cultureShift: mission.churchArea === "United States" ? 0 : mission.churchArea === "North America" ? 1 : 3,
    food: mission.languages.some((language) => ["Spanish", "Portuguese", "French", "Japanese", "Korean", "Tagalog"].includes(language)) ? 2 : 0,
    pace: mission.density === "urban" ? 3 : mission.density === "mixed" ? 1 : -1,
    uncertainty: ["Africa", "Asia", "Pacific", "South America", "Europe"].includes(mission.churchArea) ? 2 : 0,
  };
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveChurchCountry(region) {
  return COUNTRY_RULES.find(([, pattern]) => pattern.test(region))?.[0] ?? null;
}

function buildChurchWebsiteUrl(region, name) {
  const country = deriveChurchCountry(region);
  if (!country) {
    const params = new URLSearchParams({
      lang: "eng",
      query: name,
    });
    return "https://www.churchofjesuschrist.org/search?" + params.toString();
  }
  return "https://newsroom.churchofjesuschrist.org/facts-and-statistics/country/" + slugify(country);
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&eacute;/g, "é");
}
