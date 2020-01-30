import React, {useContext, useRef, useState} from 'react'
import {StorageContext, useQuery} from './storage.js'
import {FocusContext, GenericListView, HBox, VBox} from './layout.js'
import {useActionScope} from './actions.js'

const NoteItemView = ({item, focusName, selected}) => {
    const hbox = useRef()
    return <div ref={hbox}
                // tabIndex={0}
                // className={cls}
                // onKeyDown={handlers.onKeyDown}
    >
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
        console.log("made a note",note)
        setSel(note)
    }
    const fm = useContext(FocusContext)
    const [notes] = useQuery(query)
    console.log("query",query,'made',notes)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
            fm.setMasterFocus('projects')
        },
        'focus-next-master': () => {
        },
        // 'add-item-to-target-list':addItem,
        'delete-note':(e)=> {
            // if(e.target.classList.contains('todo-item')) {
            //     storage.update('items',sel,'deleted',!sel.deleted)
            // }
        },
    })
    // let emptyTrash = ""
    // const emptyTrashAction = () => {
    //     storage.delete('items',(it)=>it.deleted)
    // }
    let addButton = <button onClick={addNote}>add</button>
    // if(project && project.special && project.title === 'trash') {
    //     emptyTrash = <button onClick={emptyTrashAction}>empty</button>
    //     addButton = ""
    // }
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
            {/*{emptyTrash}*/}
            {addButton}
        </HBox>
    </div>
}
