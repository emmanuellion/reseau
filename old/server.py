import socket
import threading

def server_thread():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(('localhost', 8080))
    server_socket.listen(1)
    print("Serveur en écoute sur le port 8080...")
    
    conn, addr = server_socket.accept()
    print(f"Connexion acceptée de {addr}")
    
    data = conn.recv(1024)
    print(f"Reçu du client: {data.decode()}")
    
    conn.close()
    server_socket.close()

if __name__ == "__main__":
    server_thread()

