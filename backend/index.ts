import express from "express";
import cors from "cors";
import authRouter from "./src/routes/auth.js";
import stripeRouter from "./src/routes/stripe.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/stripe", stripeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
