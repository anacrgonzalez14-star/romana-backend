const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json()); 
app.use(cors());         

const LLAVE_SUPREMA = "RomanaSushi_Secreto_2026";

// --- MODIFICACIÓN PARA PRUEBA: DATOS DE EMERGENCIA ---
const productosPrueba = [
    { id: 1, titulo: "Crunchy Roll Especial", descripcion: "Cangrejo, aguacate y tope de tempura", precio: 12, imagen_url: "logo.jpeg" },
    { id: 2, titulo: "Tiger Roll", descripcion: "Langostino crocante y queso crema", precio: 15, imagen_url: "logo.jpeg" },
    { id: 3, titulo: "Promo Romana", descripcion: "20 piezas variadas + bebida", precio: 25, imagen_url: "logo.jpeg" }
];

// CONFIGURACIÓN DE BASE DE DATOS
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'romana_sushi'
});

// MODIFICADO: Ahora si falla la conexión, el servidor sigue vivo para la prueba
db.connect(err => {
    if (err) {
        console.log("⚠️ MySQL no disponible (Modo Prueba activado en la Nube)");
    } else {
        console.log("✅ Conectado a la DB de XAMPP");
    }
});

// --- RUTA 1: LOGIN ---
app.post('/api/login', (req, res) => {
    const { usuario, clave } = req.body;
    if (usuario === 'admin' && clave === 'sushi123') {
        const token = jwt.sign({ rol: 'supremo' }, LLAVE_SUPREMA, { expiresIn: '2h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Acceso denegado" });
    }
});

// --- RUTA 2: VER PRODUCTOS (Modificada para prueba) ---
app.get('/api/promos', (req, res) => {
    db.query('SELECT * FROM promociones', (err, results) => {
        if (err) {
            // Si MySQL falla en Render, enviamos los productos de prueba
            return res.json(productosPrueba);
        }
        res.json(results);
    });
});

// --- RUTA PARA AGREGAR PROMO ---
app.post('/api/promos', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "No tienes permiso" });

    jwt.verify(token, LLAVE_SUPREMA, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Sesión inválida" });
        
        const { titulo, descripcion, precio, imagen_url } = req.body;
        const sql = 'INSERT INTO promociones (titulo, descripcion, precio, imagen_url) VALUES (?, ?, ?, ?)';
        
        db.query(sql, [titulo, descripcion, precio, imagen_url], (err, result) => {
            if (err) {
                // En modo prueba simulamos éxito
                return res.json({ success: true, message: "Simulado: ¡Promoción publicada!" });
            }
            res.json({ success: true, message: "¡Promoción publicada!" });
        });
    });
});

// --- RUTA 4: ELIMINAR PRODUCTO ---
app.delete('/api/promos/:id', (req, res) => {
    const token = req.headers['authorization'];
    const { id } = req.params;
    if (!token) return res.status(403).send("No tienes permiso");

    jwt.verify(token, LLAVE_SUPREMA, (err, decoded) => {
        if (err) return res.status(403).send("Token inválido");
        const sql = 'DELETE FROM promociones WHERE id = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.json({ message: "Simulado: Eliminado" });
            res.json({ message: "Promoción eliminada correctamente" });
        });
    });
});

// --- RUTA PARA ACTUALIZAR ---
app.put('/api/promos/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, precio, imagen_url } = req.body;
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send("Sin token");

    jwt.verify(token, LLAVE_SUPREMA, (err, decoded) => {
        if (err) return res.status(403).send("Token inválido");
        const sql = "UPDATE promociones SET titulo=?, descripcion=?, precio=?, imagen_url=? WHERE id=?";
        db.query(sql, [titulo, descripcion, precio, imagen_url, id], (err, result) => {
            if (err) return res.json({ success: true });
            res.json({ success: true });
        });
    });
});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});