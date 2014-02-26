import sys
import os
from cherrypy.lib.reprconf import Parser

# put this path into scope
_path = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_path)
if not _parent in sys.path:
    sys.path.append(_parent)


# load the config file
_conf = os.path.join(_path, 'config.conf')

# load the application's config file
config = Parser().dict_from_file(_conf)


from todo.views import *
