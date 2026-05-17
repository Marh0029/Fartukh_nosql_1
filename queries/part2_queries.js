// Завдання 1 — party tracks
db.tracks.find({
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  duration_ms: { $gte: 180000, $lte: 300000 }
});

// Завдання 2 — популярні артисти
db.tracks.aggregate([
  { $unwind: "$artists" },

  {
    $group: {
      _id: "$artists",
      trackCount: { $sum: 1 },
      minPopularity: { $min: "$popularity" },
      avgPopularity: { $avg: "$popularity" }
    }
  },

  {
    $match: {
      trackCount: { $gte: 3 },
      minPopularity: { $gte: 60 }
    }
  },

  { $sort: { avgPopularity: -1 } },
  { $limit: 20 },

  {
    $project: {
      artist: "$_id",
      trackCount: 1,
      minPopularity: { $round: ["$minPopularity", 1] },
      avgPopularity: { $round: ["$avgPopularity", 1] }
    }
  }
]);

// Завдання 3 — outliers
db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std: { $stdDevPop: "$audio_features.tempo" },
      tracks: {
        $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: "$audio_features"
        }
      }
    }
  },

  {
    $project: {
      genre: "$_id",
      avg_tempo: 1,
      std: 1,
      outlier_threshold: {
        $add: ["$avg_tempo", { $multiply: [2, "$std"] }]
      },
      tracks: 1
    }
  },

  {
    $project: {
      genre: 1,
      avg_tempo: 1,
      outlier_threshold: 1,

      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "t",
          cond: {
            $gt: ["$$t.audio_features.tempo",
              { $add: ["$avg_tempo", { $multiply: [2, "$std"] }] }
            ]
          }
        }
      }
    }
  }
]);

// Завдання 4 — background music
db.tracks.find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false
});