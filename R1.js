const express = require('express');
const axios = require('axios');
const { broadcastToNeighbors, updateRoutingTable } = require('./networkUtils');
const app = express();
const port = 3001;

app.use(express.json());

const secret = 'R1-Secret';

let routingTable = [
	{ destination: '192.168.1.0', mask: '255.255.255.0', distance: 1, port: 0 },
	{ destination: '10.1.1.0', mask: '255.255.255.252', distance: 1, port: 3002 },
];

const neighbors = [
	{ url: 'http://localhost:3002', address: '10.1.1.2', port: 3002 },
];

app.post('/message', async (req, res) => {
	const { message, destination } = req.body;
	console.log(`Received message at R1: ${message} for ${destination}`);

	if (destination === '10.1.1.1') {
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
	console.log(`Server R1 running at http://localhost:${port}/`);
});
