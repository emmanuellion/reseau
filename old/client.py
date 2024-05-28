import socket
import time

def client_thread():
    time.sleep(0.5)  # Attendre que le serveur soit prêt
    
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect(('localhost', 8080))
    client_socket.sendall(b'hello')
    
    client_socket.close()

if __name__ == "__main__":
    client_thread()

