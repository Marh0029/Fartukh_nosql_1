// Завдання 1 — Top-10
db.tracks.aggregate([
  { $unwind: "$artists" },

  {
    $group: {
      _id: "$artists",
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$popularity" }
    }
  },

  {
    $match: {
      trackCount: { $gte: 5 }
    }
  },

  { $sort: { avgPopularity: -1 } },
  { $limit: 10 },

  {
    $project: {
      artist: "$_id",
      trackCount: 1,
      avgPopularity: { $round: ["$avgPopularity", 1] }
    }
  }
]);

// Завдання 2 — настрій треків
db.tracks.aggregate([
  {
    $project: {
      mood: {
        $switch: {
          branches: [
            {
              case: {
                $and: [
                  { $gt: ["$audio_features.valence", 0.5] },
                  { $gt: ["$audio_features.energy", 0.5] }
                ]
              },
              then: "happy"
            },
            {
              case: {
                $and: [
                  { $lte: ["$audio_features.valence", 0.5] },
                  { $gt: ["$audio_features.energy", 0.5] }
                ]
              },
              then: "angry"
            },
            {
              case: {
                $and: [
                  { $gt: ["$audio_features.valence", 0.5] },
                  { $lte: ["$audio_features.energy", 0.5] }
                ]
              },
              then: "calm"
            }
          ],
          default: "sad"
        }
      }
    }
  },

  {
    $group: {
      _id: "$mood",
      count: { $sum: 1 }
    }
  },

  {
    $project: {
      mood: "$_id",
      count: 1,
      _id: 0
    }
  }
]);

// Завдання 3 — Найбільш “танцювальний” жанр
db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      count: { $sum: 1 },
      avg_danceability: { $avg: "$audio_features.danceability" },
      avg_energy: { $avg: "$audio_features.energy" },
      avg_valence: { $avg: "$audio_features.valence" }
    }
  },

  {
    $match: {
      count: { $gte: 100 }
    }
  },

  {
    $project: {
      genre: "$_id",
      count: 1,
      avg_danceability: { $round: ["$avg_danceability", 3] },
      avg_energy: { $round: ["$avg_energy", 3] },
      avg_valence: { $round: ["$avg_valence", 3] }
    }
  },

  { $sort: { avg_danceability: -1 } }
]);