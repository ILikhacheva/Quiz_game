// --- Sign In / Register Modal Logic ---
// --- Логика модальных окон входа/регистрации ---
document.addEventListener("DOMContentLoaded", function () {
  // --- Обработка отправки формы добавления вопроса ---
  // --- Add question form submit logic ---
  const addForm = document.getElementById("AddForm");
  if (addForm) {
    addForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const category = addCategorySelect.value;
      const newCategory = addCategoryNew.value.trim();
      const question = document.getElementById("AddQuestion").value.trim();
      const answer1 = document.getElementById("AddAnswer1").value.trim();
      const answer2 = document.getElementById("AddAnswer2").value.trim();
      const answer3 = document.getElementById("AddAnswer3").value.trim();
      const answer4 = document.getElementById("AddAnswer4").value.trim();
      const errorDiv = document.getElementById("AddError");
      errorDiv.style.display = "none";
      // Новое: сложность
      // New: difficulty
      const difficulty =
        (addForm.querySelector('input[name="AddDifficulty"]:checked') || {})
          .value || "1";
      // Проверка
      // Validation
      if (!question || !answer1 || !answer2 || !answer3 || !answer4) {
        errorDiv.textContent = "Fill in all fields";
        errorDiv.style.display = "block";
        return;
      }
      if (category === "") {
        errorDiv.textContent = "Select a category or add new";
        errorDiv.style.display = "block";
        return;
      }
      if (category === "__new__" && !newCategory) {
        errorDiv.textContent = "Enter new category name";
        errorDiv.style.display = "block";
        return;
      }
      // Формируем массив ответов, первый всегда correct
      // Form answer array, first is always correct
      const answers = [
        { text: answer1, correct: true },
        { text: answer2, correct: false },
        { text: answer3, correct: false },
        { text: answer4, correct: false },
      ];
      try {
        const res = await fetch("/add-question-full", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            newCategory,
            question,
            difficulty,
            answers,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          errorDiv.textContent = data.error || "Error saving question";
          errorDiv.style.display = "block";
          return;
        }
        // Успех
        // Success
        errorDiv.style.display = "none";
        addForm.reset();
        addCategoryNew.style.display = "none";
        alert("Question added!");
        closeAddModal();
      } catch (e) {
        errorDiv.textContent = "Server error";
        errorDiv.style.display = "block";
      }
    });
  }
  // --- Категории для формы добавления вопроса ---
  // --- Categories for add question form ---
  const addCategorySelect = document.getElementById("AddCategorySelect");
  const addCategoryNew = document.getElementById("AddCategoryNew");

  // Загрузить категории с сервера
  // Load categories from server
  async function loadCategoriesForAddForm() {
    if (!addCategorySelect) return;
    try {
      const res = await fetch("/categories");
      const categories = await res.json();
      // Удалить все кроме первых двух опций
      // Remove all except the first two options
      while (addCategorySelect.options.length > 2) {
        addCategorySelect.remove(1); // всегда оставляем 'Select...' и 'Add new...'
      }
      categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = cat.name;
        addCategorySelect.insertBefore(
          opt,
          addCategorySelect.options[addCategorySelect.options.length - 1]
        );
      });
    } catch (e) {
      // Ошибка загрузки категорий
      // Error loading categories
    }
  }

  if (addCategorySelect) {
    addCategorySelect.addEventListener("change", function () {
      if (addCategorySelect.value === "__new__") {
        addCategoryNew.style.display = "block";
        addCategoryNew.required = true;
      } else {
        addCategoryNew.style.display = "none";
        addCategoryNew.required = false;
      }
    });
    // Загружаем категории при открытии модалки
    // Load categories when modal opens
    const addQuestionsBtn = document.getElementById("add-questions-btn");
    if (addQuestionsBtn) {
      addQuestionsBtn.addEventListener("click", loadCategoriesForAddForm);
    }
  }
  // Кнопка и модалка для добавления вопросов
  // Button and modal for adding questions
  const addQuestionsBtn = document.getElementById("add-questions-btn");
  const addQuestionsOverlay = document.getElementById("AddQuestionsOverlay");
  function openAddModal() {
    if (addQuestionsOverlay) addQuestionsOverlay.style.display = "flex";
  }
  function closeAddModal() {
    if (addQuestionsOverlay) addQuestionsOverlay.style.display = "none";
  }
  window.closeAddModal = closeAddModal;
  if (addQuestionsBtn) {
    addQuestionsBtn.addEventListener("click", function () {
      openAddModal();
    });
  }
  // Открытие модалок
  // Opening modals
  const signInBtn = document.getElementById("sign-in-btn");
  function updateAddQuestionsButton() {
    // Update add questions button visibility
    if (!addQuestionsBtn) return;
    if (quizState.userName && quizState.userName.trim().length > 0) {
      addQuestionsBtn.style.display = "inline-block";
    } else {
      addQuestionsBtn.style.display = "none";
    }
  }

  // Функция обновления текста кнопки входа
  // Update sign-in button text
  function updateSignInButton() {
    if (!signInBtn) return;
    if (quizState.userName && quizState.userName.trim().length > 0) {
      signInBtn.textContent = "Sign out";
    } else {
      signInBtn.textContent = "Sign in";
    }
    updateAddQuestionsButton();
  }

  // Обработка клика по кнопке входа/выхода
  // Handle sign-in/sign-out button click
  if (signInBtn) {
    signInBtn.addEventListener("click", function () {
      if (quizState.userName && quizState.userName.trim().length > 0) {
        // Выход
        // Logout
        quizState.userName = "";
        updateStats();
        updateSignInButton();
        updateAddQuestionsButton();
      } else {
        openSignInModal();
      }
    });
  }
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
  // updateSignInButton вызывается при загрузке
  // updateSignInButton is called on load
  updateSignInButton();
  updateAddQuestionsButton();
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
  // Close on overlay and Escape
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
  // --- Sign-in logic ---
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
        // Successful login
        closeSignInModal();
        quizState.userName = data.userName;
        updateStats();
        updateSignInButton();
        alert("Welcome, " + data.userName + "!");
        updateAddQuestionsButton();
      } catch (e) {
        err.textContent = "Server error";
        err.style.display = "block";
      }
    });
  }
  // --- Обработка регистрации ---
  // --- Registration logic ---
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
        // Successful registration
        closeRegisterModal();
        setTimeout(openSignInModal, 100); // Сразу открыть окно входа
        // Immediately open sign-in modal
      } catch (e) {
        err.textContent = "Server error";
        err.style.display = "block";
      }
    });
  }
});
// --- Scores Modal Logic ---
// --- Логика модального окна результатов ---
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
  // Loading...
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
  } catch (e) {
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
  // Close on click outside window
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
    // Add category_id from state
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
  // Flag: user confirmed duplicate name
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
        // Allow skip (anonymous)
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
      // Check for duplicate
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
      // If we got here, either the name is unique or the user confirmed the duplicate
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
// Stats update stub function
function updateStats() {
  // Приветствие справа в header
  // Greeting on the right in the header
  const greeting = document.getElementById("greeting-block");
  if (greeting) {
    if (quizState.userName && quizState.userName.trim().length > 0) {
      greeting.textContent = `Hello, ${quizState.userName}!`;
    } else {
      greeting.textContent = "";
    }
  }
  // Статистика только если идет игра
  // Stats only if the game is in progress
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
// Quiz state (current game state)
let quizState = {
  questions: [], // List of questions
  current: 0, // Index of the current question
  userName: "", // User name
  score: 0, // Score
  startTime: 0, // Quiz start time (ms)
  timerInterval: null, // Timer interval
};

// Запуск викторины: перемешивает вопросы и ответы, сбрасывает счетчики
// Quiz start: shuffles questions and answers, resets counters
function showQuiz(questions) {
  // Перемешиваем вопросы / Shuffle questions
  const shuffledQuestions = [...questions];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [
      shuffledQuestions[j],
      shuffledQuestions[i],
    ];
  }

  // Перемешиваем ответы для каждого вопроса / Shuffle answers for each question
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
  quizState.current = 0; // Reset current question
  quizState.score = 0; // Reset score
  quizState.startTime = Date.now(); // Record start time
  // Save selected category
  const catSelect = document.getElementById("Categories");
  if (catSelect) {
    quizState.category_id = parseInt(catSelect.value, 10) || null;
  } else {
    quizState.category_id = null;
  }
  updateStats();
  if (quizState.timerInterval) clearInterval(quizState.timerInterval); // Очищаем старый таймер / Clear old timer
  quizState.timerInterval = setInterval(updateStats, 1000); // Запускаем обновление статистики каждую секунду / Start updating stats every second
  renderCurrentQuestion(); // Показываем первый вопрос / Show first question
}

// Отображает текущий вопрос и варианты ответов, а также топ-20 участников
// Displays the current question and answer options, as well as the top 20 participants
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
  // Check for questions
  if (!quizState.questions || !quizState.questions.length) {
    quiz.innerHTML = "<p>No questions for the selected parameters.</p>";
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    return;
  }
  // Проверка завершения викторины
  // Check for quiz completion
  if (quizState.current >= quizState.questions.length) {
    quiz.innerHTML =
      '<div id="quiz-completed-message" style="font-size: 2.5rem; color: #f8f6d0; text-align: center; margin: 60px 0; font-weight: bold;">Quiz completed!</div>';
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    setTimeout(() => {
      quiz.innerHTML = "";
      // Показать анимацию после завершения игры
      // Show animation after game completion
      const welcomeGif = document.getElementById("welcomeGif");
      if (welcomeGif) welcomeGif.style.display = "block";
      showNameModal();
    }, 1000);
    return;
  }

  // ...existing code...

  // Отобразить текущий вопрос и варианты ответов
  // Display current question and answers
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
    // Add event handler for answer buttons
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
        // Disable all buttons to prevent multiple clicks
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
}

function openGameModal() {
  // Просто обновляем имя и вызываем updateStats, чтобы имя появилось в stats
  // Just update the name and call updateStats to show the name in stats
  quizState.userName = result.name || quizState.userName || "";
  updateStats();
}

// Скрывает модальное окно
// Hides the modal window
function closeGameModal() {
  document.getElementById("GameModalOverlay").style.display = "none";
  // Показать анимацию при отмене/закрытии окна старта
  // Show animation on cancel/close of start window
  const welcomeGif = document.getElementById("welcomeGif");
  if (welcomeGif) welcomeGif.style.display = "block";
}

// Добавляем обработчик на кнопку "Start Quiz"
// Add event handler to "Start Quiz" button
document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("start-quiz-btn");
  if (startBtn) {
    startBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // Скрыть анимацию при старте
      // Hide animation on start
      const welcomeGif = document.getElementById("welcomeGif");
      if (welcomeGif) welcomeGif.style.display = "none";
      openGameModal();
    });
  }

  // Добавить обработчик отправки формы выбора
  // Add handler for choice form submission
  const form = document.getElementById("Choice-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      // alert удалён, добавлен вывод полученных вопросов ниже
      // alert removed, added display of received questions below
      document.getElementById("GameModalOverlay").style.display = "none";
      // Получаем параметры из формы
      // Get parameters from form
      const category = document.getElementById("Categories").value;
      const difficulty = form.querySelector(
        'input[name="UserDifficulty"]:checked'
      )?.value;
      // Запрос к серверу
      // Request to server
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
          // Transform answers for showQuiz
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
      // Reset name, score, and timer
      quizState.userName = "";
      quizState.score = 0;
      quizState.startTime = Date.now();
      showQuiz(questions);
    });
  }
});

// Заполняет выпадающий список категориями из API
// Fills the dropdown list with categories from the API
async function categoriesSelect() {
  const select = document.getElementById("Categories");
  if (!select) return;
  try {
    const res = await fetch("http://localhost:3000/categories");
    if (!res.ok) return;
    const categories = await res.json();
    // Удалить старые опции, кроме первой
    // Remove old options except the first
    while (select.options.length > 1) select.remove(1);
    categories.forEach((st) => {
      const opt = document.createElement("option");
      opt.value = st.category_id;
      opt.textContent = st.name;
      select.appendChild(opt);
    });
  } catch (e) {
    // можно добавить обработку ошибки
    // error handling can be added
  }
}

// Вызывать categoriesSelect при открытии модального окна
// Call categoriesSelect when opening the modal window
function openGameModal() {
  document.getElementById("GameModalOverlay").style.display = "flex";
  categoriesSelect();
}
