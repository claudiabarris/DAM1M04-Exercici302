const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = 3000;

// 1. CONFIGURAR HANDLEBARS
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views')); // Esto es vital para que encuentre la carpeta

// 2. CONTENIDOS ESTÁTICOS Y CACHE
app.use(express.static('public'));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// 3. CONEXIÓN MYSQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'super',
    password: '1234',
    database: 'sakila'
});

// 4. RUTA PARA CUSTOMERS (La que te da el error)
app.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT first_name, last_name FROM customer LIMIT 25');
        // Renderiza el archivo 'customers.hbs' que tienes en la carpeta views
        res.render('customers', { customers: rows }); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Error en la base de datos");
    }
});

// 5. RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.render('index');
});

// ACTIVAR SERVIDOR
const httpServer = app.listen(port, () => {
    console.log(`Servidor en: http://localhost:${port}`);
});

// APAGADO LIMPIO
process.on('SIGINT', () => {
    httpServer.close();
    process.exit(0);
});