const express = require('express');
const axios = require('axios');
const { broadcastToNeighbors, updateRoutingTable } = require('./networkUtils');
const app = express();
const port = 3005;

app.use(express.json());

const secret = 'R5-Secret';

let routingTable = [
	{ destination: '10.1.4.0', mask: '255.255.255.252', distance: 1, port: 3002 },
	{ destination: '10.1.5.0', mask: '255.255.255.252', distance: 1, port: 3003 },
	{ destination: '10.1.6.0', mask: '255.255.255.252', distance: 1, port: 3004 },
	{ destination: '10.1.7.0', mask: '255.255.255.252', distance: 1, port: 3006 }
];

const neighbors = [
	{ url: 'http://localhost:3002', address: '10.1.4.1', port: 3002 },
	{ url: 'http://localhost:3003', address: '10.1.2.2', port: 3003 },
	{ url: 'http://localhost:3004', address: '10.1.3.2', port: 3004 },
	{ url: 'http://localhost:3006', address: '10.1.7.2', port: 3006 }
];

app.post('/message', async (req, res) => {
	const { message, destination } = req.body;
	console.log(`Received message at R5: ${message} for ${destination}`);

	if (['10.1.4.2', '10.1.5.1', '10.1.6.1', '10.1.7.1'].includes(destination)) {
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
	console.log(`Server R5 running at http://localhost:${port}/`);
});
