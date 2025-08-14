const mysql = require('mysql2');

// Connect to MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Raina@123', // same as your main app
    database: 'todo_db'
});

// Test insert
db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
        return;
    }
    console.log('✅ Connected to MySQL');

    const query = "INSERT INTO todos (text, deadline) VALUES (?, ?)";
    const values = ["Test from script", "2025-08-15 10:00:00"];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Insert error:', err);
        } else {
            console.log('✅ Insert success:', result);
        }
        db.end();
    });
});
