import unittest
import threading
from server import server_thread
from client import client_thread

class TestClientServer(unittest.TestCase):
    def test_client_server_communication(self):
        server = threading.Thread(target=server_thread)
        server.start()
        
        client = threading.Thread(target=client_thread)
        client.start()
        
        server.join()
        client.join()

if __name__ == '__main__':
    unittest.main()

