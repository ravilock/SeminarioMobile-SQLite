const fs = require('fs-extra');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let dirPath = '.'

const args = process.argv.slice(2);
if (args.length === 1) {
  dirPath = args[0];
}

// Database setup
const db = new sqlite3.Database('./files.db');

// Create a table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL,
      extension TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_extension ON files (extension)
  `);
});

// Function to insert file metadata into the database
const insertFileMetadata = (name, path, size, extension, createdAt) => {
  db.run(`
    INSERT INTO files (name, path, size, extension, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, [name, path, size, extension, createdAt], function (err) {
    if (err) {
      console.error('Error inserting file data:', err.message);
    } else {
      console.log(`File ${name} inserted with id ${this.lastID}`);
    }
  });
};

const getFileExtension = (name) => {
  const splitFileName = name.split('.');
  if (splitFileName.length === 1 || (splitFileName[0] === "" && splitFileName.length === 2)) {
    return "";
  }
  return splitFileName.pop().toLowerCase();
}

// Function to process files in a directory
const processDirectory = async (dir) => {
  try {
    const files = await fs.readdir(dir);
    for (const fileName of files) {
      const filePath = path.join(dir, fileName);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        insertFileMetadata(fileName, path.resolve(fileName), stats.size, getFileExtension(fileName), stats.birthtime.toISOString());
      } else if (stats.isDirectory()) {
        console.log(filePath)
        await processDirectory(filePath);
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err.message);
  }
};

processDirectory(dirPath)
  .then(() => {
    db.close();
  })
  .catch(err => {
    console.error('Error processing directory:', err.message);
    db.close();
  });
