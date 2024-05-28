const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");

const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());
app.set('trust proxy', 1);

app.use((req, res, next) => {
	res.header("X-Content-Type-Options", "nosniff");
	res.header("X-Frame-Options", "DENY");

	next();
});

app.get('/', (req, res) => {
	res.status(200).send("Hello World!");
});

app.listen(PORT, () => {
	console.log(`Serveur listening on port ${PORT}`);
});