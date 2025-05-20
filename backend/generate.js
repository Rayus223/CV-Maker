const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'hi.js');

// Function to generate a random letter (A-Z or a-z)
function generateRandomLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return letters[Math.floor(Math.random() * letters.length)];
}

// Generate and append a letter on a new line every 100 milliseconds
setInterval(() => {
  const letter = generateRandomLetter() + '\n'; // Add newline character
  fs.appendFile(filePath, letter, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    }
  });
}, 300); // interval in milliseconds
