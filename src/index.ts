import express from "express";
import subjectsRouter from "./routes/subject.js";
import cors from "cors";
import securityMiddleware from "./middleware/security.js";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) throw new Error("FRONTEND_URL is not defined");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);

app.get("/", (req, res) => {
  res.send("Hello, Welcome to the Classroom API");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
