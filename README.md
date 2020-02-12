a simple todo app with

* query based views
* editable keystrokes
* syncing
* offline storage


doc server requirements

can listen to pubnub channels for updates
uses github auth
docs are scoped to username
docs are always referred to by a unique docid created by the server
you can specify any doctype, filename, mimetype, tag, or extension you want
you can search your own files by docid, doctype, filename, mimetype, tag, extension
you cannot search anyone else's files
you can get read only access to a file without being logged in
there is a version number in the url. currently set to 'latest'

fetch doc 
    https://docs.josh.earth/user/userid/doc/docid/
also fetch doc
    https://docs.josh.earth/user/userid/doc/docid/application/json/mydoc.json  
    this will return the file with the mimetype application/json and the filename mydoc.json
get doc info
    /user/userid/info/docid
login
    /auth/github/callback
search
    /user/userid/search?docid=&mimetype=&doctype=&tag=&
    searches through the files of the currently logged in user
    
    
    
more fixes:

in todo list:  m to move to a different project
design a new generic list that works better
focus back to the far left and choose between major apps
rename note groups with enter
focus back and forth in the note groups and notes list panels

