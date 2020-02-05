import React, {useContext, useEffect, useRef, useState} from 'react'
import {FocusContext, HBox, CSS} from '../common/layout.js'
import {ActionContext, useActionScope} from '../common/actions.js'
import {StorageContext, useQuery} from '../common/storage2.js'

const AddNoteButton = ({project}) => {
    const am = useContext(ActionContext)
    const addNote = () => am.runAction('global','add-note-to-target-list')
    if(project && project.special && project.title === 'trash') return ""
    return <button onClick={addNote}>add</button>
}

const EmptyTrashButton = ({project}) => {
    const am = useContext(ActionContext)
    const empty = () => am.runAction('global','empty-trash')
    if(project && project.special && project.title === 'trash') return <button onClick={empty}>empty</button>
    return ""
}

export const NotesListView = ({query, project, selectedNote, setSelectedNote}) => {
    const storage = useContext(StorageContext)
    const fm = useContext(FocusContext)
    const notes = useQuery(query)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => fm.setMasterFocus('projects'),
        'focus-next-master': () => fm.setMasterFocus('editor'),
        'delete-note':(e)=> {
            storage.updateObject('note',selectedNote,'deleted',!selectedNote.deleted)
        },
        'move-selection-prev': () => {
            const index = notes.indexOf(selectedNote)
            if (index > 0) {
                setSelectedNote(notes[index - 1])
            }
        },
        'move-selection-next': () => {
            const index = notes.indexOf(selectedNote)
            if (index < notes.length - 1) {
                setSelectedNote(notes[index + 1])
            }
        },
    })
    return <div className={"left-panel"} onKeyDown={handlers.onKeyDown}>
        {notes.map((n,i)=>{
            return <div key={i}
                        className={CSS({
                            selected:n === selectedNote,
                            deleted:n.deleted,
                            'note-item':true,
                            hbox:true,
                        })}
                        tabIndex={0}
                        onClick={()=>setSelectedNote(n)}>
                {n.title}
            </div>
        })}
        <HBox>
            <AddNoteButton project={project}/>
            <EmptyTrashButton project={project}/>
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
