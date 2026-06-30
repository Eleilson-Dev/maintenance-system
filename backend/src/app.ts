import "reflect-metadata";

import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";

import { callRouter } from "./models/call/routes/Call.routes.js";
import { userRouter } from "./models/user/routes/User.routes.js";
import { reportRouter } from "./models/report/routes/Report.routes.js";
import { locationRouter } from "./models/location/routes/Location.routes.js";

import { HandleErrors } from "./shared/errors/HandleErrors.js";
import { AreaRouter } from "./models/area/routes/Area.routes.js";

export const app = express();

app.use(cors());
app.use(helmet());
app.use(json());

app.get("/", (req, res) => {
  res.send("Maintenance API Online 🚀");
});

app.use("/maintenance", userRouter);
app.use("/maintenance", AreaRouter);
app.use("/maintenance", locationRouter);
app.use("/maintenance", callRouter);
app.use("/maintenance", reportRouter);

app.use(HandleErrors.execute);
