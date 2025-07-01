const MODE = {
  OPENINGS: 'openings',
  ANIMES: 'animes'
};

let currentMode = MODE.OPENINGS;
let data = [];
let scores = {};
let currentPair = [];
let animeMatches = [];
let currentAnimeMatchIndex = 0;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function randomArrayItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPair() {
  let a = randomArrayItem(data);
  let b;
  do {
    b = randomArrayItem(data);
  } while (a === b);
  return [a, b];
}

function generateAnimeMatches(animes, matchesPerAnime = 5) {
  const pairs = [];
  const opponentsMap = {};
  for (let anime of animes) {
    opponentsMap[anime.title] = new Set();
  }
  for (let anime of animes) {
    while (opponentsMap[anime.title].size < matchesPerAnime) {
      const opponent = randomArrayItem(animes);
      if (
        opponent.title !== anime.title &&
        !opponentsMap[anime.title].has(opponent.title) &&
        (opponentsMap[opponent.title]?.size || 0) < matchesPerAnime
      ) {
        opponentsMap[anime.title].add(opponent.title);
        opponentsMap[opponent.title].add(anime.title);
        pairs.push([anime, opponent]);
      }
    }
  }
  return shuffleArray(pairs);
}

function renderCurrentPair() {
  const [left, right] = currentPair;
  document.getElementById("left").innerHTML = currentMode === MODE.OPENINGS ?
    `<h2>${left.title}</h2><iframe width="300" height="169" src="${left.youtubeUrls[0].replace("watch?v=", "embed/")}" frameborder="0" allowfullscreen></iframe>` :
    `<h2>${left.title}</h2><img src="${left.image}" alt="${left.title}">`;
  document.getElementById("right").innerHTML = currentMode === MODE.OPENINGS ?
    `<h2>${right.title}</h2><iframe width="300" height="169" src="${right.youtubeUrls[0].replace("watch?v=", "embed/")}" frameborder="0" allowfullscreen></iframe>` :
    `<h2>${right.title}</h2><img src="${right.image}" alt="${right.title}">`;
}

function nextMatch() {
  if (currentMode === MODE.OPENINGS) {
    currentPair = getRandomPair();
    renderCurrentPair();
  } else {
    if (currentAnimeMatchIndex >= animeMatches.length) {
      showResults();
      return;
    }
    currentPair = animeMatches[currentAnimeMatchIndex];
    currentAnimeMatchIndex++;
    renderCurrentPair();
  }
}

function vote(winnerIndex) {
  const [left, right] = currentPair;
  const winner = winnerIndex === 0 ? left : right;
  const loser = winnerIndex === 0 ? right : left;

  scores[winner.title].wins++;
  scores[winner.title].games++;
  scores[loser.title].games++;
  nextMatch();
}

function showResults() {
  const sorted = Object.entries(scores).map(([title, { wins, games }]) => ({
    title,
    winrate: (wins / games) || 0,
    wins,
    games
  })).sort((a, b) => b.winrate - a.winrate);

  document.getElementById("match").style.display = "none";
  document.getElementById("vote-buttons").style.display = "none";
  document.getElementById("results").innerHTML =
    `<h2>Classement</h2><ol>` +
    sorted.map(s => `<li>${s.title} - ${s.wins}/${s.games} (${(s.winrate*100).toFixed(1)}%)</li>`).join('') +
    `</ol>`;
}

async function switchMode(newMode) {
  document.getElementById("match").style.display = "flex";
  document.getElementById("vote-buttons").style.display = "block";
  document.getElementById("results").innerHTML = "";
  document.getElementById("mode-openings").classList.toggle("active", newMode === MODE.OPENINGS);
  document.getElementById("mode-animes").classList.toggle("active", newMode === MODE.ANIMES);

  currentMode = newMode;
  const file = newMode === MODE.OPENINGS ? "openings.json" : "animes.json";
  const fullData = await fetch(file).then(r => r.json());

  if (newMode === MODE.ANIMES) {
    data = shuffleArray([...fullData]).slice(0, 16);
    scores = {};
    data.forEach(item => scores[item.title] = { wins: 0, games: 0 });
    animeMatches = generateAnimeMatches(data, 5);
    currentAnimeMatchIndex = 0;
    nextMatch();
  } else {
    data = fullData;
    scores = {};
    data.forEach(item => scores[item.title] = { wins: 0, games: 0 });
    nextMatch();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("vote-left").onclick = () => vote(0);
  document.getElementById("vote-right").onclick = () => vote(1);

  document.getElementById("mode-openings").onclick = () => switchMode(MODE.OPENINGS);
  document.getElementById("mode-animes").onclick = () => switchMode(MODE.ANIMES);

  document.getElementById("toggle-theme").onclick = () => {
    document.body.classList.toggle("dark");
  };

  switchMode(MODE.OPENINGS);
});
