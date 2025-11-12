// --- Sign In / Register Modal Logic ---
document.addEventListener("DOMContentLoaded", function () {
  // Открытие модалок
  const signInBtn = document.getElementById("sign-in-btn");
  const signInOverlay = document.getElementById("SignInModalOverlay");
  const registerOverlay = document.getElementById("RegisterModalOverlay");
  const openRegisterLink = document.getElementById("open-register-link");
  const openSignInLink = document.getElementById("open-signin-link");
  function openSignInModal() {
    if (signInOverlay) signInOverlay.style.display = "flex";
    if (registerOverlay) registerOverlay.style.display = "none";
    const err = document.getElementById("SignInError");
    if (err) err.style.display = "none";
  }
  function closeSignInModal() {
    if (signInOverlay) signInOverlay.style.display = "none";
  }
  function openRegisterModal() {
    if (registerOverlay) registerOverlay.style.display = "flex";
    if (signInOverlay) signInOverlay.style.display = "none";
    const err = document.getElementById("RegisterError");
    if (err) err.style.display = "none";
  }
  function closeRegisterModal() {
    if (registerOverlay) registerOverlay.style.display = "none";
  }
  window.closeSignInModal = closeSignInModal;
  window.closeRegisterModal = closeRegisterModal;
  if (signInBtn) signInBtn.addEventListener("click", openSignInModal);
  if (openRegisterLink)
    openRegisterLink.addEventListener("click", function (e) {
      e.preventDefault();
      openRegisterModal();
    });
  if (openSignInLink)
    openSignInLink.addEventListener("click", function (e) {
      e.preventDefault();
      openSignInModal();
    });
  // Закрытие по overlay и Escape
  if (signInOverlay) {
    signInOverlay.addEventListener("click", function (e) {
      if (e.target === signInOverlay) closeSignInModal();
    });
    document.addEventListener("keydown", function (e) {
      if (signInOverlay.style.display === "flex" && e.key === "Escape")
        closeSignInModal();
    });
  }
  if (registerOverlay) {
    registerOverlay.addEventListener("click", function (e) {
      if (e.target === registerOverlay) closeRegisterModal();
    });
    document.addEventListener("keydown", function (e) {
      if (registerOverlay.style.display === "flex" && e.key === "Escape")
        closeRegisterModal();
    });
  }
  // --- Обработка входа ---
  const signInForm = document.getElementById("SignInForm");
  if (signInForm) {
    signInForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("SignInEmail").value.trim();
      const password = document.getElementById("SignInPassword").value;
      const err = document.getElementById("SignInError");
      err.style.display = "none";
      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          err.textContent = data.error || "Login failed";
          err.style.display = "block";
          return;
        }
        // Успешный вход
        closeSignInModal();
        quizState.userName = data.userName;
        updateStats();
        alert("Welcome, " + data.userName + "!");
      } catch (e) {
        err.textContent = "Server error";
        err.style.display = "block";
      }
    });
  }
  // --- Обработка регистрации ---
  const registerForm = document.getElementById("RegisterForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("RegisterEmail").value.trim();
      const password = document.getElementById("RegisterPassword").value;
      const password2 = document.getElementById("RegisterPassword2").value;
      const kod = document.getElementById("RegisterKOD").value.trim();
      const userName = document.getElementById("RegisterUserName").value.trim();
      const err = document.getElementById("RegisterError");
      err.style.display = "none";
      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, password2, kod, userName }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          err.textContent = data.error || "Registration failed";
          err.style.display = "block";
          return;
        }
        // Успешная регистрация
        closeRegisterModal();
        setTimeout(openSignInModal, 100); // Сразу открыть окно входа
      } catch (e) {
        err.textContent = "Server error";
        err.style.display = "block";
      }
    });
  }
});
// --- Scores Modal Logic ---
function openScoresModal() {
  const overlay = document.getElementById("ScoresModalOverlay");
  if (overlay) overlay.style.display = "flex";
  loadScoresTable();
}

function closeScoresModal() {
  const overlay = document.getElementById("ScoresModalOverlay");
  if (overlay) overlay.style.display = "none";
}

async function loadScoresTable() {
  const tbody = document.querySelector("#scores-table tbody");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="4" style="text-align:center;color:#888;">Загрузка...</td></tr>';
  try {
    const res = await fetch("http://localhost:3000/top-participants-full");
    if (!res.ok) throw new Error("Ошибка загрузки");
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#888;">Нет данных</td></tr>';
      return;
    }
    tbody.innerHTML = data
      .map(
        (row) =>
          `<tr>
        <td style='padding:6px 8px;'>${row.name}</td>
        <td style='padding:6px 8px;'>${row.score}</td>
        <td style='padding:6px 8px;'>${row.time}</td>
        <td style='padding:6px 8px;'>${row.category_name || ""}</td>
      </tr>`
      )
      .join("");
  } catch {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:#c00;">Ошибка загрузки</td></tr>';
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const scoresBtn = document.getElementById("show-scores-btn");
  if (scoresBtn) {
    scoresBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openScoresModal();
    });
  }
  // Закрытие по клику вне окна
  const scoresOverlay = document.getElementById("ScoresModalOverlay");
  if (scoresOverlay) {
    scoresOverlay.addEventListener("click", function (e) {
      if (e.target === scoresOverlay) closeScoresModal();
    });
    document.addEventListener("keydown", function (e) {
      if (scoresOverlay.style.display === "flex" && e.key === "Escape")
        closeScoresModal();
    });
  }
});
// --- Name Modal Logic ---
function showNameModal() {
  const overlay = document.getElementById("NameModalOverlay");
  const modal = document.getElementById("NameModal");
  const nameInput = document.getElementById("EndUserName");
  const errorDiv = document.getElementById("EndUserNameError");
  if (overlay && modal) {
    overlay.style.display = "flex";
    modal.style.display = "block";
    if (nameInput) nameInput.value = quizState.userName || "";
    if (errorDiv) errorDiv.style.display = "none";
    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 100);
  }
}

function hideNameModal() {
  const overlay = document.getElementById("NameModalOverlay");
  const modal = document.getElementById("NameModal");
  if (overlay && modal) {
    overlay.style.display = "none";
    modal.style.display = "none";
  }
}

async function checkParticipantName(name) {
  if (!name) return false;
  try {
    const res = await fetch(
      `http://localhost:3000/check-participant?name=${encodeURIComponent(name)}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.exists;
  } catch {
    return false;
  }
}

async function sendResultAndUpdateTop(result) {
  try {
    // Добавляем category_id из состояния
    const categoryId = quizState.category_id || null;
    const resultWithCategory = { ...result, category_id: categoryId };
    await fetch("http://localhost:3000/add-participant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultWithCategory),
    });
  } catch {}
  // Просто обновляем имя и вызываем updateStats, чтобы имя появилось в stats
  quizState.userName = result.name || quizState.userName || "";
  updateStats();
}

// --- Name Modal Event Handlers ---
document.addEventListener("DOMContentLoaded", function () {
  const nameForm = document.getElementById("NameForm");
  const nameInput = document.getElementById("EndUserName");
  const errorDiv = document.getElementById("EndUserNameError");
  const overlay = document.getElementById("NameModalOverlay");
  const changeNameBtn = document.getElementById("ChangeNameBtn");
  // Флаг: пользователь подтвердил дубликат имени
  let allowDuplicateName = false;
  if (nameForm) {
    nameForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (name.length > 32) {
        errorDiv.textContent = "The name is too long (max 32 characters)";
        errorDiv.style.display = "block";
        return;
      }
      if (name.length === 0) {
        // Разрешить пропуск (аноним)
        hideNameModal();
        const seconds = quizState.startTime
          ? Math.floor((Date.now() - quizState.startTime) / 1000)
          : 0;
        await sendResultAndUpdateTop({
          name: "",
          score: quizState.score,
          time: seconds,
        });
        allowDuplicateName = false;
        return;
      }
      // Проверка на дубликат
      if (!allowDuplicateName) {
        const exists = await checkParticipantName(name);
        if (exists) {
          errorDiv.textContent =
            "This name already exists. Please enter a different one or click again to confirm.";
          errorDiv.style.display = "block";
          allowDuplicateName = true;
          return;
        }
      }
      // Если дошли сюда — либо имя уникально, либо пользователь подтвердил дубликат
      errorDiv.style.display = "none";
      hideNameModal();
      quizState.userName = name;
      const seconds = quizState.startTime
        ? Math.floor((Date.now() - quizState.startTime) / 1000)
        : 0;
      await sendResultAndUpdateTop({
        name,
        score: quizState.score,
        time: seconds,
      });
      allowDuplicateName = false;
    });
  }
  if (changeNameBtn) {
    changeNameBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (nameInput) nameInput.value = "";
      if (errorDiv) errorDiv.style.display = "none";
      if (nameInput) nameInput.focus();
    });
  }
  // Allow closing modal with Escape key or clicking overlay
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        hideNameModal();
        // Save as anonymous
        const seconds = quizState.startTime
          ? Math.floor((Date.now() - quizState.startTime) / 1000)
          : 0;
        sendResultAndUpdateTop({
          name: "",
          score: quizState.score,
          time: seconds,
        });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (overlay.style.display === "flex" && e.key === "Escape") {
        hideNameModal();
        // Save as anonymous
        const seconds = quizState.startTime
          ? Math.floor((Date.now() - quizState.startTime) / 1000)
          : 0;
        sendResultAndUpdateTop({
          name: "",
          score: quizState.score,
          time: seconds,
        });
      }
    });
  }
});
// Заглушка для функции обновления статистики
function updateStats() {
  // Приветствие справа в header
  const greeting = document.getElementById("greeting-block");
  if (greeting) {
    if (quizState.userName && quizState.userName.trim().length > 0) {
      greeting.textContent = `Hello, ${quizState.userName}!`;
    } else {
      greeting.textContent = "";
    }
  }
  // Статистика только если идет игра
  const stats = document.getElementById("quiz-stats");
  if (!stats) return;
  if (
    quizState.startTime &&
    quizState.questions &&
    quizState.questions.length > 0 &&
    quizState.current < quizState.questions.length
  ) {
    stats.style.display = "block";
    const seconds = Math.floor((Date.now() - quizState.startTime) / 1000);
    let nameBlock = "";
    if (quizState.userName && quizState.userName.trim().length > 0) {
      nameBlock = `<b>Name:</b> ${quizState.userName} &nbsp; `;
    }
    stats.innerHTML = `${nameBlock}<b>Score:</b> ${quizState.score} &nbsp; <b>Time:</b> ${seconds} сек.`;
  } else {
    stats.style.display = "none";
    stats.innerHTML = "";
  }
}
// --- ОТОБРАЖЕНИЕ ВОПРОСОВ С ПЕРЕХОДОМ ---
// --- Kysymysten näyttäminen ja siirtyminen ---
// Состояние викторины (текущее состояние игры)
// Pelin tila (nykyinen pelitila)
let quizState = {
  questions: [], // Список вопросов / Kysymyslista
  current: 0, // Индекс текущего вопроса / Nykyisen kysymyksen indeksi
  userName: "", // Имя пользователя / Käyttäjän nimi
  score: 0, // Количество очков / Pisteet
  startTime: 0, // Время начала викторины (ms) / Pelin aloitusaika (ms)
  timerInterval: null, // Интервал таймера / Ajastimen intervalli
};

// Запуск викторины: перемешивает вопросы и ответы, сбрасывает счетчики
// Pelin aloitus: sekoittaa kysymykset ja vastaukset, nollaa laskurit
function showQuiz(questions) {
  // Перемешиваем вопросы / Sekoitetaan kysymykset
  const shuffledQuestions = [...questions];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [
      shuffledQuestions[j],
      shuffledQuestions[i],
    ];
  }

  // Перемешиваем ответы для каждого вопроса / Sekoitetaan vastaukset joka kysymykselle
  quizState.questions = shuffledQuestions.map((q) => {
    const indices = q.answers.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const shuffledAnswers = indices.map((i) => q.answers[i]);
    const correct = indices.findIndex((i) => i === q.correct);
    return {
      ...q,
      answers: shuffledAnswers,
      correct,
    };
  });
  quizState.current = 0; // Сброс текущего вопроса / Nollaa nykyinen kysymys
  quizState.score = 0; // Сброс очков / Nollaa pisteet
  quizState.startTime = Date.now(); // Запоминаем время старта / Tallennetaan aloitusaika
  // Сохраняем выбранную категорию
  const catSelect = document.getElementById("Categories");
  if (catSelect) {
    quizState.category_id = parseInt(catSelect.value, 10) || null;
  } else {
    quizState.category_id = null;
  }
  updateStats();
  if (quizState.timerInterval) clearInterval(quizState.timerInterval); // Очищаем старый таймер / Tyhjennetään vanha ajastin
  quizState.timerInterval = setInterval(updateStats, 1000); // Запускаем обновление статистики каждую секунду / Päivitetään tilastot sekunnin välein
  renderCurrentQuestion(); // Показываем первый вопрос / Näytetään ensimmäinen kysymys
}

// Отображает текущий вопрос и варианты ответов, а также топ-20 участников
// Näyttää nykyisen kysymyksen ja vastausvaihtoehdot sekä top-20 osallistujaa
function renderCurrentQuestion() {
  let quiz = document.getElementById("quiz-container");
  let gifOverlay = document.getElementById("quiz-gif-overlay");
  if (!quiz) {
    console.error("Элемент #quiz-container не найден!");
    return;
  }
  // ...existing code...
  quiz.innerHTML = "";
  gifOverlay.innerHTML = "";
  quiz.style.display = "block";
  updateStats();
  // ...existing code...

  // Проверка наличия вопросов
  if (!quizState.questions || !quizState.questions.length) {
    quiz.innerHTML = "<p>No questions for the selected parameters.</p>";
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    return;
  }
  // Проверка завершения викторины
  if (quizState.current >= quizState.questions.length) {
    quiz.innerHTML =
      '<div id="quiz-completed-message" style="font-size: 2.5rem; color: #f8f6d0; text-align: center; margin: 60px 0; font-weight: bold;">Quiz completed!</div>';
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    setTimeout(() => {
      quiz.innerHTML = "";
      showNameModal();
    }, 1000);
    return;
  }

  // ...existing code...

  // Отобразить текущий вопрос и варианты ответов
  const q = quizState.questions[quizState.current];
  if (q) {
    const questionHtml = `<h3>${q.question}</h3>`;
    const answersHtml = q.answers
      .map(
        (answer, idx) =>
          `<button class="quiz-answer" data-idx="${idx}">${answer}</button>`
      )
      .join("<br>");
    quiz.innerHTML = questionHtml + answersHtml;
    quiz.style.display = "block";

    // Добавить обработчик для кнопок-ответов
    quiz.querySelectorAll(".quiz-answer").forEach((btn) => {
      btn.addEventListener("click", function () {
        const isCorrect = parseInt(btn.dataset.idx, 10) === q.correct;
        const gifOverlay = document.getElementById("quiz-gif-overlay");
        if (isCorrect) {
          quizState.score++;
          gifOverlay.innerHTML =
            '<img src="congratulations.gif" alt="Correct!" style="width:220px;display:block;margin:0 auto;">';
        } else {
          gifOverlay.innerHTML =
            '<img src="skeleton.gif" alt="Incorrect!" style="width:220px;display:block;margin:0 auto;">';
        }
        // Отключить все кнопки, чтобы нельзя было кликнуть повторно
        quiz
          .querySelectorAll(".quiz-answer")
          .forEach((b) => (b.disabled = true));
        setTimeout(() => {
          gifOverlay.innerHTML = "";
          quizState.current++;
          renderCurrentQuestion();
        }, 900);
      });
    });
  }
  // удалено повторное объявление quiz и gifOverlay
  // (Блок, который затирал содержимое quiz.innerHTML, удалён)

  // (Внутренняя sendResultAndUpdateTop удалена, используется только глобальная)
}

function openGameModal() {
  // Просто обновляем имя и вызываем updateStats, чтобы имя появилось в stats
  quizState.userName = result.name || quizState.userName || "";
  updateStats();
}

// Скрывает модальное окно
function closeGameModal() {
  document.getElementById("GameModalOverlay").style.display = "none";
}

// Добавляем обработчик на кнопку "Start Quiz"
document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("start-quiz-btn");
  if (startBtn) {
    startBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openGameModal();
    });
  }

  // Добавить обработчик отправки формы выбора
  const form = document.getElementById("Choice-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      // alert удалён, добавлен вывод полученных вопросов ниже
      document.getElementById("GameModalOverlay").style.display = "none";
      // Получаем параметры из формы
      const category = document.getElementById("Categories").value;
      const difficulty = form.querySelector(
        'input[name="UserDifficulty"]:checked'
      )?.value;
      // Запрос к серверу
      let questions = [];
      try {
        const res = await fetch(
          `http://localhost:3000/quiz?category=${category}&difficulty=${difficulty}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!Array.isArray(data) || !data.length) {
            alert("No questions for the selected parameters!");
            console.error("Server returned an empty array of questions:", data);
            return;
          }
          // Преобразуем ответы для showQuiz
          questions = data.map((q) => {
            const answers = q.answers.map((a) => a.answer);
            const correct = q.answers.findIndex((a) => a.correct);
            return {
              question: q.question,
              answers,
              correct,
            };
          });
        } else {
          alert("Error fetching questions from server!");
          console.error("Fetch error /quiz:", res.status, await res.text());
          return;
        }
      } catch (e) {
        alert("Error!");
        console.error("Request to server failed:", e);
        return;
      }
      // Сбросить имя, счетчик и таймер
      quizState.userName = "";
      quizState.score = 0;
      quizState.startTime = Date.now();
      showQuiz(questions);
    });
  }
});

// Заполняет выпадающий список категориями из API
async function categoriesSelect() {
  const select = document.getElementById("Categories");
  if (!select) return;
  try {
    const res = await fetch("http://localhost:3000/categories");
    if (!res.ok) return;
    const categories = await res.json();
    // Удалить старые опции, кроме первой
    while (select.options.length > 1) select.remove(1);
    categories.forEach((st) => {
      const opt = document.createElement("option");
      opt.value = st.category_id;
      opt.textContent = st.name;
      select.appendChild(opt);
    });
  } catch (e) {
    // можно добавить обработку ошибки
  }
}

// Вызывать categoriesSelect при открытии модального окна
function openGameModal() {
  document.getElementById("GameModalOverlay").style.display = "flex";
  categoriesSelect();
}
