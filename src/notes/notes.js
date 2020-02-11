import React, {useContext, useEffect, useRef, useState} from 'react'
import {FocusContext, HBox, CSS} from '../common/layout.js'
import {ActionContext, useActionScope} from '../common/actions.js'
import {StorageContext, useDraft, useQuery} from '../common/storage2.js'

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

export const NotesListView = ({query, project, note, setNote}) => {
    const storage = useContext(StorageContext)
    const fm = useContext(FocusContext)
    const notes = useQuery(query)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => fm.setMasterFocus('projects'),
        'focus-next-master': () => fm.setMasterFocus('editor'),
        'delete-note':(e)=> storage.updateObject('note',note,'deleted',!note.deleted),
        'move-selection-prev': () => {
            const index = notes.indexOf(note)
            if (index > 0) {
                setNote(notes[index - 1])
            }
        },
        'move-selection-next': () => {
            const index = notes.indexOf(note)
            if (index < notes.length - 1) {
                setNote(notes[index + 1])
            }
        },
    })
    useEffect(()=>{
        const acquire = () => {
            if(fm.getMasterFocus() === 'notes') {
                const n = notes.indexOf(note)
                if(n < 0 && notes.length > 0) setNote(notes[0])
            }
        }
        fm.on(acquire)
        acquire()
        return ()=>fm.off(acquire)
    })
    return <div className={"left-panel panel"} onKeyDown={handlers.onKeyDown}>
        {notes.map((n,i)=>{
            return <div key={i}
                        className={CSS({
                            selected:n === note,
                            deleted:n.deleted,
                            'note-item':true,
                            hbox:true,
                            item:true,
                        })}
                        tabIndex={0}
                        onClick={()=>setNote(n)}>
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
    if (!note) {
        return <div className={'note-editor'}>no note selected</div>
    } else {
        return <RealNoteEditor note={note}/>
    }
}

export const RealNoteEditor = ({note}) => {
    const [draft, update, save] = useDraft('note',note)
    return <div className={'note-editor vbox'}>
        <input value={draft.title} onChange={(e)=>update('title',e.target.value)}/>
        <textarea className={'grow'} value={draft.body} onChange={(e)=>update('body',e.target.value)}/>
        <button onClick={save}>save</button>
    </div>
}
