const express = require("express");
const mysql = require("mysql");
const MongoClient = require("mongodb").MongoClient;

const app = express();
const port = 3002;

// MySQL Configuration
const mysqlConnection = mysql.createPool({
  connectionLimit: 10,
  host: "mysql", 
  user: "user", 
  password: "password", 
  database: "students", 
});

// MongoDB Configuration
const mongoUri = "mongodb://root:rootpassword@mongodb"; 
let mongoCollection;

const mongoClient = new MongoClient(mongoUri, { useUnifiedTopology: true });
mongoClient.connect((err) => {
  if (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
  const db = mongoClient.db("analytics");
  mongoCollection = db.collection("grades");
  console.log("Connected to MongoDB");
});

// Calculate and store analytics data in MongoDB
app.get("/compute", (req, res) => {
  // Drop all data from the 'grades' collection
  mongoCollection.deleteMany({}, (err) => {
    if (err) {
      console.error("Error deleting data from MongoDB:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    mysqlConnection.query("SELECT name, grade FROM Student", (err, results) => {
      if (err) {
        console.error("Error fetching data from MySQL:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Store Student results
      const studentsData = [];

      results.forEach((row) => {
        studentsData.push({
          name: row.name,
          grade: row.grade,
        });
      });

      const grades = studentsData.map((student) => student.grade);
      const maxGrade = Math.max(...grades);
      const minGrade = Math.min(...grades);
      const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;

      const analyticsData = {
        max: maxGrade,
        min: minGrade,
        avg: avgGrade,
      };

      // Insert student data and analytics data into MongoDB
      mongoCollection.insertMany(studentsData.concat(analyticsData), (err) => {
        if (err) {
          console.error("Error inserting data into MongoDB:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        console.log("Data successfully inserted into MongoDB.");
        res.json({
          message: "Data successfully computed and written to MongoDB.",
        });
      });
    });
  });
});


app.listen(port, () => {
  console.log(`Analytics service running on http://localhost:${port}`);
});

// Error handling DB connections
process.on("SIGTERM", () => {
  console.info("SIGTERM signal received. Closing connections and exiting...");
  mysqlConnection.end(() => {
    console.log("MySQL pool closed.");
    mongoClient.close(() => {
      console.log("MongoDB client closed.");
      process.exit(0);
    });
  });
});
