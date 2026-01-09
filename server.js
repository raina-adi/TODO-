const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Raina@123',
    database: 'todo_db'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('✓ Connected to MySQL');

    // Create table if it doesn't exist
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            text VARCHAR(255) NOT NULL,
            date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(createTableSQL, err => {
        if (err) console.error('Error creating table:', err);
        else console.log('✓ Todos table ready');
    });
});

// Routes
// Get all todos
app.get('/api/todos', (req, res) => {
    db.query('SELECT * FROM todos ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add new todo
app.post('/api/todos', (req, res) => {
    const { text, date } = req.body;
    db.query('INSERT INTO todos (text, date) VALUES (?, ?)', [text, date || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, text, date: date || null });
    });
});

// Delete todo
app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM todos WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Todo deleted' });
    });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✓ Server running at http://localhost:${PORT}`);
});
