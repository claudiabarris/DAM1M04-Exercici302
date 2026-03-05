const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = 3000;

// 1. CONFIGURAR HANDLEBARS
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false,
    // Si usas partials (header, footer), asegúrate de que esta carpeta existe
    partialsDir: path.join(__dirname, 'views/partials') 
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 2. CONTENIDOS ESTÁTICOS Y CACHE
// Usamos path.join para evitar errores de rutas en Linux/Proxmox
app.use(express.static(path.join(__dirname, '../public'))); 
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// 3. CONEXIÓN MYSQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'super',
    password: '1234',
    database: 'sakila',
    waitForConnections: true,
    connectionLimit: 10
});

// --- RUTES ---

// A) RUTA PRINCIPAL (Home)
app.get('/', async (req, res) => {
    try {
        // Consultamos películas y categorías en paralelo para mayor velocidad
        const [movies] = await pool.query('SELECT title, release_year FROM film LIMIT 5');
        const [categories] = await pool.query('SELECT name FROM category LIMIT 5');
        
        res.render('index', { 
            titolPagina: 'Inici', 
            movies: movies, 
            categories: categories 
        });
    } catch (error) {
        console.error("Error en la home:", error);
        res.render('index', { titolPagina: 'Inici', movies: [], categories: [] });
    }
});

// B) RUTA CLIENTS
app.get('/customers', async (req, res) => {
    try {
        // Obtenemos nombre, apellido y email (asegúrate de que estas columnas existen)
        const [rows] = await pool.query('SELECT first_name, last_name, email FROM customer LIMIT 25');
        
        res.render('customers', { 
            titolPagina: 'Clients', 
            customers: rows 
        }); 
    } catch (error) {
        console.error("Error en clientes:", error);
        res.status(500).send("Error al cargar los clientes");
    }
});

// ACTIVAR SERVIDOR
const httpServer = app.listen(port, () => {
    console.log(`Servidor engegat a: http://localhost:${port}`);
});

// APAGADO LIMPIO (SIGINT y SIGTERM para Proxmox)
const shutDown = () => {
    console.log('Tancant servidor...');
    httpServer.close(() => {
        process.exit(0);
    });
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);