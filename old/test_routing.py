import unittest
import threading
from routing import router_thread

class TestRouting(unittest.TestCase):
    def test_routing_table_exchange(self):
        r1 = threading.Thread(target=router_thread, args=('R1',))
        r2 = threading.Thread(target=router_thread, args=('R2', 'table de routage'))
        
        r1.start()
        r2.start()
        
        r1.join()
        r2.join()

if __name__ == '__main__':
    unittest.main()

