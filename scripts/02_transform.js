// scripts/02_transform.js
// запуск:
// mongosh "MONGO_URI" --file scripts/02_transform.js

const dbName = "spotify";
const dbRef = db.getSiblingDB(dbName);

// 1. видаляємо стару колекцію
dbRef.tracks.drop();

// 2. aggregation pipeline
dbRef.tracks_raw.aggregate([
  {
    $project: {
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: 1,
      popularity: 1,
      duration_ms: 1,
      track_genre: 1,
      artists_raw: "$artists",

      danceability: 1,
      energy: 1,
      loudness: 1,
      speechiness: 1,
      acousticness: 1,
      instrumentalness: 1,
      liveness: 1,
      valence: 1,
      tempo: 1,
      key: 1,
      mode: 1,
      time_signature: 1
    }
  },

  // 3. артисти - масив
  {
    $set: {
      artists: {
        $map: {
          input: { $split: ["$artists_raw", ";"] },
          as: "a",
          in: { $trim: { input: "$$a" } }
        }
      },

      // 4. audio_features
      audio_features: {
        danceability: "$danceability",
        energy: "$energy",
        loudness: "$loudness",
        speechiness: "$speechiness",
        acousticness: "$acousticness",
        instrumentalness: "$instrumentalness",
        liveness: "$liveness",
        valence: "$valence",
        tempo: "$tempo",
        key: "$key",
        mode: "$mode",
        time_signature: "$time_signature"
      },

      duration_sec: {
        $round: [{ $divide: ["$duration_ms", 1000] }, 1]
      },

      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: ["$popularity", 70] }, then: "high" },
            { case: { $and: [{ $gte: ["$popularity", 40] }, { $lt: ["$popularity", 70] }] }, then: "medium" }
          ],
          default: "low"
        }
      }
    }
  },

  // 5. прибираємо зайве
  {
    $unset: [
      "artists_raw",
      "danceability",
      "energy",
      "loudness",
      "speechiness",
      "acousticness",
      "instrumentalness",
      "liveness",
      "valence",
      "tempo",
      "key",
      "mode",
      "time_signature"
    ]
  },

  // 6. зберігаємо
  {
    $out: "tracks"
  }
]);

// перевірка
print("Tracks count:");
print(dbRef.tracks.countDocuments({}));

print("Sample document:");
printjson(dbRef.tracks.findOne());