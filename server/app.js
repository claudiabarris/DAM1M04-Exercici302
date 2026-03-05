const express = require('express');
const hbs = require('hbs');
const path = require('path');

// Com que db.js i app.js estan a la mateixa carpeta 'server', fem servir './db'
const db = require('./db'); 

// La ruta cap a common.json dins de la carpeta 'server/data'
const commonData = require('./data/common.json');

const app = express();

app.set('view engine', 'hbs');

// Configuraci贸 de carpetes (app.js ja est脿 dins de 'server')
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// La carpeta 'public' est脿 fora de 'server', pugem un nivell amb '../'
app.use(express.static(path.join(__dirname, '../public')));

// --- RUTES ---

// B) P脿gina Principal -> index.hbs (5 primeres pel路l铆cules i 5 categories)
app.get('/', async (req, res) => {
    try {
        const [movies] = await db.query(`
            SELECT f.title, f.release_year, GROUP_CONCAT(a.first_name SEPARATOR ', ') as actors 
            FROM film f 
            JOIN film_actor fa ON f.film_id = fa.film_id 
            JOIN actor a ON fa.actor_id = a.actor_id 
            GROUP BY f.film_id LIMIT 5`);
        const [categories] = await db.query('SELECT name FROM category LIMIT 5');
        res.render('index', { ...commonData, movies, categories });
    } catch (err) { 
        res.status(500).send("Error a la Home: " + err.message); 
    }
});

// C) P脿gina Pel路l铆cules -> informe.hbs (15 primeres pel路l铆cules amb actors)
app.get('/movies', async (req, res) => {
    try {
        const [movies] = await db.query(`
            SELECT f.title, f.release_year, GROUP_CONCAT(a.first_name, ' ', a.last_name SEPARATOR ', ') as actors 
            FROM film f 
            JOIN film_actor fa ON f.film_id = fa.film_id 
            JOIN actor a ON fa.actor_id = a.actor_id 
            GROUP BY f.film_id LIMIT 15`);
        res.render('informe', { ...commonData, movies });
    } catch (err) { 
        res.status(500).send("Error a Movies: " + err.message); 
    }
});

// D) Ruta Customers -> customers.hbs (25 clients amb els seus 5 lloguers)
app.get('/customers', async (req, res) => {
    try {
        // 1. Obtenim els 25 primers clients
        const [customers] = await db.query('SELECT customer_id, first_name, last_name FROM customer LIMIT 25');
        
        // 2. Per a cada client, busquem els seus 5 primers lloguers
        for (let c of customers) {
            const [rentals] = await db.query(
                'SELECT rental_date FROM rental WHERE customer_id = ? LIMIT 5', 
                [c.customer_id]
            );
            c.rentals = rentals; // Afegim l'array de lloguers a l'objecte del client
        }
        
        res.render('customers', { ...commonData, customers });
    } catch (err) { 
        res.status(500).send("Error a Customers: " + err.message); 
    }
});

app.listen(3000, () => console.log('馃殌 Servidor funcionant a http://localhost:3000'));