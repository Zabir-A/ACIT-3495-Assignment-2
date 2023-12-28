const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const ejs = require("ejs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
const port = 3003;

// MongoDB Configuration
const mongoUri = "mongodb://root:rootpassword@mongodb";
let mongoCollection;

const client = new MongoClient(mongoUri, { useUnifiedTopology: true });
client.connect(async (err) => {
  if (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
  const db = client.db("analytics");
  mongoCollection = db.collection("grades");

  console.log("Connected to MongoDB");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fetch Data from MongoDB
app.get("/", async (req, res) => {
  try {
    const results = await mongoCollection.find({}).toArray();
    console.log("Read data from MongoDB:", results);

    res.render("index", { results });
  } catch (err) {
    console.error("Error fetching results from MongoDB:", err);
    res.status(500).send("Failed to fetch results");
  }
});

app.listen(port, () => {
  console.log(`Show Results service running on http://localhost:${port}`);
});
