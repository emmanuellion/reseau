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

const table = {
	'R1': {
		ip: '10.1.1.1',
		port: 3001
	},
	'R2': {
		ip: '',
		port: 3002
	},
	'R3': {
		ip: '10.1.2.2',
		port: 3003
	},
	'R4': {
		ip: '10.1.3.2',
		port: 3004
	},
	'R5': {
		ip: '',
		port: 3005
	},
	'R6': {
		ip: '10.1.7.2',
		port: 3006
	},
}

const CHOICE = 'R3';

const destination = { ip: table[CHOICE].ip, port: 3001 }; // Destination R3
const message = 'Hello, R5!';

sendMessage(destination, message);
