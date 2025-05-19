const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'hi.js');

// Function to generate a random letter (A-Z or a-z)
function generateRandomLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return letters[Math.floor(Math.random() * letters.length)];
}

// Generate and append a letter every second
setInterval(() => {
  const letter = generateRandomLetter();
  fs.appendFile(filePath, letter, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    }
  });
}, 100); // interval in milliseconds