import React, {useContext, useEffect, useRef, useState} from 'react'
import {FocusContext, GenericListView, HBox, makeClassNames, useAutofocusRefWhenSelected, VBox} from '../common/layout.js'
import {useActionScope} from '../common/actions.js'
import {StorageContext, useQuery} from '../common/storage2.js'

const NoteItemView = ({item, focusName, selected}) => {
    const hbox = useRef()
    useAutofocusRefWhenSelected(hbox,selected,focusName)
    const cls = makeClassNames({
        'hbox':true,
        'todo-item':true,
        'deleted':item.deleted,
    })
    return <div ref={hbox} className={cls} tabIndex={0}>{item.title}</div>
}

const CSS = makeClassNames

export const NotesListView = ({query, project, selectedNote, setSelectedNote}) => {
    const storage = useContext(StorageContext)
    const addNote = () => {
        setSelectedNote(storage.makeObject('note',{
            title:'my new note',
            project:project,
        }))
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
    const notes = useQuery(query)
    return <div className={"left-panel"} onKeyDown={handlers.onKeyDown}>
        {notes.map((n,i)=>{
            const selected = (n === selectedNote)
            return <div key={i}
                        className={CSS({selected,hbox:true})}
                        tabIndex={0}
                        onClick={()=>setSelectedNote(n)}>
                {n.title}
            </div>
        })}
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
