const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Carregar dades comunes
const commonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/common.json'), 'utf8'));

// Configuració Handlebars
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false // Desactivem el layout per defecte per fer servir les subvistes manualment
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Arxius estàtics
app.use(express.static(path.join(__dirname, '../public')));

// Connexió a MySQL (Ajusta l'usuari i la contrasenya del teu Proxmox/Local)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'sakila'
});

// --- RUTES ---

// B) Ruta / (Pàgina principal)
app.get('/', async (req, res) => {
    try {
        // 5 primeres pel·lícules amb actors (usant GROUP_CONCAT)
        const [movies] = await pool.query(`
            SELECT f.title, f.release_year, 
                   (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
                    FROM film_actor fa
                    JOIN actor a ON fa.actor_id = a.actor_id
                    WHERE fa.film_id = f.film_id) AS actors
            FROM film f LIMIT 5
        `);
        // 5 primeres categories
        const [categories] = await pool.query(`SELECT name FROM category LIMIT 5`);

        res.render('index', { ...commonData, titolPagina: 'Inici', movies, categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
});

// C) Ruta /movies (Pel·lícules)
app.get('/movies', async (req, res) => {
    try {
        const [movies] = await pool.query(`
            SELECT f.title, f.release_year, f.description,
                   (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
                    FROM film_actor fa
                    JOIN actor a ON fa.actor_id = a.actor_id
                    WHERE fa.film_id = f.film_id) AS actors
            FROM film f LIMIT 15
        `);
        res.render('movies', { ...commonData, titolPagina: 'Pel·lícules', movies });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
});

// D) Ruta /customers (Clients i lloguers)
app.get('/customers', async (req, res) => {
    try {
        // Obtenim els 25 primers clients
        const [customers] = await pool.query(`SELECT customer_id, first_name, last_name FROM customer LIMIT 25`);

        // Busquem els 5 primers lloguers per a cada client
        const customersWithRentals = await Promise.all(customers.map(async (customer) => {
            const [rentals] = await pool.query(`
                SELECT f.title, r.rental_date
                FROM rental r
                JOIN inventory i ON r.inventory_id = i.inventory_id
                JOIN film f ON i.film_id = f.film_id
                WHERE r.customer_id = ?
                ORDER BY r.rental_date DESC LIMIT 5
            `, [customer.customer_id]);
            return { ...customer, rentals };
        }));

        res.render('customers', { ...commonData, titolPagina: 'Clients', customers: customersWithRentals });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor engegat a http://localhost:${PORT}`);
});