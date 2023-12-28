const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 5001;

// Hardcoded users
const users = {
  admin: "password",
};

app.use(bodyParser.json());

app.post("/auth-service/authenticate", (req, res) => {
  const { user, password } = req.body;

  if (users[user] && users[user] === password) {
    return res.json({ valid: true });
  }
  return res.json({ valid: false });
});

app.listen(port, () => {
  console.log(`Auth service running on http://localhost:${port}`);
});
