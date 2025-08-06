import express from "express";
import { env } from "node:process";
const app = express();
const port = env.PORT || "3000";

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export { app };