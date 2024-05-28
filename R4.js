const express = require('express');
const axios = require('axios');
const { broadcastToNeighbors, updateRoutingTable } = require('./networkUtils');
const app = express();
const port = 3004;

app.use(express.json());

const secret = 'R4-Secret';

let routingTable = [
	{ destination: '10.1.3.0', mask: '255.255.255.252', distance: 1, port: 3002 },
	{ destination: '10.1.5.0', mask: '255.255.255.252', distance: 1, port: 3005 }
];

const neighbors = [
	{ url: 'http://localhost:3002', address: '10.1.3.1', port: 3002 },
	{ url: 'http://localhost:3002', address: '10.1.6.1', port: 3005 }
];

app.post('/message', async (req, res) => {
	const { message, destination } = req.body;
	console.log(`Received message at R4: ${message} for ${destination}`);

	if (destination === '10.1.3.2') {
		return res.json({ message: `Secret: ${secret}`, routingTable });
	}

	const knownRoute = routingTable.find(route => route.destination === destination);
	if (knownRoute) {
		if (knownRoute.gateway === destination) {
			res.json({ message: `Delivered to ${destination}`, routingTable });
		} else {
			try {
				const response = await axios.post(`http://localhost:${knownRoute.port}/message`, { message, destination });
				updateRoutingTable(routingTable, response.data.routingTable);
				res.json({ message: `Forwarded to ${knownRoute.gateway}`, routingTable });
			} catch (error) {
				console.error(`Error forwarding to ${knownRoute.gateway}:`, error);
				res.status(500).send('Error forwarding message');
			}
		}
	} else {
		const neighborsTables = await broadcastToNeighbors(neighbors, message, destination);
		for (const table of neighborsTables) {
			updateRoutingTable(routingTable, table);
		}
		res.json({ message: 'Broadcasted to neighbors', routingTable });
	}
});

app.listen(port, () => {
	console.log(`Server R4 running at http://localhost:${port}/`);
});
