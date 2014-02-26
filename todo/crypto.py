import hashlib

def hash(s, salt):
    """
    Hash the given string s with the string salt
    returns the hexdigest of SHA1(SHA1(s + salt) + salt)
    """
    pass1 = hashlib.sha1()
    pass1.update(s.encode('utf-8'))
    pass1.update(salt.encode('utf-8'))
    pass2 = hashlib.sha1()
    pass2.update(pass1.digest())
    pass2.update(salt.encode('utf-8'))
    return pass2.hexdigest()
