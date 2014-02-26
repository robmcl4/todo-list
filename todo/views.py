import cherrypy
from chameleon import PageTemplateLoader as Loader
import os
import sys
from todo import db, config


_path = os.path.dirname(os.path.abspath(__file__))
_templates = Loader(os.path.join(_path, 'templates'))

@cherrypy.expose
def index(passwd=None):
    if config['site']['require_login']:
        # if they are submitting a password, check it
        if passwd and db.is_password(passwd):
            db.mark_login()
            return _templates['redir_home.pt']()

        # If they are not logged in, show the login page!
        if not db.has_login():
            return _templates['login.pt']()

    # If they are logged in or it is not required, generate the page
    importances = db.get_importances()
    todos = db.get_todos()
    return _templates['index.pt'](importances=importances, todos=todos)

@cherrypy.expose
def insert_todo(title, days, imp, desc):
    db.insert_todo(title, days, imp, desc)
    return _templates['redir_home.pt']()

@cherrypy.expose
def hide_todo(idnum=None):
    db.hide_todo(idnum)
    return "OK"

@cherrypy.expose
def unhide():
    db.unhide()
    return "OK"

@cherrypy.expose
def logout():
    db.logout()
    return _templates['redir_home.pt']()
