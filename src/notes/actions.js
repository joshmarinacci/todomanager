const byLastEdited = (a,b)=> a.lastEdited-b.lastEdited
export function queryForProject(proj,storage) {
    if(!proj) return storage.createEmptyQuery()
    if(!proj.special) return storage.createQuery({
        table:'note',
        find:n => n.project === proj,
        sort:byLastEdited,
    })
    if(proj.title === 'everything') return storage.createQuery({
        table:'note',
        find: n=> true,
        sort:byLastEdited,
    })
    if(proj.title === 'trash') return storage.createQuery({
        table:'note',
        find:n => n.deleted,
        sort:byLastEdited,
    })
    return storage.createEmptyQuery()
}

export function addNoteToList(storage,proj) {
    return storage.makeObject('note',{
        title:'my new note',
        project:proj,
    })
}
export function removeAllNotesDeletedNotes(storage) {
    storage.removeObjects('note',(n) => n.deleted)
}
export function deleteNote(storage,note) {
    storage.updateObject('note',note,'deleted',!note.deleted)
}
