const express = require("express");
const Redis = require("ioredis");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379
});

// Add score (each game = unique entry)
app.post("/score", async (req, res) => {
  try {
    const { playerId, score } = req.body;

    if (!playerId || score === undefined) {
      return res.status(400).json({ error: "playerId and score required" });
    }

    // make every entry unique (even same player)
    const entryId = `${playerId}:${Date.now()}`;

    await redis.zadd("leaderboard", Number(score), entryId);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "redis error" });
  }
});

// Get top 10 leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const raw = await redis.zrevrange("leaderboard", 0, 9, "WITHSCORES");

    const result = [];

    for (let i = 0; i < raw.length; i += 2) {
      const fullId = raw[i];
      const score = Number(raw[i + 1]);

      // clean uuid (remove timestamp)
      const player = fullId.split(":")[0];

      result.push({
        player,
        score
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "redis error" });
  }
});

app.listen(4000, () => {
  console.log("API running on 4000");
});
