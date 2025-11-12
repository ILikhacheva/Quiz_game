// Заглушка для функции обновления статистики
function updateStats() {
  // Обновление статистики: очки и время
  const stats = document.getElementById("quiz-stats");
  if (!stats) return;
  const seconds = quizState.startTime
    ? Math.floor((Date.now() - quizState.startTime) / 1000)
    : 0;
  stats.innerHTML = `<b>Score:</b> ${quizState.score} &nbsp; <b>Time:</b> ${seconds} сек.`;
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
    quiz.innerHTML = "<p>Quiz completed!</p>";
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    // Здесь можно вызвать отправку результата, если нужно
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

  // Отправить результат и обновить топ-20 / Lähetä tulos ja päivitä top-20
  async function sendResultAndUpdateTop(result) {
    try {
      await fetch("http://localhost:3000/add-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
    } catch {}
    fetchTopParticipants();
  }

  // Получить и отобразить топ-20 участников / Hae ja näytä top-20 osallistujaa
  async function fetchTopParticipants() {
    try {
      const res = await fetch("http://localhost:3000/top-participants");
      if (!res.ok) return;
      const data = await res.json();
      // Здесь можно обновить топ-20 участников, если нужно
    } catch (e) {
      // обработка ошибок при получении топ-20 участников
    }
  }
}

function openGameModal() {
  document.getElementById("GameModalOverlay").style.display = "flex";
}

// Скрывает модальное окно
function closeGameModal() {
  document.getElementById("GameModalOverlay").style.display = "none";
}

// Добавляем обработчик на кнопку "Start Quiz"
document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.querySelector(".header button");
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

// Заполнять select при открытии модального окна
const paikkaBtn = document.querySelector('button[onclick*="openGameModal"]');
if (paikkaBtn) {
  paikkaBtn.addEventListener("click", categoriesSelect);
}
