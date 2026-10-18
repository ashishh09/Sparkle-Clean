const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize SQLite Database
const db = new sqlite3.Database('./cleaning.db', (err) => {
    if (err) console.error('Database error:', err.message);
    else console.log('Connected to SQLite database (cleaning.db).');
});

// Create Bookings Table & Insert Initial Sample Data
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        service TEXT NOT NULL,
        address TEXT NOT NULL,
        date TEXT NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'Pending'
    )`, () => {
        db.get("SELECT COUNT(*) as count FROM bookings", (err, row) => {
            if (row.count === 0) {
                const sampleBookings = [
                    ["Rahul Sharma", "General House Keeping & Tidying", "CIDCO, N-5", "2026-10-20", 599, "Confirmed"],
                    ["Priya Patil", "Kitchen Organization & Dishwashing", "Osmanpura", "2026-10-22", 499, "Pending"],
                    ["Amit Deshmukh", "Full Home Maintenance Package", "Station Road", "2026-10-25", 1299, "Confirmed"]
                ];
                const stmt = db.prepare("INSERT INTO bookings (name, service, address, date, price, status) VALUES (?, ?, ?, ?, ?, ?)");
                sampleBookings.forEach(b => stmt.run(b));
                stmt.finalize();
            }
        });
    });
});

// API: Get all bookings
app.get('/api/bookings', (req, res) => {
    db.all('SELECT * FROM bookings ORDER BY id DESC', [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

// API: Post a new booking (Create)
app.post('/api/bookings', (req, res) => {
    const { name, service, address, date, price } = req.body;
    const query = `INSERT INTO bookings (name, service, address, date, price, status) VALUES (?, ?, ?, ?, ?, 'Pending')`;
    
    db.run(query, [name, service, address, date, price], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({
                id: this.lastID,
                name,
                service,
                address,
                date,
                price,
                status: 'Pending'
            });
        }
    });
});

// API: Update booking status (Update)
app.put('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Status updated successfully', changes: this.changes });
        }
    });
});

// API: Delete a booking (Delete)
app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    
    db.run(`DELETE FROM bookings WHERE id = ?`, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Booking deleted successfully', changes: this.changes });
        }
    });
});

app.listen(PORT, () => {
    console.log(`House Cleaning Server running at http://localhost:${PORT}`);
});