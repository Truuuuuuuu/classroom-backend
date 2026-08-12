import AgentAPI from "apminsight";
AgentAPI.config();

import express from "express";
import subjectsRouter from "./routes/subject.js";
import classesRouter from "./routes/classes.js";
import userRouter from "./routes/users.js";
import cors from "cors";
import securityMiddleware from "./middleware/security.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

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

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);
app.use("/api/users", userRouter);
app.use("/api/classes", classesRouter);

app.get("/", (req, res) => {
  res.send("Hello, Welcome to the Classroom API");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
