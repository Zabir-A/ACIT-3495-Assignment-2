const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MySQL Configuration
const dbConfig = {
  host: "mysql",
  user: "user",
  password: "password",
  database: "students",
};

let connection;

// Disconnect Handling
function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error("error connecting:", err.stack);
      setTimeout(handleDisconnect, 2000);
    }
  });

  // Error handling for lost connections
  connection.on("error", (err) => {
    console.error("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

app.get("/", (req, res) => {
  res.render("index");
});

// Post grades to the database
app.post("/", async (req, res) => {
  const { user, password, student_name, grade } = req.body;

  try {
    const response = await axios.post(
      // "http://auth-service:5001/auth-service/authenticate",
      "http://auth-service:80/auth-service/authenticate",
      {
        user,
        password,
      }
    );

    // If the user is authenticated, insert the grade into the database
    if (response.data.valid) {
      connection.query(
        "INSERT INTO Student (name, grade) VALUES (?, ?)",
        [student_name, parseFloat(grade)],
        (err) => {
          if (err) {
            console.error("Database error:", err);
            res.status(500).send("Failed to insert into the database.");
            return;
          }
          res.send(`Grade for ${student_name} entered as ${grade}.`);
        }
      );
    } else {
      res
        .status(401)
        .send("Authentication failed. Please check your credentials.");
    }
  } catch (error) {
    console.error("Error communicating with auth service:", error);
    res.status(500).send("Error communicating with auth service.");
  }
});

app.listen(port, () => {
  console.log(`Enter Grades service running on http://localhost:${port}`);
});
