import React, {useContext, useEffect, useRef, useState} from 'react'
import {StorageContext, useQuery} from './storage.js'
import {FocusContext, GenericListView, HBox, makeClassNames, VBox} from './layout.js'
import {useActionScope} from './actions.js'

const NoteItemView = ({item, focusName, selected}) => {
    const hbox = useRef()
    const fm = useContext(FocusContext)
    useEffect(() => {
        const check = () => {
            if (hbox.current && selected && fm.getMasterFocus() === focusName) {
                hbox.current.focus()
            }
        }
        check()
        fm.on(check)
        return ()=>fm.off(check)
    })
    const cls = makeClassNames({
        'hbox':true,
        'todo-item':true,
        'deleted':item.deleted,
    })
    return <div ref={hbox} className={cls} tabIndex={0}>
        {item.title}
    </div>

}

export const NotesListView = ({query, project, selectedNote, setSelectedNote}) => {
    const storage = useContext(StorageContext)
    const addNote = () => {
        const note = storage.insert('notes', {
            title: 'my note',
            tags: [],
            body:"some cool text",
            deleted:false,
            project:project.id,
            lastEditedTimestamp:Date.now(),
        })
        setSelectedNote(note)
    }
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
            fm.setMasterFocus('projects')
        },
        'focus-next-master': () => {
            fm.setMasterFocus('editor')
        },
        'add-note-to-target-list':addNote,
        'delete-note':(e)=> {
            storage.update('notes',selectedNote,'deleted',!selectedNote.deleted)
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
            selectedItem={selectedNote}
            setSelectedItem={setSelectedNote}
            focusName={'notes'}
            query={query}
            autoFocus={false}
        />
        <HBox>
            {emptyTrash}
            {addButton}
        </HBox>
    </div>
}


export const NoteEditor = ({note}) => {
    const storage = useContext(StorageContext)
    const [body,setBody] = useState(note?note.body:"")
    const [title,setTitle] = useState(note?note.title:"")
    const changedBody = (e) => {
        storage.update('notes',note,'body',e.target.value)
        setBody(e.target.value)
    }
    const changedTitle = (e) => {
        storage.update('notes',note,'title',e.target.value)
        setTitle(e.target.value)
    }
    useEffect(()=>{
        setBody(note?note.body:"")
        setTitle(note?note.title:"")
    },[note])
    const editor = useRef()
    const input = useRef()
    const fm = useContext(FocusContext)
    useEffect(() => {
        const check = () => {
            if (fm.getMasterFocus() === 'editor' && input.current) {
                console.log("grabbing editor the focus")
                input.current.focus()
            }
        }
        check()
        fm.on(check)
        return ()=>fm.off(check)
    },[note])
    if(note) {
        return <div className={'note-editor vbox'}>
            <input ref={input} value={title} onChange={changedTitle}/>
            <textarea ref={editor} className={'grow'} value={body} onChange={changedBody}/>
        </div>
    }
    return <div className={'note-editor'}>no note selected</div>
}
