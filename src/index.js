const express = require('express');
const app = express();

console.log("hello world1")

app.get('/', (req, res) => {
  res.send('set up my first backend project with node.js');
});

console.log("hello world2")

app.listen(5000);
