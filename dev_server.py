"""
	Cherrypy development server for TODO
	Launches on port 8000 and listens on 0.0.0.0
"""

import cherrypy
import sys
import os

### Bring mulch into the system path
# get path of parent directory (containing mulch)
path = os.path.dirname(os.path.abspath(__file__))
# used later in the program, ignore for now
todo_path = os.path.join(path, 'todo')
if not path in sys.path:
	sys.path.append(path)

### update the cherrypy global config
cherrypy.config.update({
	'server.socket_host': '0.0.0.0',
	'server.socket_port': 8000
})
cherrypy.config.update(os.path.join(todo_path, 'config.conf'))

### create a new config to serve the static files
add_staticdir_conf = {
	'/': {
		'tools.staticdir.root':todo_path
	},
	'/static': {
		'tools.staticdir.on':True,
		'tools.staticdir.dir':'static'
	}
}

### mount and start the app
import todo

app = cherrypy.tree.mount(todo, '/')
app.merge(add_staticdir_conf)

cherrypy.quickstart(app)
