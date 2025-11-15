// ---
// НАСТРОЙКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ
// DATABASE CONNECTION SETUP
// ---
// Загружаем переменные окружения из .env файла
// Load environment variables from .env file

// Загрузка переменных окружения из .env
// Loading environment variables from .env
require("dotenv").config();

// Импортируем необходимые модули
// Import required modules
const express = require("express");
const bcrypt = require("bcrypt"); // Для хеширования паролей / For password hashing
const cors = require("cors"); // Для кросс-доменных запросов / For cross-origin requests
const { Pool } = require("pg"); // PostgreSQL клиент / PostgreSQL client
const app = express(); // Экземпляр приложения Express / Express app instance

// Настраиваем CORS для разрешения кросс-доменных запросов
// Configure CORS to allow cross-origin requests
app.use(
  cors({
    origin: "*", // Разрешаем запросы с любого домена / Allow requests from any domain
  })
);

// Подключаем обслуживание статических файлов из текущей директории
// Serve static files from current directory
app.use(express.static(__dirname));

// Подключаем middleware для парсинга JSON в запросах
// Attach middleware for parsing JSON in requests
app.use(express.json());

// Создаем пул подключений к PostgreSQL базе данных
// Create a connection pool to PostgreSQL database
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "peli",
  user: process.env.DB_USER || "peli_sivu",
  password: process.env.DB_PASSWORD || "12345",
});

// Запускаем сервер на порту 3000
// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Получить список категорий
// Get list of categories
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

// Проверить, есть ли участник с таким именем
// Check if a participant with this name exists

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

// Получить вопросы по категории и сложности
// Get questions by category and difficulty
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
    // Группируем ответы по вопросам / Group answers by question
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

// Добавить участника и результат, если входит в топ-20
// Add participant and result if in top-20
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
    // Insert new participant with category
    await pool.query(
      "INSERT INTO participants (name, score, time, category_id) VALUES ($1, $2, $3, $4)",
      [name, score, time, category_id]
    );

    // Оставляем только топ-20
    // Keep only top-20
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

// Получить топ-20 участников
// Get top-20 participants
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

// Получить топ-20 участников с категориями
// Get top-20 participants with categories
app.get("/top-participants-full", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.name, p.score, p."time", c.name as category_name
      FROM public.participants p
      LEFT JOIN categories c ON c.category_id = p.category_id
      ORDER BY p.score DESC, p."time" ASC
      LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB ERROR /top-participants-full:", err);
    res.status(500).json([]);
  }
});

// Вход пользователя (POST /login)
// User login (POST /login)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }
    // Найти пользователя по email
    // Find user by email
    const userResult = await pool.query(
      "SELECT user_id, user_name, user_password FROM users WHERE user_email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const user = userResult.rows[0];
    // Проверить пароль
    // Check password
    const match = await bcrypt.compare(password, user.user_password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    // Можно добавить генерацию токена, но пока просто успех
    // You can add token generation, but for now just success
    res.json({ success: true, userName: user.user_name });
  } catch (err) {
    console.error("DB ERROR /login:", err);
    res.status(500).json({ error: "Server error." });
  }
});
// Регистрация пользователя (POST /register)
// User registration (POST /register)
app.post("/register", async (req, res) => {
  try {
    const { email, password, password2, kod, userName } = req.body;
    if (!email || !password || !password2 || !kod || !userName) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password !== password2) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    if (kod !== process.env.KOD) {
      return res.status(400).json({ error: "Invalid code word." });
    }
    // Проверка, что email не занят
    // Check that email is not taken
    const userCheck = await pool.query(
      "SELECT user_id FROM users WHERE user_email = $1",
      [email]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }
    // Хешируем пароль
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Сохраняем пользователя
    // Save the user
    await pool.query(
      `INSERT INTO users (user_name, user_password, user_email) VALUES ($1, $2, $3)`,
      [userName, hashedPassword, email]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB ERROR /register:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// Добавить вопрос с категорией и ответами
// Add question with category and answers (POST /add-question-full)
app.post("/add-question-full", async (req, res) => {
  const { category, newCategory, question, difficulty, answers } = req.body;
  // answers: [{text: '...', correct: true/false}, ...]
  if (
    !question ||
    !Array.isArray(answers) ||
    answers.length < 2 ||
    !difficulty
  ) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let categoryId;
    if (category === "__new__") {
      if (!newCategory || !newCategory.trim())
        throw new Error("No new category");
      // Проверяем, есть ли уже такая категория
      // Check if such category already exists
      const catRes = await client.query(
        "SELECT category_id FROM categories WHERE LOWER(name) = LOWER($1)",
        [newCategory.trim()]
      );
      if (catRes.rows.length > 0) {
        categoryId = catRes.rows[0].category_id;
      } else {
        const insCat = await client.query(
          "INSERT INTO categories (name) VALUES ($1) RETURNING category_id",
          [newCategory.trim()]
        );
        categoryId = insCat.rows[0].category_id;
      }
    } else {
      // Найти id выбранной категории
      // Find id of selected category
      const catRes = await client.query(
        "SELECT category_id FROM categories WHERE name = $1",
        [category]
      );
      if (catRes.rows.length === 0) throw new Error("Category not found");
      categoryId = catRes.rows[0].category_id;
    }
    // Вставляем вопрос с учетом сложности
    // Insert question with difficulty
    const insQ = await client.query(
      "INSERT INTO questions (question, category_id, difficulty) VALUES ($1, $2, $3) RETURNING row_id",
      [question, categoryId, difficulty]
    );
    const questionId = insQ.rows[0].row_id;
    // Вставляем ответы
    // Insert answers
    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      await client.query(
        "INSERT INTO answers (question_id, answer, correct) VALUES ($1, $2, $3)",
        [questionId, ans.text, !!ans.correct]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true, categoryId, questionId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB ERROR /add-question-full:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});
