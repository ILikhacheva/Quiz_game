// ---
// НАСТРОЙКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ
// TIETOKANTAYHTEYDEN KONFIGURAATIO
// ---
// Загружаем переменные окружения из .env файла
// Ladataan ympäristömuuttujat .env tiedostosta

// Загрузка переменных окружения из .env / Ympäristömuuttujien lataus .env-tiedostosta
require("dotenv").config();

// Импортируем необходимые модули / Tuodaan tarvittavat moduulit
const express = require("express");
const bcrypt = require("bcrypt"); // Для хеширования паролей / Salasanojen tiivistykseen
const cors = require("cors"); // Для кросс-доменных запросов / Cross-origin pyyntöjä varten
const { Pool } = require("pg"); // PostgreSQL клиент / PostgreSQL asiakasohjelma
const app = express(); // Экземпляр приложения Express / Express-sovelluksen instanssi

// Настраиваем CORS для разрешения кросс-доменных запросов
// Konfiguroidaan CORS sallimaan cross-origin pyynnöt
app.use(
  cors({
    origin: "*", // Разрешаем запросы с любого домена / Sallitaan pyynnöt mistä tahansa domainista
  })
);

// Подключаем обслуживание статических файлов из текущей директории
// Kytketään staattisten tiedostojen tarjoilu nykyisestä hakemistosta
app.use(express.static(__dirname));

// Подключаем middleware для парсинга JSON в запросах
// Kytketään middleware JSON:n jäsentämiseen pyynnöissä
app.use(express.json());

// Создаем пул подключений к PostgreSQL базе данных
// Luodaan PostgreSQL tietokantayhteyksien pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost", // Хост БД / Tietokannan isäntä
  port: process.env.DB_PORT || 5432, // Порт БД / Tietokannan portti
  database: process.env.DB_NAME || "peli", // Имя БД / Tietokannan nimi
  user: process.env.DB_USER || "peli_sivu",
  password: process.env.DB_PASSWORD || "12345",
});

// Запускаем сервер на порту 3000
// Käynnistetään palvelin portissa 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Получить список категорий (GET /categories)
// Hae kategoriat (GET /categories)
app.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT category_id, name FROM categories ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB ERROR /categories:", err);
    res.status(500).send("Database error");
  }
});

// Проверить, есть ли участник с таким именем (GET /check-participant)
// Tarkista, onko osallistujaa tällä nimellä (GET /check-participant)
app.get("/check-participant", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ exists: false });
  try {
    const result = await pool.query(
      "SELECT 1 FROM participants WHERE LOWER(name) = LOWER($1) LIMIT 1",
      [name]
    );
    res.json({ exists: result.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ exists: false });
  }
});

// Получить вопросы по категории и сложности (GET /quiz)
// Hae kysymykset kategorian ja vaikeustason mukaan (GET /quiz)
app.get("/quiz", async (req, res) => {
  const { category, difficulty } = req.query;
  try {
    const result = await pool.query(
      `SELECT c.category_id, c.name, q.row_id as question_id, q.question, q.difficulty, a.answer_id, a.answer, a.correct
      FROM public.categories c, public.questions q, public.answers a
      WHERE c.category_id = q.category_id
        AND a.question_id = q.row_id
        AND ($1::int IS NULL OR c.category_id = $1::int)
        AND ($2::int IS NULL OR q.difficulty = $2::int)
  ORDER BY q.row_id, a.answer_id`,
      [category || null, difficulty || null]
    );
    // Группируем ответы по вопросам / Ryhmitellään vastaukset kysymyksittäin
    const questionsMap = {};
    result.rows.forEach((row) => {
      if (!questionsMap[row.question_id]) {
        questionsMap[row.question_id] = {
          question_id: row.question_id,
          question: row.question,
          difficulty: row.difficulty,
          category_id: row.category_id,
          category: row.name,
          answers: [],
        };
      }
      questionsMap[row.question_id].answers.push({
        answer_id: row.answer_id,
        answer: row.answer,
        correct: row.correct,
      });
    });
    res.json(Object.values(questionsMap));
  } catch (err) {
    console.error("DB ERROR /quiz:", err);
    res.status(500).send("Database error");
  }
});

// Добавить участника и результат, если входит в топ-20 (POST /add-participant)
// Lisää osallistuja ja tulos, jos pääsee top-20:een (POST /add-participant)
app.post("/add-participant", async (req, res) => {
  const { name, score, time, category_id } = req.body;
  if (
    !name ||
    typeof score !== "number" ||
    typeof time !== "number" ||
    !category_id
  ) {
    return res.status(400).json({ error: "Invalid data" });
  }
  try {
    // Вставляем нового участника с категорией
    await pool.query(
      "INSERT INTO participants (name, score, time, category_id) VALUES ($1, $2, $3, $4)",
      [name, score, time, category_id]
    );

    // Оставляем только топ-20 (по очкам, потом по времени)
    await pool.query(
      `DELETE FROM participants WHERE row_id NOT IN (
        SELECT row_id FROM participants
        ORDER BY score DESC, time ASC
        LIMIT 20
      )`
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DB ERROR /add-participant:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Получить топ-20 участников (GET /top-participants)
// Hae top-20 osallistujaa (GET /top-participants)
app.get("/top-participants", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT name, score, time FROM participants ORDER BY score DESC, time ASC LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB ERROR /top-participants:", err);
    res.status(500).json([]);
  }
});
