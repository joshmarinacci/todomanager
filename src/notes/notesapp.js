import {SortOrder, Storage, StorageContext, useQuery} from '../common/storage2.js'
import {ActionContext, ActionManager, AM, useActionScope} from '../common/actions.js'
import {
    ColumnResizer,
    FocusContext,
    GenericListView,
    PopupContainer,
    Toolbar,
    useColumns2,
    VBox
} from '../common/layout.js'
import React, {useContext, useState} from 'react'
import './notes.css'
import {NoteEditor, NotesListView} from './notes.js'
import {addNoteToList, queryForProject, removeAllNotesDeletedNotes} from './actions.js'

const storage = new Storage()
const PROJECT = storage.defineTable({
    name:'project',
    schema: {
        title:{
            type:String,
            default:'untitled'
        },
        deleted:{
            type:Boolean,
            default:false,
        },
        special:{
            type:Boolean,
            default:false,
        },
    },
})
const NOTE = storage.defineTable({
    name:'note',
    schema: {
        title:{
            type:String,
            default:'untitled',
        },
        body:{
            type:String,
            default:'empty',
        },
        deleted:{
            type:Boolean,
            default:false,
        },
        order: {
            type:SortOrder,
            default:false,
        },
        lastEdited:{
            type:Date,
            default:()=>Date.now(),
        },
        project:PROJECT,
    }
})
function generate(storage) {
    console.log("making new data in storage")
    storage.makeObject('project',{title:'everything', special:true})
    storage.makeObject('project',{title:'better',special:false})
    storage.makeObject('project',{title:'best',special:false}).then(best => {
        storage.makeObject('note',   {title:'third object', body:'cool note', deleted:false, lastEdited: Date.now(), project:best})
    })
    storage.makeObject('project',{title:'good',special:false}).then(good => {
        console.log("got the good",good)
        storage.makeObject('project',{title:'trash',special:true})
        storage.makeObject('note',   {title:'first object', body:'cool note', deleted:false, lastEdited: Date.now(), project:good})
        storage.makeObject('note',   {title:'second object', body:'cool note', deleted:false, lastEdited: Date.now(), project:good})
    })
}
storage.init("notes",generate).then(()=>{
    console.log("storage is loaded")
})


export const NotesApp = () => {
    const amParent = useContext(ActionContext)
    const am = new ActionManager(amParent)
    am.registerKeys([
        //global. anywhere in the app
        {action: 'add-note-to-target-list',  scope:'global',  key: 'N',  control:true,  shift:true, },
        {action: 'add-note-to-target-list',  scope:'global',  key: 'N',  alt:true, },

        //navigation
        {action: 'shift-selection-prev', key:'ArrowUp', alt:true, scope:'list'},
        {action: 'shift-selection-next', key:'ArrowDown', alt:true, scope:'list'},

        //list scope
        {action: 'delete-note',   scope:'list',  key:'backspace' },
        {action: 'move-selected-notes', key: 'm', scope: 'list'},

        //item scope
        {action: 'edit-item',   key: 'Enter',  scope:'item', },
        {action: 'exit-edit-item',   key:'escape', scope:'edit-item', },
    ])

    return <ActionContext.Provider value={am}>
        <StorageContext.Provider value={storage}>
            <NotesAppContent/>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const ProjectsListView = ({query, proj, setProj}) => {
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list', {
        'focus-prev-master': () => {
        },
        'focus-next-master': () => {
            fm.setMasterFocus('notes')
        },
    })

        return <div className={"left-panel panel col1"} onKeyDown={handlers.onKeyDown}>
            <GenericListView
                query={query}
                autoFocus={true}
                focusName='projects'
                selectedItem={proj}
                setSelectedItem={setProj}
                ItemTemplate={ProjectItemView}
            />
    </div>
}

const ProjectItemView = ({item})=>{
    return <div  className='project-item'>{item.title}</div>
}

const NotesAppContent = ()=>{
    const actionManager = useContext(ActionContext)
    const storage = useContext(StorageContext)
    const [proj,setProj] = useState(null)
    const [query,setQuery] = useState(queryForProject(null,storage))
    const [note,setNote] = useState(null)

    const [allProjects] = useState(()=> storage.createQuery({ table:'project', find: p => true, }))

    const selectProject = (newProj) => {
        setProj(newProj)
        setQuery(queryForProject(newProj,storage))
    }
    actionManager.registerAction('global','add-note-to-target-list',()=> addNoteToList(storage,proj).then(note=>setNote(note)))
    actionManager.registerAction('global','empty-trash',()=> removeAllNotesDeletedNotes(storage))

    //only set the column widths here.
    const [c1,setC1, c2, setC2, style] = useColumns2(200,500)

    return <div style={style} className={'standard-grid'} onKeyDown={actionManager.globalOnKeyDownHandler()}>
        <Toolbar className={'grid-toolbar'}>
            <button>stuff</button>
        </Toolbar>
        <ProjectsListView query={allProjects} proj={proj} setProj={selectProject} nextFocusTarget={"notes"}/>
        <ColumnResizer width={c1} setWidth={setC1}/>
        <NotesListView query={query} project={proj}  note={note} setNote={setNote}/>
        <ColumnResizer width={c2} setWidth={setC2}/>
        <NoteEditor note={note}/>
        <PopupContainer/>
    </div>
}
