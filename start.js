const { spawn } = require('child_process');

// Liste des noms de fichiers des programmes à démarrer
const programFiles = ['R1.js', 'R2.js', 'R3.js', 'R4.js', 'R5.js', 'R6.js'];

// Fonction pour démarrer un programme
function startProgram(programFile) {
	return new Promise((resolve, reject) => {
		const program = spawn('node', [programFile]);

		// Afficher les messages de sortie du processus enfant
		program.stdout.on('data', (data) => {
			console.log(`stdout[${programFile}]: ${data}`);
		});

		// Afficher les messages d'erreur du processus enfant
		program.stderr.on('data', (data) => {
			console.error(`stderr[${programFile}]: ${data}`);
		});

		// Gérer la fin du processus enfant
		program.on('close', (code) => {
			console.log(`[${programFile}] Child process exited with code ${code}`);
			resolve();
		});

		// Gérer les erreurs de démarrage du processus enfant
		program.on('error', (err) => {
			console.error(`Error starting [${programFile}]: ${err}`);
			reject(err);
		});
	});
}

// Fonction pour démarrer tous les programmes en parallèle
async function startAllPrograms() {
	const promises = programFiles.map(startProgram);
	await Promise.all(promises);
}

// Démarrer tous les programmes
startAllPrograms().catch((err) => {
	console.error('Error starting programs:', err);
});
