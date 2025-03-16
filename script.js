// ID вашей таблицы Google Sheets
const spreadsheetId = "1XsEzpmbQv4cFJjAgfROMPD7TEOy_gn22_IaPje4ZSRw";

// Ваш API-ключ Google (как указано)
const apiKey = "AIzaSyAAahivxgg6dlHcjc26wF326qYg2fXXrqw";

// Диапазон листа "Marvel Rivals" (A2:H1000)
const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Marvel Rivals!A2:H1000?key=${apiKey}`;

// Массив с данными игроков
let players = [];

// Параметры пагинации
let currentPage = 1;
const pageSize = 8;
const maxVisibleButtons = 5;

// Загрузка игроков
function fetchPlayers() {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Предположим, в листе столбцы идут:
      // 0: timestamp
      // 1: email
      // 2: nickname
      // 3: role
      // 4: situation
      // 5: rank
      // 6: replayCode
      // 7: status
      players = (data.values || [])
        .filter((row) => row[2]) // у кого есть ник
        .map((row, index) => ({
          id: index + 1,
          timestamp: row[0] || "",
          email: row[1] || "",
          nickname: row[2] || "",
          role: row[3] || "",
          situation: row[4] || "",
          rank: row[5] || "",
          replayCode: row[6] || "",
          status: row[7] || ""
        }));

      displayPlayerList();
      displayPagination();
      checkUrlParams();
    })
    .catch((error) => {
      console.error("Ошибка загрузки данных:", error);
    });
}

// Отображение списка на текущей странице
function displayPlayerList() {
  const list = document.getElementById("playerList");
  list.innerHTML = "";

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const playersToShow = players.slice(startIndex, endIndex);

  playersToShow.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player.nickname;
    li.onclick = () => displayPlayerDetails(player);
    list.appendChild(li);
  });
}

// Пагинация
function displayPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(players.length / pageSize);
  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  } else {
    pagination.style.display = "flex";
  }

  let startPage = Math.max(currentPage - Math.floor(maxVisibleButtons / 2), 1);
  let endPage = Math.min(startPage + maxVisibleButtons - 1, totalPages);

  if (endPage - startPage + 1 < maxVisibleButtons) {
    startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
  }

  // Кнопка "1"
  if (startPage > 1) {
    pagination.appendChild(createPaginationButton(1, "1"));
    if (startPage > 2) {
      pagination.appendChild(createPaginationDots());
    }
  }

  // Кнопки в диапазоне
  for (let i = startPage; i <= endPage; i++) {
    pagination.appendChild(createPaginationButton(i, i.toString()));
  }

  // Кнопка "last"
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pagination.appendChild(createPaginationDots());
    }
    pagination.appendChild(createPaginationButton(totalPages, totalPages.toString()));
  }
}

function createPaginationButton(page, text) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = page === currentPage ? "active" : "";
  button.onclick = () => {
    currentPage = page;
    displayPlayerList();
    displayPagination();
  };
  return button;
}

function createPaginationDots() {
  const span = document.createElement("span");
  span.className = "pagination-dots";
  span.textContent = "...";
  return span;
}

// Отображение деталей (правая колонка)
function displayPlayerDetails(player) {
  const details = document.getElementById("detailsContainer");

  // Обновляем URL
  const newUrl = new URL(window.location);
  newUrl.searchParams.set("player", player.nickname);
  newUrl.searchParams.set("id", player.id);
  history.pushState(null, null, newUrl.toString());

  // Пути к иконкам
  const rankImagesPath = "images/ranks/";
  const roleImagesPath = "images/roles/";

  // Одна иконка ранга
  const rankImage = player.rank ? `${rankImagesPath}${player.rank}.png` : "";
  // Иконка роли
  const roleImage = player.role ? `${roleImagesPath}${player.role}.png` : "";

  // Поиск YouTube-ссылки
  const youtubeRegex =
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)|https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/;
  const match = player.status?.match(youtubeRegex);
  const cleanStatus = player.status.replace(youtubeRegex, "").trim();

  let youtubeEmbed = "";
  if (match) {
    const youtubeVideoId = match[1] || match[2];
    youtubeEmbed = `
      <div class="youtube-container">
        <iframe
          src="https://www.youtube.com/embed/${youtubeVideoId}"
          title="YouTube video player"
          frameborder="0"
          allowfullscreen></iframe>
      </div>
    `;
  }

  // HTML для правой колонки
  details.innerHTML = `
    <div class="nickname-container">
      <span class="nickname">${player.nickname}</span>
      <div class="ranks">
        ${
          rankImage
            ? `<img src="${rankImage}" alt="${player.rank}" class="rank-icon" title="${player.rank}">`
            : ""
        }
      </div>
    </div>
    <div class="role-container">
      ${
        roleImage
          ? `<img src="${roleImage}" alt="${player.role}" class="role-icon" title="${player.role}">`
          : ""
      }
    </div>
    <p><strong>Situation:</strong> ${player.situation}</p>
    <p><strong>Status:</strong> ${cleanStatus}</p>
    ${youtubeEmbed}
  `;
}

// Поиск по никнейму
function searchPlayer() {
  const query = document.getElementById("search").value.toLowerCase();
  const list = document.getElementById("playerList");
  const pagination = document.getElementById("pagination");

  if (query.length > 0) {
    pagination.style.display = "none";
    const filteredPlayers = players.filter((p) =>
      p.nickname.toLowerCase().includes(query)
    );
    list.innerHTML = "";

    filteredPlayers.forEach((player) => {
      const li = document.createElement("li");
      li.textContent = player.nickname;
      li.onclick = () => displayPlayerDetails(player);
      list.appendChild(li);
    });

    if (filteredPlayers.length === 0) {
      list.innerHTML = `<li style="text-align:center;">No players found</li>`;
    }
  } else {
    pagination.style.display = "flex";
    displayPlayerList();
    displayPagination();
  }
}

// Проверка URL-параметров
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const nickname = params.get("player");
  const id = params.get("id");
  if (nickname && id) {
    const player = players.find(
      (p) => p.nickname === nickname && p.id === parseInt(id)
    );
    if (player) {
      displayPlayerDetails(player);
    }
  }
}

// Инициализация при загрузке
window.onload = () => {
  fetchPlayers();
};
