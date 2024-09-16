const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./files.db');

// Function to read all data from the files table
const readData = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM files', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Read data and display it
readData()
  .then(rows => {
    for (const row of rows) {
      console.table(row);
    }
  })
  .catch(err => {
    console.error('Error reading data from database:', err.message);
  })
  .finally(() => {
    db.close();
  });
