const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json()); // Permite leer datos enviados en formato JSON
app.use(cors());         // Permite que tu HTML se comunique con este servidor

// LLAVE MAESTRA (Solo tú la sabes)
const LLAVE_SUPREMA = "RomanaSushi_Secreto_2026";

// CONFIGURACIÓN DE BASE DE DATOS (XAMPP)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Por defecto en XAMPP es vacío
    database: 'romana_sushi'
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ Conectado a la DB de XAMPP");
});

// --- RUTA 1: LOGIN DEL USUARIO SUPREMO ---
app.post('/api/login', (req, res) => {
    const { usuario, clave } = req.body;
    // Aquí defines tu usuario y contraseña únicos
    if (usuario === 'admin' && clave === 'sushi123') {
        const token = jwt.sign({ rol: 'supremo' }, LLAVE_SUPREMA, { expiresIn: '2h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Acceso denegado" });
    }
});

// --- RUTA 2: VER PRODUCTOS (Público) ---
app.get('/api/promos', (req, res) => {
    db.query('SELECT * FROM promociones', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
// --- RUTA PARA AGREGAR PROMO (Solo para el Supremo) ---
app.post('/api/promos', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "No tienes permiso" });

    jwt.verify(token, "RomanaSushi_Secreto_2026", (err, decoded) => {
        if (err) return res.status(403).json({ message: "Sesión inválida" });
        
        const { titulo, descripcion, precio, imagen_url } = req.body;
        const sql = 'INSERT INTO promociones (titulo, descripcion, precio, imagen_url) VALUES (?, ?, ?, ?)';
        
        db.query(sql, [titulo, descripcion, precio, imagen_url], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Error en la base de datos" });
            }
            res.json({ success: true, message: "¡Promoción publicada!" });
        });
    });
});

// --- RUTA 3: AGREGAR PRODUCTO (Solo Supremo) ---
app.post('/api/promos', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send("No tienes permiso");

    jwt.verify(token, LLAVE_SUPREMA, (err, decoded) => {
        if (err) return res.status(403).send("Token inválido");
        
        const { titulo, descripcion, precio, imagen_url } = req.body;
        const sql = 'INSERT INTO promociones (titulo, descripcion, precio, imagen_url) VALUES (?, ?, ?, ?)';
        db.query(sql, [titulo, descripcion, precio, imagen_url], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ message: "¡Promoción agregada por el Supremo!" });
        });
    });
});
// --- RUTA 4: ELIMINAR PRODUCTO (Solo Supremo) ---
app.delete('/api/promos/:id', (req, res) => {
    const token = req.headers['authorization'];
    const { id } = req.params;

    if (!token) return res.status(403).send("No tienes permiso");

    jwt.verify(token, LLAVE_SUPREMA, (err, decoded) => {
        if (err) return res.status(403).send("Token inválido");
        
        const sql = 'DELETE FROM promociones WHERE id = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ message: "Promoción eliminada correctamente" });
        });
    });
});
// --- RUTA PARA ACTUALIZAR (Solo Supremo) ---
// RUTA PARA ACTUALIZAR (PUT)
app.put('/api/promos/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, precio, imagen_url } = req.body;
    const token = req.headers['authorization'];

    if (!token) return res.status(403).send("Sin token");

    jwt.verify(token, "RomanaSushi_Secreto_2026", (err, decoded) => {
        if (err) return res.status(403).send("Token inválido");

        const sql = "UPDATE promociones SET titulo=?, descripcion=?, precio=?, imagen_url=? WHERE id=?";
        db.query(sql, [titulo, descripcion, precio, imagen_url, id], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ success: true });
        });
    });
});
// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("🚀 Servidor corriendo en http://localhost:3000");
});