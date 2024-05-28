const express = require('express');
const axios = require('axios');
const { broadcastToNeighbors, updateRoutingTable } = require('./networkUtils');
const app = express();
const port = 3006;

app.use(express.json());

const secret = 'R6-Secret';

let routingTable = [
	{ destination: '10.1.7.0', mask: '255.255.255.252', distance: 1, port: 3005 },
	// { destination: '172.16.180.0', mask: '255.255.255.0', distance: 1, port: 3007 }
];

const neighbors = [
	{ url: 'http://localhost:3005', address: '10.1.2.2', port: 3005 },
	// { url: 'http://localhost:3007', address: '10.1.2.2', port: 3007 }
];

app.post('/message', async (req, res) => {
	const { message, destination } = req.body;
	console.log(`Received message at R6: ${message} for ${destination}`);

	if (destination === '10.1.7.2') {
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
	console.log(`Server R6 running at http://localhost:${port}/`);
});
