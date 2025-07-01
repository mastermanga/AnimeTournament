/* =========================================================================
   CONSTANTES GLOBALES
   ========================================================================= */
const MODE = {
  OPENINGS: "openings",
  ANIMES:   "animes",
};
let currentMode = MODE.OPENINGS;
let data = [];             // tableaux d’objets pour le mode courant
let scores = {};           // { titre: { wins, games } }
let currentPair = [];      // duo en cours

// nombre de duels avant classement final (modifiable) ---------------------
const MAX_GAMES = 10;

/* =========================================================================
   INITIALISATION
   ========================================================================= */
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-openings").onclick = () => switchMode(MODE.OPENINGS);
  document.getElementById("btn-animes").onclick   = () => switchMode(MODE.ANIMES);

  document.getElementById("vote1").onclick = () => handleVote(0);
  document.getElementById("vote2").onclick = () => handleVote(1);

  switchMode(MODE.OPENINGS);                        // charge le 1ᵉʳ mode
});

/* =========================================================================
   CHANGEMENT DE MODE
   ========================================================================= */
async function switchMode(newMode) {
  if (currentMode === newMode) return;

  // mise à jour UI (boutons actifs)
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.getElementById(newMode === MODE.OPENINGS ? "btn-openings" : "btn-animes")
          .classList.add("active");

  // reset
  currentMode = newMode;
  scores      = {};
  currentPair = [];
  document.getElementById("results").innerHTML = "";
  document.getElementById("match-container").style.display = "";
  document.getElementById("vote-buttons").style.display = "";
  disableVotes(true);

  // charge le bon JSON
  const file = newMode === MODE.OPENINGS ? "openings.json" : "animes.json";
  data = await fetch(file).then(r => r.json());

  data.forEach(item => scores[item.title] = { wins: 0, games: 0 });
  nextMatch();
}

/* =========================================================================
   MATCHS & AFFICHAGE
   ========================================================================= */
function nextMatch() {
  currentPair = getRandomPair();
  renderCurrentPair();
}

function getRandomPair() {
  let i = Math.floor(Math.random() * data.length);
  let j;
  do { j = Math.floor(Math.random() * data.length); } while (j === i);
  return [data[i], data[j]];
}

/* ---- affiche les 2 candidats ---- */
function renderCurrentPair() {
  const [a, b] = currentPair;
  const slot1  = document.getElementById("slot1");
  const slot2  = document.getElementById("slot2");

  if (currentMode === MODE.OPENINGS) {
    // vidéo aléatoire pour chaque anime
    const url1 = getEmbedUrl(randomArrayItem(a.youtubeUrls));
    const url2 = getEmbedUrl(randomArrayItem(b.youtubeUrls));

    slot1.innerHTML = `<iframe src="${url1}&autoplay=1&mute=1" allow="autoplay"></iframe>
                       <div class="title">${a.title}</div>`;
    slot2.innerHTML = `<iframe src="${url2}&autoplay=1&mute=1" allow="autoplay"></iframe>
                       <div class="title">${b.title}</div>`;

    // votes verrouillés durant 20 s
    disableVotes(true);
    setTimeout(() => disableVotes(false), 20000);

  } else { // MODE.ANIMES
    slot1.innerHTML = `<img src="${a.image}" alt="${a.title}"/>
                       <div class="title">${a.title}</div>`;
    slot2.innerHTML = `<img src="${b.image}" alt="${b.title}"/>
                       <div class="title">${b.title}</div>`;
    disableVotes(false);       // votes immédiats
  }
}

/* =========================================================================
   VOTE & CLASSEMENT
   ========================================================================= */
function handleVote(winnerIdx) {
  const loserIdx  = winnerIdx ? 0 : 1;
  const winTitle  = currentPair[winnerIdx].title;
  const loseTitle = currentPair[loserIdx].title;

  scores[winTitle].wins  += 1;
  scores[winTitle].games += 1;
  scores[loseTitle].games += 1;

  const totalGamesPlayed = Object.values(scores).reduce((s, o) => s + o.games, 0);
  if (totalGamesPlayed >= MAX_GAMES) showResults();
  else nextMatch();
}

function showResults() {
  disableVotes(true);
  document.getElementById("match-container").style.display = "none";
  document.getElementById("vote-buttons").style.display = "none";

  const results = document.getElementById("results");
  const ranking = Object.entries(scores)
    .filter(([_, s]) => s.games > 0)
    .sort((a, b) => (b[1].wins / b[1].games) - (a[1].wins / a[1].games));

  let html = `<h2>Classement ${currentMode === MODE.OPENINGS ? "Openings" : "Animes"}</h2><ol>`;
  ranking.forEach(([title, s]) => {
    const wr = ((s.wins / s.games) * 100).toFixed(1);
    html += `<li><strong>${title}</strong> — ${s.wins}/${s.games} (${wr} %)</li>`;
  });
  html += "</ol>";
  results.innerHTML = html;
}

/* =========================================================================
   OUTILS
   ========================================================================= */
function disableVotes(state) {
  document.getElementById("vote1").disabled = state;
  document.getElementById("vote2").disabled = state;
}

function randomArrayItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getEmbedUrl(youtubeUrl) {
  /* convertit diverses formes d’URL YouTube → embed */
  const idMatch = youtubeUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return idMatch ? `https://www.youtube.com/embed/${idMatch[1]}?start=0` : youtubeUrl;
}
