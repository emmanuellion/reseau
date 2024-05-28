package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
	"strings"
)

// RoutingTable represents a simple routing table
type RoutingTable struct {
	Routes map[string]string
}

// Edge represents an edge in the graph
type Edge struct {
	Source, Destination string
	Weight              int
}

// BellmanFord algorithm to find the shortest path
func BellmanFord(edges []Edge, vertices []string, start string) (map[string]int, map[string]string, error) {
	distance := make(map[string]int)
	predecessor := make(map[string]string)

	// Step 1: Initialize distances
	for _, vertex := range vertices {
		distance[vertex] = math.MaxInt64
	}
	distance[start] = 0

	// Step 2: Relax edges repeatedly
	for i := 1; i < len(vertices); i++ {
		for _, edge := range edges {
			if distance[edge.Source] != math.MaxInt64 && distance[edge.Source]+edge.Weight < distance[edge.Destination] {
				distance[edge.Destination] = distance[edge.Source] + edge.Weight
				predecessor[edge.Destination] = edge.Source
			}
		}
	}

	// Step 3: Check for negative-weight cycles
	for _, edge := range edges {
		if distance[edge.Source] != math.MaxInt64 && distance[edge.Source]+edge.Weight < distance[edge.Destination] {
			return nil, nil, fmt.Errorf("graph contains a negative-weight cycle")
		}
	}

	return distance, predecessor, nil
}

// PrintShortestPath prints the shortest path from the start to the end vertex
func PrintShortestPath(predecessors map[string]string, start, end string) {
	path := []string{}
	for at := end; at != ""; at = predecessors[at] {
		path = append([]string{at}, path...)
		if at == start {
			break
		}
	}
	if path[0] == start {
		fmt.Println("Shortest path:", strings.Join(path, " -> "))
	} else {
		fmt.Println("No path from", start, "to", end)
	}
}

// Server function to start a TCP server
func startServer(address string, done chan bool) {
	listener, err := net.Listen("tcp", address)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
	defer listener.Close()
	done <- true
	log.Println("Server started, listening on", address)
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}
		go handleConnection(conn)
	}
}

// Handle server connection
func handleConnection(conn net.Conn) {
	defer conn.Close()
	buffer := make([]byte, 1024)
	n, err := conn.Read(buffer)
	if err != nil {
		log.Printf("Error reading from connection: %v", err)
		return
	}
	message := string(buffer[:n])
	log.Println("Received:", message)

	if strings.HasPrefix(message, "{") {
		var routingTable RoutingTable
		err = json.Unmarshal(buffer[:n], &routingTable)
		if err != nil {
			log.Printf("Error unmarshalling routing table: %v", err)
			return
		}
		log.Println("Routing Table:", routingTable)
	} else {
		log.Println("Basic message:", message)
	}
}

// Client function to send a message to the server
func startClient(address string, message string, done chan bool) {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		log.Fatalf("Error connecting to server: %v", err)
	}
	defer conn.Close()

	_, err = conn.Write([]byte(message))
	if err != nil {
		log.Fatalf("Error sending message: %v", err)
	}
	done <- true
}

func main() {
	// Addresses for each router and their respective servers
	addresses := map[string]string{
		"R1": "localhost:8081",
		"R2": "localhost:8082",
		"R3": "localhost:8083",
		"R4": "localhost:8084",
		"R5": "localhost:8085",
		"R6": "localhost:8086",
	}

	serverDone := make(map[string]chan bool)
	clientDone := make(map[string]chan bool)

	// Start servers for each router
	for router, address := range addresses {
		serverDone[router] = make(chan bool)
		go startServer(address, serverDone[router])
		<-serverDone[router] // Wait for server to start
	}

	// Initial routing tables for each router
	routingTables := map[string]RoutingTable{
		"R1": {Routes: map[string]string{"192.168.1.0/24": "192.168.1.254"}},
		"R2": {Routes: map[string]string{"10.1.1.0/30": "10.1.1.1", "10.1.2.0/30": "10.1.2.1", "10.1.3.0/30": "10.1.3.1", "10.1.4.0/30": "10.1.4.1"}},
		"R3": {Routes: map[string]string{"10.1.2.0/30": "10.1.2.2", "10.1.5.0/30": "10.1.5.1"}},
		"R4": {Routes: map[string]string{"10.1.3.0/30": "10.1.3.2", "10.1.6.0/30": "10.1.6.1"}},
		"R5": {Routes: map[string]string{"10.1.4.0/30": "10.1.4.2", "10.1.5.0/30": "10.1.5.2", "10.1.6.0/30": "10.1.6.2", "10.1.7.0/30": "10.1.7.1"}},
		"R6": {Routes: map[string]string{"10.1.7.0/30": "10.1.7.2", "172.16.180.0/24": "172.16.180.251"}},
	}

	// Simulate the exchange of routing tables using RIP
	for router, routingTable := range routingTables {
		clientDone[router] = make(chan bool)
		routingTableJSON, err := json.Marshal(routingTable)
		if err != nil {
			log.Fatalf("Error marshalling routing table for %s: %v", router, err)
		}
		go startClient(addresses[router], string(routingTableJSON), clientDone[router])
		<-clientDone[router] // Wait for client to finish
	}

	log.Println("Routing table communication completed")

	// Step 3: Bellman-Ford algorithm
	graphExamples := []struct {
		vertices []string
		edges    []Edge
		start    string
		end      string
	}{
		{
			vertices: []string{"A", "B", "C", "D"},
			edges: []Edge{
				{"A", "B", 1},
				{"A", "C", 4},
				{"B", "C", 2},
				{"B", "D", 5},
				{"C", "D", 1},
			},
			start: "A",
			end:   "D",
		},
	}

	for i, example := range graphExamples {
		distance, predecessor, err := BellmanFord(example.edges, example.vertices, example.start)
		if err != nil {
			log.Fatalf("Error running Bellman-Ford algorithm on example %d: %v", i+1, err)
		} else {
			log.Printf("Example %d: Bellman-Ford algorithm completed", i+1)
			log.Printf("Example %d: Shortest distances: %v", i+1, distance)
			log.Printf("Example %d: Predecessors: %v", i+1, predecessor)
			fmt.Printf("Example %d: ", i+1)
			PrintShortestPath(predecessor, example.start, example.end)
		}
	}
}
