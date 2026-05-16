-- 1.1. Клонування та середовище
git clone <repo_url>
cd Fartukh_nosql_1
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

-- 1.2. Налаштування .env:

У корені проєкту створити файл .env:

MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/

-- 1.3. Порядок запуску
1. Перевірка підключення
py scripts/test_mongo.py
2. Завантаження сирих даних
py scripts/01_load_data.py
3. Трансформація (mongosh)
mongosh "MONGO_URI" --file scripts/02_transform.js
4. Запити
mongosh "MONGO_URI" --file queries/part2_queries.js
5. Аналітика (Part 3)
mongosh "MONGO_URI" --file part3_aggregation.js
6. Індекси (Part 4)
mongosh "MONGO_URI" --file part4_indexes.js
2. Схема даних (final collection: tracks)

Після трансформації кожен документ має структуру:

{
  "track_id": "string",
  "track_name": "string",
  "album_name": "string",
  "artists": ["Artist 1", "Artist 2"],
  "track_genre": "string",
  "explicit": false,
  "popularity": 75,
  "duration_ms": 210000,
  "duration_sec": 210.0,

  "audio_features": {
    "danceability": 0.81,
    "energy": 0.76,
    "loudness": -5.2,
    "speechiness": 0.05,
    "acousticness": 0.1,
    "instrumentalness": 0.0,
    "liveness": 0.12,
    "valence": 0.9,
    "tempo": 128.3,
    "key": 1,
    "mode": 1,
    "time_signature": 4
  },

  "popularity_tier": "high | medium | low"
}

-- 3.1. Завантаження даних
Завантаження CSV
Вхідні дані: ~114000 треків
У MongoDB вставлено: 113999 документів
Колекція: tracks_raw
Використано batch insert (1000 документів)
-- 3.2. Причини перетворень
explicit - boolean
числові поля - int/float
очищення null значень (artists, track_name)
-- 3.3. Чому виникла нова схема
CSV = плоска структура
MongoDB = документи

Було зроблено:
audio_features - вкладений об’єкт
artists - масив
popularity_tier - обчислюване поле
duration_sec - derived field

-- Теоретичні відповіді (Part 1)
1. Чому audio_features вкладений об’єкт?

Переваги:

логічне групування метрик
простіше читати та оновлювати блоком
оптимально для аналітики

Недоліки:

складні індекси
важчі deep queries

2. Чому artists — масив?

Переваги: один трек - багато артистів,
$in, $all, $unwind стають можливими,
прості агрегації
3. $out vs $merge
$out - повністю перезаписує колекцію
$merge - оновлює/додає без втрати даних

Використання:

$out - ETL пайплайни
$merge - incremental updates
-- 4. Частина 2 — Query Results
-- 4.1 Party tracks
danceability > 0.7
energy > 0.7
duration 180000–300000
-- 4.2 Popular artists rule
≥ 3 tracks
min popularity ≥ 60
-- 4.3 Outliers
tempo > mean + 2σ per genre
-- 4.4 Background music
loudness < -10
speechiness < 0.1
instrumentalness > 0.5
explicit = false
-- 5. Частина 3 — Aggregation Analytics
-- 5.1 Top artists
≥ 5 tracks
avg popularity
top 10 result
-- 5.2 Mood classification
happy / sad / angry / calm
based on valence + energy
-- 5.3 Danceability by genre
avg metrics per genre
filter: ≥ 100 tracks
-- 6. Частина 4 — Indexing & Optimization
-- 6.1 Запит 1 (genre + danceability + sort)
Індекс:
db.tracks.createIndex({
  track_genre: 1,
  "audio_features.danceability": 1,
  popularity: -1
});

BEFORE INDEX:
stage: COLLSCAN
docsExamined: 114000
executionTimeMillis: 1200

AFTER INDEX:
stage: IXSCAN
docsExamined: 1200
executionTimeMillis: 45
indexName: track_genre_1_danceability_1_popularity_-1

Що змінилось:
COLLSCAN → IXSCAN
менше scanned documents
швидша сортування
-- 6.2 Background music index
db.tracks.createIndex({
  "audio_features.instrumentalness": 1,
  "audio_features.speechiness": 1,
  explicit: 1
});

Покращує multi-field filtering

-- 6.3 Covered Query
db.tracks.find(
  { track_genre: "pop", popularity: { $gte: 70 } },
  { track_genre: 1, popularity: 1, _id: 0 }
);
Висновок:

covered query — YES, якщо індекс:(track_genre, popularity)

Бо:всі поля є в індексі
MongoDB не читає документи
-- Теорія Part 4
1. Що змінилось після індексу?
executionStats показує:
IXSCAN замість COLLSCAN
docsExamined ↓
2. Як зрозуміти, що індекс використовується?

У explain():

"stage": "IXSCAN"
"indexName": "..."
`"totalDocsExamined": менше"
3. covered query — що це?

Коли: всі поля є в індексі, немає доступу до документів

-- 7. Висновок

У роботі було: завантажено 114k документів, створено document schema, реалізовано aggregation pipeline,виконано аналітичні запити, створено індекси та оптимізовано запити