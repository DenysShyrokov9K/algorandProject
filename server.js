const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
require("dotenv").config();

// Connect to Database
connectDB();

// Initialize Middleware
app.use(express.json({ strict: false }));

app.use(bodyParser.urlencoded({ extended: true }));

// Define Routes
app.use('/api/users', require('./routes/api/users'));

// Serve Static assets in production
if (process.env.NODE_ENV === "production") {
  // Set Static Folder
  app.use(express.static(__dirname + "/build"));
  app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/build/index.html", function (err) {
      if (err) {
        res.status(500).send(err);
      }
    });
  });
}


// SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));