const axios = require('axios');

async function sendMessage(destination, message) {
	try {
		const response = await axios.post(`http://localhost:${destination.port}/message`, { message, destination: destination.ip });
		console.log(`Received response: ${response.data.message}`);
		console.log('Updated Routing Table:');
		console.table(response.data.routingTable);
		if (response.data.secret) {
			console.log(`Received secret: ${response.data.secret}`);
		}
	} catch (error) {
		console.error(`Error sending to ${destination.ip}:`, error);
	}
}

const destination = { ip: '10.1.5.0', port: 3003 }; // Destination R3
const message = 'Hello, R3!';

sendMessage(destination, message);
