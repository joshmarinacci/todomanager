import React, {useContext, useRef, useState} from 'react'
import {StorageContext, useQuery} from './storage.js'
import {FocusContext, GenericListView, HBox, makeClassNames, VBox} from './layout.js'
import {useActionScope} from './actions.js'

const NoteItemView = ({item, focusName, selected}) => {
    const hbox = useRef()
    const cls = makeClassNames({
        'hbox':true,
        'todo-item':true,
        'deleted':item.deleted,
    })
    return <div ref={hbox} className={cls}>
        {item.title}
        some stuff is here
    </div>

}

export const NotesListView = ({query, project}) => {
    const storage = useContext(StorageContext)
    const [sel, setSel] = useState(null)
    const addNote = () => {
        const note = storage.insert('notes', {
            title: 'new note',
            tags: [],
            body:"",
            deleted:false,
            project:project.id,
            lastEditedTimestamp:Date.now(),
        })
        setSel(note)
    }
    const fm = useContext(FocusContext)
    const [notes] = useQuery(query)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
            fm.setMasterFocus('projects')
        },
        'focus-next-master': () => {
        },
        'add-note-to-target-list':addNote,
        'delete-note':(e)=> {
            storage.update('notes',sel,'deleted',!sel.deleted)
        },
    })
    let emptyTrash = ""
    const emptyTrashAction = () => {
        storage.delete('notes',(it)=>it.deleted)
    }
    let addButton = <button onClick={addNote}>add</button>
    if(project && project.special && project.title === 'trash') {
        emptyTrash = <button onClick={emptyTrashAction}>empty</button>
        addButton = ""
    }
    return <div  onKeyDown={handlers.onKeyDown} className={'notes-list-view'}>
        <GenericListView
            ItemTemplate={NoteItemView}
            selectedItem={sel}
            setSelectedItem={setSel}
            focusName={'notes'}
            query={query}
            // autoFocus={false}
        />
        <HBox>
            {emptyTrash}
            {addButton}
        </HBox>
    </div>
}
