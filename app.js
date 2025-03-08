require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const userRoutes = require("./routes/users");
const reasonsRoutes = require("./routes/reasons");
const moodRoutes = require("./routes/mood");
const guestRoutes = require('./routes/guest')
const multiModalRoutes = require("./routes/multiModalRoutes"); 

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/reasons", reasonsRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/multimodal", multiModalRoutes); 
app.use("/api/guest/multimodal", guestRoutes); 

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
