import React, {useContext, useEffect, useRef} from 'react'
import {FocusContext, HBox, CSS, GenericListView} from '../common/layout.js'
import {ActionContext, useActionScope} from '../common/actions.js'
import {StorageContext, useDraft, useQuery} from '../common/storage2.js'
import {deleteNote} from './actions.js'

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

const NoteItem = ({item, isSelected})=>{
    return <div className={CSS({deleted:item.deleted,})}>{item.title}</div>
}

export const NotesListView = ({query, project, note, setNote}) => {
    const storage = useContext(StorageContext)
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => fm.setMasterFocus('projects'),
        'focus-next-master': () => fm.setMasterFocus('editor'),
        'delete-note':(e)=> deleteNote(storage,note),
    })
    return <div className={"left-panel panel"} onKeyDown={handlers.onKeyDown}>
        <GenericListView
            query={query}
            ItemTemplate={NoteItem}
            selectedItem={note}
            setSelectedItem={setNote}
            focusName={"notes"}
            autoFocus={true}
        />
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
