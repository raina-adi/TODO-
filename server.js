const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Raina@123',
    database: 'todo_db'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            text VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            deadline DATETIME,
            alarm_triggered BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTableQuery, err => {
        if (err) console.error('Error creating table:', err);
        else console.log('Todos table ready');
    });
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/api/todos', (req, res) => {
    db.query('SELECT * FROM todos ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/todos', (req, res) => {
    const { text, deadline } = req.body;
    db.query(
        'INSERT INTO todos (text, deadline) VALUES (?, ?)',
        [text, deadline || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, text, completed: false, deadline });
        }
    );
});

app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    db.query('UPDATE todos SET completed = ? WHERE id = ?', [completed, id], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Todo updated' });
    });
});

app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM todos WHERE id = ?', [id], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Todo deleted' });
    });
});

app.delete('/api/todos/clear-completed', (req, res) => {
    db.query('DELETE FROM todos WHERE completed = TRUE', err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Completed todos cleared' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'todo.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
