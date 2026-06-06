import "express-async-errors";
import "reflect-metadata";

import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";

import { callRouter } from "./models/call/routes";
import { userRouter } from "./models/user/routes";
import { reportRouter } from "./models/report/routes";

import { HandleErrors } from "./shared/errors/HandleErrors.js";

export const app = express();

app.use(cors());
app.use(helmet());
app.use(json());

app.get("/", (req, res) => {
  res.send("Maintenance API Online 🚀");
});

app.use("/maintenance", userRouter);
app.use("/maintenance", callRouter);
app.use("/maintenance", reportRouter);

app.use(HandleErrors.execute);

const teste = "teste";
