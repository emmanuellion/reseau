import socket
import threading
import time

def router_thread(router_id, send_data=None):
    if router_id == 'R1':
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind(('localhost', 8081))
        server_socket.listen(1)
        conn, addr = server_socket.accept()
        data = conn.recv(1024)
        print(f"R1 a reçu: {data.decode()}")
        conn.close()
        server_socket.close()
        
    elif router_id == 'R2':
        time.sleep(0.5)  # Attendre que R1 soit prêt
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_socket.connect(('localhost', 8081))
        client_socket.sendall(send_data.encode())
        client_socket.close()

if __name__ == "__main__":
    r1 = threading.Thread(target=router_thread, args=('R1',))
    r2 = threading.Thread(target=router_thread, args=('R2', 'table de routage'))
    
    r1.start()
    r2.start()
    
    r1.join()
    r2.join()

