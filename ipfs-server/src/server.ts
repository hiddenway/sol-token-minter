import express from "express";
import { create } from "ipfs-http-client";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

const ipfs = create({
  url: process.env.IPFS_API_URL || "http://localhost:5001",
});

app.use(cors());
app.use(express.json());

app.post("/upload", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const { path } = await ipfs.add(req.file.buffer);
    res.json({ cid: path });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/get/:cid", async (req: any, res: any) => {
  try {
    const stream = ipfs.cat(req.params.cid);
    res.setHeader("Content-Type", "application/octet-stream");

    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`IPFS API server running on port ${port}`);
});
