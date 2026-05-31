const form = document.getElementById("analyzerForm");
const headlineInput = document.getElementById("headline");
const sourceInput = document.getElementById("source");
const contentInput = document.getElementById("content");
const verdictLabel = document.getElementById("verdictLabel");
const scoreValue = document.getElementById("scoreValue");
const scoreRing = document.getElementById("scoreRing");
const resultSummary = document.getElementById("resultSummary");
const positiveSignals = document.getElementById("positiveSignals");
const riskSignals = document.getElementById("riskSignals");
const resultsPanel = document.getElementById("resultsPanel");

const samples = {
  reliable: {
    headline: "WHO publishes updated dengue prevention guidance ahead of monsoon season",
    source: "World Health Organization",
    content:
      "The World Health Organization released updated dengue prevention guidance on 5 April 2026, advising local health departments to increase surveillance, reduce standing water, and expand community education. The report cites regional case data from 11 countries and includes recommendations from epidemiologists and public health researchers."
  },
  suspicious: {
    headline: "SHOCKING cure the media hid is finally exposed and doctors are furious",
    source: "TruthStormDaily.net",
    content:
      "A secret natural cure is taking over the world and experts do not want you to know. Everyone must share this immediately before the post gets deleted. There are no studies because powerful groups are blocking the truth, but thousands are apparently being healed overnight."
  }
};

const positiveKeywords = [
  "according to",
  "report",
  "study",
  "data",
  "research",
  "official",
  "published",
  "confirmed",
  "statement",
  "cites"
];

const riskKeywords = [
  "shocking",
  "secret",
  "must share",
  "deleted",
  "they don't want you to know",
  "furious",
  "miracle",
  "overnight",
  "exposed",
  "everyone"
];

const reputableSources = [
  "reuters",
  "associated press",
  "bbc",
  "world health organization",
  "who",
  "unicef",
  "the hindu",
  "ndtv",
  "nature",
  "science"
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function countMatches(text, keywords) {
  return keywords.reduce((count, keyword) => {
    return count + (text.includes(keyword) ? 1 : 0);
  }, 0);
}

function addListItems(list, items) {
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function analyzeArticle(headline, source, content) {
  const combined = `${headline} ${source} ${content}`.toLowerCase();
  const headlineUppercaseRatio =
    headline.replace(/[^A-Z]/g, "").length / Math.max(headline.length, 1);
  const positiveCount = countMatches(combined, positiveKeywords);
  const riskCount = countMatches(combined, riskKeywords);
  const sourceTrusted = reputableSources.some((item) =>
    source.toLowerCase().includes(item)
  );
  const sourceUnknown = source.trim().length === 0 || /daily|truth|viral|buzz/i.test(source);
  const numberCount = (content.match(/\d+/g) || []).length;
  const quoteCount = (content.match(/["']/g) || []).length / 2;

  let score = 50;
  score += positiveCount * 8;
  score += sourceTrusted ? 18 : 0;
  score += Math.min(numberCount, 4) * 4;
  score += Math.min(quoteCount, 2) * 3;
  score -= riskCount * 9;
  score -= headlineUppercaseRatio > 0.28 ? 12 : 0;
  score -= sourceUnknown ? 10 : 0;
  score -= content.length < 140 ? 8 : 0;
  score = clamp(Math.round(score), 6, 98);

  const positives = [];
  const risks = [];

  if (positiveCount > 0) {
    positives.push("The article uses evidence-oriented terms such as reports, data, or published findings.");
  }
  if (sourceTrusted) {
    positives.push("The source name matches a known publisher or institution.");
  }
  if (numberCount > 0) {
    positives.push("Specific numbers or dated details are present, which helps verification.");
  }
  if (quoteCount > 0) {
    positives.push("Quoted language suggests attribution instead of unsupported claims.");
  }
  if (content.length > 220) {
    positives.push("The article has enough detail to evaluate rather than relying on a one-line claim.");
  }

  if (riskCount > 0) {
    risks.push("Emotion-heavy or urgency-driven wording increases manipulation risk.");
  }
  if (headlineUppercaseRatio > 0.28) {
    risks.push("The headline relies on excessive capitalization, a common sensational cue.");
  }
  if (sourceUnknown) {
    risks.push("The source appears vague or brand-like, so authority is harder to confirm.");
  }
  if (content.length < 140) {
    risks.push("The text is too short to support the claim with clear context or evidence.");
  }

  if (!positives.length) {
    positives.push("No strong credibility boosts were detected from the current text.");
  }

  if (!risks.length) {
    risks.push("No major misinformation signals were detected, but external verification is still recommended.");
  }

  let verdict = "Balanced / Needs Review";
  let toneClass = "is-balanced";
  let summary =
    "This article shows a mixed signal profile. Verify the publisher and compare the claim with another reputable source.";

  if (score >= 75) {
    verdict = "Likely Credible";
    toneClass = "is-trusted";
    summary =
      "The article includes several credibility cues such as evidence-focused wording, detail, or a stronger source profile. It still deserves normal fact-checking before you rely on it.";
  } else if (score <= 44) {
    verdict = "High Risk of Misinformation";
    toneClass = "is-risk";
    summary =
      "The content uses multiple low-trust patterns like sensational wording, weak sourcing, or limited evidence. Treat it as unverified until confirmed elsewhere.";
  }

  return { score, verdict, toneClass, summary, positives, risks };
}

function updateResults(analysis) {
  verdictLabel.textContent = analysis.verdict;
  scoreValue.textContent = analysis.score;
  resultSummary.textContent = analysis.summary;
  addListItems(positiveSignals, analysis.positives);
  addListItems(riskSignals, analysis.risks);

  resultsPanel.classList.remove("is-risk", "is-balanced", "is-trusted");
  resultsPanel.classList.add(analysis.toneClass);

  const degrees = Math.round((analysis.score / 100) * 360);
  const ringColor =
    analysis.toneClass === "is-risk"
      ? "#b45309"
      : analysis.toneClass === "is-trusted"
        ? "#0f766e"
        : "#ad7c11";

  scoreRing.style.background = `radial-gradient(circle at center, rgba(255, 250, 242, 0.96) 54%, transparent 55%), conic-gradient(${ringColor} ${degrees}deg, rgba(29, 39, 48, 0.08) ${degrees}deg)`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const analysis = analyzeArticle(
    headlineInput.value.trim(),
    sourceInput.value.trim(),
    contentInput.value.trim()
  );
  updateResults(analysis);
});

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    const sample = samples[button.dataset.sample];
    headlineInput.value = sample.headline;
    sourceInput.value = sample.source;
    contentInput.value = sample.content;
    updateResults(analyzeArticle(sample.headline, sample.source, sample.content));
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${index * 70}ms`;
  observer.observe(element);
});
