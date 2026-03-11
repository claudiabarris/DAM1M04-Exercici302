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
    partialsDir: path.join(__dirname, 'views/partials') 
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 2. CONTENIDOS ESTÁTICOS Y CACHE
app.use(express.static(path.join(__dirname, 'public'))); 
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// 3. CONEXIÓN MYSQL (Pool de conexiones)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'super',
    password: '1234',
    database: 'sakila',
    waitForConnections: true,
    connectionLimit: 10
});

// --- RUTES ---

// A) RUTA PRINCIPAL (Home - index.hbs)
app.get('/', async (req, res) => {
    try {
        // Obtenemos películas y categorías para la página de inicio
        const [movies] = await pool.query('SELECT title, release_year FROM film LIMIT 5');
        const [categories] = await pool.query('SELECT name FROM category LIMIT 5');
        
        res.render('index', { 
            titolPagina: 'Benvinguts a Sakila', 
            movies: movies, 
            categories: categories 
        });
    } catch (error) {
        console.error("Error en la home:", error);
        res.render('index', { titolPagina: 'Inici', movies: [], categories: [] });
    }
});

// B) RUTA CLIENTS (customers.hbs)
app.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT first_name, last_name, email FROM customer LIMIT 25');
        
        res.render('customers', { 
            titolPagina: 'Llistat de Clients', 
            customers: rows 
        }); 
    } catch (error) {
        console.error("Error en clientes:", error);
        res.status(500).send("Error al carregar els clients");
    }
});

// C) RUTA PEL·LÍCULES (movies.hbs)
app.get('/movies', async (req, res) => {
    try {
        // Esta consulta es la que alimenta tu nuevo movie.hbs
        const [rows] = await pool.query('SELECT title, release_year FROM film LIMIT 30');
        
        res.render('movies', { 
            titolPagina: 'Catàleg de Pel·lícules', 
            movies: rows 
        }); 
    } catch (error) {
        console.error("Error en movies:", error);
        res.status(500).send("Error al carregar les pel·lícules");
    }
});

// ACTIVAR SERVIDOR
const httpServer = app.listen(port, () => {
    console.log(`Servidor engegat a: http://localhost:${port}`);
});

// APAGADO LIMPIO
const shutDown = () => {
    console.log('Tancant servidor...');
    httpServer.close(() => {
        process.exit(0);
    });
};

process.