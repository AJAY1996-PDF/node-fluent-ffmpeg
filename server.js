import express from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "50mb" }));

app.get("/", (_, res) => res.json({ ok: true, service: "fluent-ffmpeg-cloudrun" }));

app.post("/jobs", async (req, res) => {
  try {
    const { audio_url, video_url, volume = 0.85 } = req.body || {};
    const id = Math.random().toString(36).slice(2);
    const dir = `/tmp/${id}`;
    await fs.mkdir(dir, { recursive: true });

    const a = path.join(dir, "a.mp3");
    const v = path.join(dir, "v.mp4");
    const o = path.join(dir, "out.mp4");

    const dl = async (url, dest) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Download failed ${r.status} ${url}`);
      const buf = Buffer.from(await r.arrayBuffer());
      await fs.writeFile(dest, buf);
    };

    await dl(audio_url, a);
    await dl(video_url, v);

    await new Promise((resolve, reject) => {
      ffmpeg(v)
        .input(a)
        .audioFilters(`volume=${volume}`)
        .outputOptions(["-shortest"])
        .on("end", resolve)
        .on("error", reject)
        .save(o);
    });

    res.json({ job_id: id, output_url: `file://${o}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Listening on port", port));
