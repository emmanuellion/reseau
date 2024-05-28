const express = require('express');
const axios = require('axios');
const { broadcastToNeighbors, updateRoutingTable } = require('./networkUtils');
const app = express();
const port = 3003;

app.use(express.json());

const secret = 'R3-Secret';

let routingTable = [
	{ destination: '10.1.2.0', mask: '255.255.255.252', gateway: '10.1.2.2', interface: 'eth2', distance: 1, port: 3002 },
	{ destination: '10.1.5.0', mask: '255.255.255.252', gateway: '10.1.5.1', interface: 'eth5', distance: 1, port: 3006 }
];

const neighbors = [
	{ url: 'http://localhost:3002', address: '10.1.2.2', port: 3002 }
];

app.post('/message', async (req, res) => {
	const { message, destination } = req.body;
	console.log(`Received message at R3: ${message} for ${destination}`);

	if (destination === '10.1.2.2') {
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
	console.log(`Server R3 running at http://localhost:${port}/`);
});
