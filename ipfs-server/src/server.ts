import express from "express";
import { create } from "ipfs-http-client";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

const projectId = "d1699857b92343009c782e1a814e4d42";
const projectSecret = "a3559fb7ebd843fea8f872aa405c85fb";
const auth =
  "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

app.use(cors());
app.use(express.json());

app.post("/upload", upload.single("file"), async (req:any, res:any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const { path } = await ipfs.add(req.file.buffer);
    res.json({ cid: path });
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/get/:cid", async (req, res) => {
  try {
    const stream = ipfs.cat(req.params.cid);
    res.setHeader("Content-Type", "application/octet-stream");

    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`IPFS API server running on port ${port}`);
});
