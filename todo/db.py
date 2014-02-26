import pymysql
from pymysql.err import IntegrityError, InterfaceError
import cherrypy
import re
from random import randint
from todo import config, crypto

_db   = None
_matcher = re.compile(r'.*todo_sess=(\w{30}).*')

class Session(object):
    """
    Represents a http session (since CherryPy isn't good at it)
    """
    
    def __init__(self):
        """
        Make a new Session
        """
        self.s_id = None

        # set the s_id property if a cookie was found
        if 'Cookie' in cherrypy.request.headers:
            c = _matcher.match(cherrypy.request.headers['Cookie'])
            if c:
                c = c.group(1)
                self.s_id = c
                return
        self._new_session()
    
    def _store_session(self):
        ret = 0
        try:
            curs = _db.cursor()
            ret = curs.execute("INSERT INTO sessions (unique_id) VALUES (%s)", (self.s_id,))
        except IntegrityError:
            return False
        return True

    def _new_session(self):
        """
        Generate a new cookie to represent a session
        """
        cookie = ''
        for x in range(30):
            cookie += chr(randint(65, 90))
        cherrypy.response.headers['Set-Cookie'] = 'todo_sess=' + cookie
        self.s_id = cookie
        if not self._store_session():
            # if the ID already exists, try again
            self._new_session()

    def has_login(self):
        """
        Returns True if this Session is logged in
        """
        _connect()
        curs = _db.cursor()
        curs.execute('SELECT 1 FROM sessions WHERE has_login AND unique_id = %s', (self.s_id,))
        return True if curs.fetchone() else False
    
    def mark_login(self):
        """
        Mark this session as logged in
        """
        curs = _db.cursor()
        curs.execute('UPDATE sessions SET has_login = TRUE WHERE unique_id = %s', (self.s_id,))
        _db.commit()
    
    def logout(self):
        """
        Mark this session as logged out
        """
        curs = _db.cursor()
        curs.execute('UPDATE sessions SET has_login = FALSE WHERE unique_id = %s', (self.s_id,))
        _db.commit()

def _connect(force=False):
    """
    ensure that _db points to an active database connection
    """
    global _db
    try:
        if force or not _db or not _db.ping():
            print(dict(config['mysql']))
            mysql = config['mysql']
            host   = mysql['host']
            port   = mysql['port']
            user   = mysql['username']
            passwd = mysql['password']
            db     = mysql['database']

            _db = pymysql.connect(
                    host   = host,
                    port   = int(port),
                    user   = user,
                    passwd = passwd,
                    db     = db
            )
        _db.autocommit(True)
    except Exception as  e:
        import traceback
        cherrypy.log(traceback.format_exc())
        if not force:
            _connect(force=True)

def _ensure_session():
    """
    Ensure that the current request has a session object
    """
    _connect()
    if not hasattr(cherrypy.request, 'session'):
        cherrypy.request.session = Session()

def has_login():
    """
        Returns True if has login, else False
    """
    _connect()
    _ensure_session()
    if cherrypy.request.session.has_login():
        print("Got login!")
        return True
    print("No login")
    return False

def is_password(passwd):
    """
        Returns True if the given string is the password, else False
    """
    return config['site']['hash'] == crypto.hash(passwd, config['site']['secret'])

def mark_login():
    _connect()
    _ensure_session()
    cherrypy.request.session.mark_login()

def logout():
    _connect()
    _ensure_session()
    cherrypy.request.session.logout()

def get_todos():
    """
        Returns
        [(id, importance, title, body, days_left, ts, urgency), ...]
    """
    _connect()
    curs = _db.cursor()
    curs.execute("SELECT * FROM ordered_todos")
    return curs.fetchall()

def get_importances():
    """
        Returns
        [(desc, color, id), ...]
    """
    _connect()
    curs = _db.cursor()
    curs.execute("SELECT `desc`, `color`, `id` FROM importances")
    return curs.fetchall()

def insert_todo(title, days, imp, desc):
    _connect()
    # protect against inserting invalid things
    if not str(days).isdigit() or not str(imp).isdigit():
        return
    curs = _db.cursor()
    curs.execute("INSERT INTO todos (title, days, importance, body) VALUES (%s, %s, %s, %s)", (
                                title,
                                days,
                                imp,
                                desc))
    _db.commit()

def hide_todo(idnum):
    _connect()
    idnum = int(idnum)
    curs = _db.cursor()
    curs.execute("UPDATE todos SET hidden = TRUE WHERE id = %s", (idnum,))
    curs.execute("INSERT INTO recently_hidden (todo_id) VALUES (%s)", (idnum,))
    _db.commit()

def unhide():
    _connect()
    curs = _db.cursor()
    curs.execute("SELECT id, todo_id FROM recently_hidden ORDER BY id DESC LIMIT 1")
    rh_id, todo_id = curs.fetchone()
    curs.execute("UPDATE todos SET hidden = FALSE WHERE id = %s", (todo_id,))
    curs.execute("DELETE FROM recently_hidden WHERE id = %s", (rh_id,))
    _db.commit()

_connect()
