const axios = require('axios');

async function broadcastToNeighbors(neighbors, message, destination) {
	const responses = [];
	for (const neighbor of neighbors) {
		try {
			const response = await axios.post(`${neighbor.url}/message`, { message, destination });
			responses.push(response.data.routingTable);
		} catch (error) {
			console.error(`Error sending to ${neighbor.url}:`, error);
		}
	}
	return responses;
}

function updateRoutingTable(currentTable, newTable) {
	newTable.forEach(newRoute => {
		const existingRoute = currentTable.find(route => route.destination === newRoute.destination);
		if (!existingRoute) {
			currentTable.push(newRoute);
		} else if (newRoute.distance < existingRoute.distance) {
			Object.assign(existingRoute, newRoute);
		}
	});
}

module.exports = { broadcastToNeighbors, updateRoutingTable };
