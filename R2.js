const express = require('express');
const axios = require('axios');
const { broadcastToNeighbors, updateRoutingTable } = require('./networkUtils');
const app = express();
const port = 3002;

app.use(express.json());

const secret = 'R2-Secret';

let routingTable = [
	{ destination: '10.1.1.0', mask: '255.255.255.252', gateway: '10.1.1.1', interface: 'eth1', distance: 1, port: 3001 },
	{ destination: '10.1.2.0', mask: '255.255.255.252', gateway: '10.1.2.1', interface: 'eth2', distance: 1, port: 3003 },
	{ destination: '10.1.3.0', mask: '255.255.255.252', gateway: '10.1.3.1', interface: 'eth3', distance: 1, port: 3004 },
	{ destination: '10.1.4.0', mask: '255.255.255.252', gateway: '10.1.4.1', interface: 'eth4', distance: 1, port: 3005 }
];

const neighbors = [
	{ url: 'http://localhost:3001', address: '10.1.1.1', port: 3001 },
	{ url: 'http://localhost:3003', address: '10.1.2.2', port: 3003 }
];

app.post('/message', async (req, res) => {
	const { message, destination } = req.body;
	console.log(`Received message at R2: ${message} for ${destination}`);

	if (destination === '10.1.2.1') {
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
	console.log(`Server R2 running at http://localhost:${port}/`);
});
