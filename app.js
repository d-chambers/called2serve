import { LOCALES } from "./src/locales.js";

const FINALIST_SCORE_BAND = 8;

const DIMENSIONS = [
  "climateWarm",
  "climateCold",
  "urban",
  "rural",
  "language",
  "adventure",
  "cultureShift",
  "food",
  "pace",
  "uncertainty",
];

const state = {
  missions: [],
  questions: [],
  answers: [],
  answerIndexes: [],
  index: 0,
  locale: localStorage.getItem("called2serve.locale") || "en",
  renderedMission: null,
  renderedProfile: null,
};

if (!LOCALES[state.locale]) {
  state.locale = "en";
}

const app = document.querySelector("#app");
const languageSelect = document.querySelector("#language-select");

init();

async function init() {
  setupLanguageSelect();
  applyStaticTranslations();

  const loadingEl = app.querySelector(".loading");
  if (loadingEl) {
    loadingEl.textContent = randomLoadingMessage();
  }

  try {
    const [missionsResponse, questionsResponse] = await Promise.all([
      fetch("./data/missions.json"),
      fetch("./data/questions.json"),
    ]);

    if (!missionsResponse.ok || !questionsResponse.ok) {
      throw new Error(t("dataError"));
    }

    state.missions = await missionsResponse.json();
    state.questions = await questionsResponse.json();

    const directResult = new URLSearchParams(window.location.search).get("result");
    if (directResult) {
      const mission = state.missions.find((item) => item.id === directResult);
      mission ? renderResult(mission, null) : renderStart();
      return;
    }

    renderStart();
  } catch (error) {
    app.innerHTML = `
      <p class="error">${escapeHtml(t("errorTitle"))}</p>
      <p class="body-copy">${escapeHtml(error.message)}</p>
    `;
  }
}

function setupLanguageSelect() {
  languageSelect.value = state.locale;
  languageSelect.addEventListener("change", () => {
    state.locale = languageSelect.value;
    localStorage.setItem("called2serve.locale", state.locale);
    applyStaticTranslations();
    rerenderCurrentView();
  });
}

function applyStaticTranslations() {
  document.documentElement.lang = t("htmlLang");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
}

function rerenderCurrentView() {
  if (state.renderedMission) {
    renderResult(state.renderedMission, state.renderedProfile);
  } else if (state.answerIndexes.length || state.index > 0) {
    renderQuestion();
  } else if (state.questions.length) {
    renderStart();
  }
}

function renderStart() {
  clearResultParam();
  state.answers = [];
  state.answerIndexes = [];
  state.index = 0;
  state.renderedMission = null;
  state.renderedProfile = null;

  app.innerHTML = `
    <div class="start">
      <div>
        <p class="kicker">${escapeHtml(t("startKicker"))}</p>
        <h2>${escapeHtml(t("startTitle"))}</h2>
        <p class="body-copy">${escapeHtml(t("startCopy"))}</p>
        <div class="meta-grid">
          <div class="meta"><strong>${state.questions.length}</strong><span>${escapeHtml(t("questionsLabel"))}</span></div>
          <div class="meta"><strong>${state.missions.length}</strong><span>${escapeHtml(t("missionsLabel"))}</span></div>
          <div class="meta"><strong>${escapeHtml(randomAccuracy())}</strong><span>${escapeHtml(t("accuracyLabel"))}</span></div>
        </div>
      </div>
      <div class="controls">
        <button class="button" type="button" data-action="start">${escapeHtml(t("startButton"))}</button>
      </div>
    </div>
  `;

  app.querySelector("[data-action='start']").addEventListener("click", () => {
    renderQuestion();
  });
}

function renderQuestion() {
  state.renderedMission = null;
  state.renderedProfile = null;

  const question = state.questions[state.index];
  const localizedQuestion = localizeQuestion(question);
  const progress = Math.round((state.index / state.questions.length) * 100);

  app.innerHTML = `
    <div class="question">
      <div class="progress" aria-label="${escapeHtml(t("progressLabel"))}">
        <span style="width: ${progress}%"></span>
      </div>
      <div class="question-header">
        <p class="question-count">${escapeHtml(t("questionCount", state.index + 1, state.questions.length))}</p>
        <h2>${escapeHtml(localizedQuestion.prompt)}</h2>
      </div>
      <div class="answers">
        ${localizedQuestion.answers
          .map(
            (answer, index) => `
              <button class="answer" type="button" data-answer="${index}">
                ${escapeHtml(answer.label)}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="controls">
        <button class="button secondary" type="button" data-action="back" ${
          state.index === 0 ? "disabled" : ""
        }>${escapeHtml(t("backButton"))}</button>
        <button class="button secondary" type="button" data-action="restart">${escapeHtml(t("restartButton"))}</button>
      </div>
    </div>
  `;

  app.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const answerIndex = Number(button.dataset.answer);
      const answer = question.answers[answerIndex];
      state.answers[state.index] = answer;
      state.answerIndexes[state.index] = answerIndex;
      state.answers = state.answers.slice(0, state.index + 1);
      state.answerIndexes = state.answerIndexes.slice(0, state.index + 1);
      state.index += 1;

      if (state.index >= state.questions.length) {
        renderResult(scoreMission(), computeUserProfile());
      } else {
        renderQuestion();
      }
    });
  });

  app.querySelector("[data-action='back']").addEventListener("click", () => {
    if (state.index > 0) {
      state.index -= 1;
      renderQuestion();
    }
  });

  app.querySelector("[data-action='restart']").addEventListener("click", renderStart);
}

function computeUserProfile() {
  const profile = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 0]));

  for (const answer of state.answers) {
    for (const [dimension, value] of Object.entries(answer.scores ?? {})) {
      profile[dimension] = (profile[dimension] ?? 0) + value;
    }
  }

  return profile;
}

function scoreMission() {
  const profile = computeUserProfile();
  const scored = state.missions.map((mission) => ({
    mission,
    score: DIMENSIONS.reduce((total, dimension) => {
      const userValue = profile[dimension] ?? 0;
      const missionValue = mission.scores?.[dimension] ?? 0;
      return total + userValue * missionValue;
    }, 0),
  }));
  const bestScore = Math.max(...scored.map((item) => item.score));
  const finalists = scored
    .filter((item) => item.score >= bestScore - FINALIST_SCORE_BAND)
    .sort((a, b) => a.mission.id.localeCompare(b.mission.id));
  const answerPath = state.answerIndexes.join("");
  const finalistIndex = hashString(answerPath) % finalists.length;

  return finalists[finalistIndex].mission;
}

function renderResult(mission, profile) {
  state.renderedMission = mission;
  state.renderedProfile = profile;

  const url = new URL(window.location.href);
  url.searchParams.set("result", mission.id);
  window.history.replaceState({}, "", url);

  const intro = buildResultIntro(mission, profile);
  const persona = pickPersona(profile);
  const personaBadge = persona
    ? `<p class="persona"><span>${escapeHtml(t("personaLabel"))}</span>${escapeHtml(persona)}</p>`
    : "";
  const missionPhoto = mission.photoUrl
    ? mission.wikipediaUrl
      ? `<a class="mission-photo-link" href="${escapeAttribute(mission.wikipediaUrl)}" target="_blank" rel="noopener noreferrer"><img class="mission-photo" src="${escapeAttribute(mission.photoUrl)}" alt="${escapeAttribute(mission.wikipediaTitle ?? mission.name)}" loading="lazy"></a>`
      : `<img class="mission-photo" src="${escapeAttribute(mission.photoUrl)}" alt="${escapeAttribute(mission.wikipediaTitle ?? mission.name)}" loading="lazy">`
    : "";
  app.innerHTML = `
    <div class="result">
      <div>
        <p class="kicker">${escapeHtml(t("resultKicker"))}</p>
        <h2 class="mission-name">${escapeHtml(mission.name)}</h2>
        ${missionPhoto}
        ${personaBadge}
        <p class="body-copy">${escapeHtml(intro)}</p>
        <div class="result-details">
          <div class="detail"><span>${escapeHtml(t("regionLabel"))}</span><strong>${escapeHtml(mission.countryOrRegion)}</strong></div>
          <div class="detail"><span>${escapeHtml(t("areaLabel"))}</span><strong>${escapeHtml(mission.churchArea)}</strong></div>
          <div class="detail"><span>${escapeHtml(t("climateLabel"))}</span><strong>${escapeHtml(localizeValue(mission.climate))}</strong></div>
          <div class="detail"><span>${escapeHtml(t("densityLabel"))}</span><strong>${escapeHtml(localizeValue(mission.density))}</strong></div>
        </div>
        <div class="pill-row">
          ${mission.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
      <div class="controls">
        <button class="button" type="button" data-action="share">${escapeHtml(t("shareButton"))}</button>
        <button class="button secondary" type="button" data-action="restart">${escapeHtml(t("tryAgainButton"))}</button>
        <a class="button secondary" href="${escapeAttribute(mission.churchWebsiteUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("websiteLabel"))}</a>
      </div>
    </div>
  `;

  app.querySelector("[data-action='restart']").addEventListener("click", renderStart);
  app.querySelector("[data-action='share']").addEventListener("click", async (event) => {
    await copyResultLink();
    event.currentTarget.textContent = t("copiedButton");
  });
}

function buildResultIntro(mission, profile) {
  if (!profile) {
    return t("sharedIntro");
  }

  const descriptors = [];
  const descriptorText = t("descriptors");
  if ((profile.adventure ?? 0) > 4) descriptors.push(descriptorText.adventure);
  if ((profile.food ?? 0) > 4) descriptors.push(descriptorText.food);
  if ((profile.language ?? 0) > 3) descriptors.push(descriptorText.language);
  if ((profile.urban ?? 0) > (profile.rural ?? 0)) descriptors.push(descriptorText.urban);
  if ((profile.rural ?? 0) > (profile.urban ?? 0)) descriptors.push(descriptorText.rural);

  const reason = descriptors.length ? descriptors.slice(0, 2).join(descriptorText.join) : descriptorText.fallback;
  return `${t("resultPrefix")} ${reason}, ${t("resultSuffix", mission.countryOrRegion)}`;
}

async function copyResultLink() {
  const link = window.location.href;
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(link);
    return;
  }

  const input = document.createElement("input");
  input.value = link;
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function clearResultParam() {
  const url = new URL(window.location.href);
  if (url.searchParams.has("result")) {
    url.searchParams.delete("result");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
}

function localizeQuestion(question) {
  const translation = question.i18n?.[state.locale];
  if (!translation) {
    return question;
  }

  return {
    ...question,
    prompt: translation.prompt ?? question.prompt,
    answers: question.answers.map((answer, index) => ({
      ...answer,
      label: translation.answers?.[index] ?? answer.label,
    })),
  };
}

function localizeValue(value) {
  return t("values")?.[value] ?? titleCase(value);
}

function t(key, ...args) {
  const value = LOCALES[state.locale]?.[key] ?? LOCALES.en[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

// Dimensions that map to a fun "P-day persona". Climate dimensions are left out
// on purpose — "The Lukewarm Saint" is not the energy we are going for.
const PERSONA_DIMENSIONS = [
  "adventure",
  "food",
  "language",
  "urban",
  "rural",
  "pace",
  "uncertainty",
  "cultureShift",
];

function pickPersona(profile) {
  if (!profile) {
    return null;
  }

  const personas = t("personas");
  let bestDimension = null;
  let bestValue = -Infinity;
  for (const dimension of PERSONA_DIMENSIONS) {
    const value = profile[dimension] ?? 0;
    if (value > bestValue) {
      bestValue = value;
      bestDimension = dimension;
    }
  }

  if (bestValue <= 0) {
    return personas.fallback;
  }
  return personas[bestDimension] ?? personas.fallback;
}

function randomItem(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function randomLoadingMessage() {
  return randomItem(t("loadingMessages") ?? [t("loading")]);
}

function randomAccuracy() {
  return randomItem(t("accuracyValues") ?? ["0%"]);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function titleCase(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeAttribute(value) {
  return escapeHtml(value ?? "");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}
