require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
