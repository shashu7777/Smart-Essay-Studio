/* ========= Helpers ========= */
const $ = (sel) => document.querySelector(sel);

const generateBtn = document.getElementById("generateBtn");
const topicEl = $("#topic");
const essayEl = $("#essay");
const wordCountEl = $("#wordCount");
const charCountEl = $("#charCount");
const readTimeEl = $("#readTime");
const topicCountEl = $("#topicCount");
const saveBadge = $("#saveBadge");
const clearBtn = $("#clearBtn");
const themeToggle = $("#themeToggle");
const form = $("#essayForm");

const STORAGE_KEY = "essay-studio:v1";

/* ========= Theme Toggle ========= */
(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  });
})();

/* ========= Autosave ========= */
function saveDraft() {
  const payload = {
    topic: topicEl.value.trim(),
    essay: essayEl.value,
    ts: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  saveBadge.style.opacity = "1";
  saveBadge.style.transform = "translateY(0)";
  setTimeout(() => {
    saveBadge.style.opacity = "0";
    saveBadge.style.transform = "translateY(-4px)";
  }, 1000);
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { topic, essay } = JSON.parse(raw);
    if (topic) topicEl.value = topic;
    if (essay) essayEl.value = essay;
    updateCounts();
  } catch { }
}

/* ========= Counters ========= */
function countWords(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}
function updateCounts() {
  const essay = essayEl.value;
  const words = countWords(essay);
  const chars = essay.length;
  const minutes = Math.max(1, Math.round(words / 200));
  wordCountEl.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  charCountEl.textContent = `${chars} ${chars === 1 ? "character" : "characters"}`;
  readTimeEl.textContent = `~${minutes} min read`;
  topicCountEl.textContent = `${topicEl.value.length} / ${topicEl.maxLength}`;
}

/* ========= Events ========= */
document.addEventListener("DOMContentLoaded", () => {
  restoreDraft();
  updateCounts();
  topicEl.addEventListener("input", () => { updateCounts(); saveDraft(); });
  essayEl.addEventListener("input", () => { updateCounts(); saveDraft(); });
  clearBtn.addEventListener("click", () => {
    if (confirm("Clear the current draft?")) {
      // topicEl.value = "";
      essayEl.value = "";
      updateCounts();
      saveDraft();
      // Reset & hide result card
      $("#scoreBox").innerHTML = "";
      $("#feedbackBox").innerHTML = "";
      $("#resultCard").classList.add("hidden");
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveDraft();
    }
  });
});

/* ========= Submit ========= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const topic = topicEl.value.trim();
  const essay = essayEl.value.trim();

  if (!topic) {
    topicEl.focus();
    alert("Please Generate a topic.");
    return;
  }
  else if (essay.length < 50) {
    essayEl.focus();
    alert("Your essay looks a bit short. Please write at least 50 characters.");
    return;
  }
  else {
    // Simulate a submit action
    console.log("SUBMITTED", { topic, essayLength: essay.length, words: countWords(essay) });
    saveDraft();
    alert("✅ Your essay was submitted (demo). Hook this up to your backend as needed.");

    const payload = {
      'topic': topic,
      'essay': essay
    }

    const response = await fetch("http://localhost:5000/analyse_essay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    console.log("Evaluation result:", data);

    // Extract score + feedback
    let feedback = data.feedback || "";

    // Render bold (**...**) as <strong>
    feedback = feedback.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Split out score if present
    const scoreMatch = feedback.match(/Score:\s*\d+\/100/);
    const scoreText = scoreMatch ? scoreMatch[0] : "";

    // Remove score from feedback so it's not duplicated
    let cleanedFeedback = feedback.replace(scoreMatch, "").trim();

    // Inject into UI
    $("#scoreBox").innerHTML = scoreText;
    $("#feedbackBox").innerHTML = cleanedFeedback;
    $("#resultCard").classList.remove("hidden");


  }

});


/* ========= Generate Topic ========= */
generateBtn.addEventListener("click", async () => {
  topicEl.value = "Generating...";
  updateCounts();

  try {
    // ======== AI CALL ========

    const response = await fetch("http://localhost:5000/generate_topic");
    const data = await response.json()
    console.log(data.topic);
    const generatedTopic = data.topic;
    console.log(generatedTopic);
    topicEl.value = generatedTopic;
    // =========================================
  } catch (err) {
    console.error(err);
    alert("Failed to generate topic. Try again.");
    topicEl.value = "";
  }

  updateCounts();
  saveDraft();
});
