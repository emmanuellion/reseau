function bellmanFord(routes, source) {
	const distances = {};
	const predecessors = {};

	// Initialisation
	for (const route of routes) {
		distances[route.destination] = Infinity;
		predecessors[route.destination] = null;
	}
	distances[source] = 0;

	// Relaxation des arêtes
	for (let i = 0; i < routes.length - 1; i++) {
		for (const route of routes) {
			if (distances[route.gateway] + route.distance < distances[route.destination]) {
				distances[route.destination] = distances[route.gateway] + route.distance;
				predecessors[route.destination] = route.gateway;
			}
		}
	}

	// Détection des cycles de poids négatif
	for (const route of routes) {
		if (distances[route.gateway] + route.distance < distances[route.destination]) {
			console.log("Graph contains a negative-weight cycle");
			return null;
		}
	}

	return { distances, predecessors };
}

module.exports = bellmanFord;
