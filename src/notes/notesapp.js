import {SortOrder, StorageContext, Storage, useQuery} from '../common/storage2.js'
import {ActionContext, AM} from '../common/actions.js'
import {FocusContext, FocusManager, HBox, makeClassNames, VBox} from '../common/layout.js'
import React, {useContext, useEffect, useState} from 'react'
import './notes.css'
import {NoteEditor, NotesListView} from './notes.js'

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
    const good = storage.makeObject('project',{title:'good',special:false})
    storage.makeObject('project',{title:'better',special:false})
    const best = storage.makeObject('project',{title:'best',special:false})
    storage.makeObject('project',{title:'trash',special:true})
    storage.makeObject('note',   {title:'first object', body:'cool note', deleted:false, lastEdited: Date.now(), project:good})
    storage.makeObject('note',   {title:'second object', body:'cool note', deleted:false, lastEdited: Date.now(), project:good})
    storage.makeObject('note',   {title:'third object', body:'cool note', deleted:false, lastEdited: Date.now(), project:best})
}
storage.init("notes",generate).then(()=>{
    console.log("storage is loaded")
})


export const NotesApp = () => {
    AM.registerKeys([

        //navigation
        {action: 'shift-selection-prev', key:'ArrowUp', alt:true, scope:'list'},
        {action: 'shift-selection-next', key:'ArrowDown', alt:true, scope:'list'},
        {action: 'move-selection-prev', key: 'ArrowUp', scope: 'list'},
        {action: 'move-selection-prev', key: 'k', scope: 'list'},
        {action: 'move-selection-next', key: 'ArrowDown', scope: 'list'},
        {action: 'move-selection-next', key: 'j', scope: 'list'},
        {action: 'focus-prev-master',  key:'ArrowLeft',  scope:'list'  },
        {action: 'focus-next-master',  key:'ArrowRight',  scope:'list'  },

        //list scope
        {action: 'add-note-to-target-list',  scope:'list',  key: 'N',  control:true,  shift:true,  },
        {action: 'add-note-to-target-list',  scope:'list',  key: 'N',  alt:true, },
        {action: 'toggle-completed', scope:'list', key: 'period',  control:true},
        {action: 'toggle-completed', scope: 'list', key: 'period',  alt:true },
        {action: 'toggle-today',  scope: 'list', key:'t',  control:true,  shift:true },
        {action: 'toggle-today',  scope:'list',  key:'t',  alt:true },
        {action: 'delete-note',   scope:'list',  key:'backspace' },

        //item scope
        {action: 'edit-item',   key: 'Enter',  scope:'item', },
        {action: 'exit-edit-item',   key:'escape', scope:'edit-item', },
    ])

    return <ActionContext.Provider value={AM}>
        <StorageContext.Provider value={storage}>
            <FocusContext.Provider value={new FocusManager()}>
                <NotesAppContent/>
            </FocusContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const CSS = makeClassNames

const ProjectsListView = ({query, proj, setProj}) => {
    const projects = useQuery(query)
    return <div className={"left-panel"}>
        {projects.map((p,i)=>{
            const selected = (p === proj)
            return <div key={i}
                         className={CSS({selected,hbox:true})}
                         onClick={()=>setProj(p)}>
                {p.title}
            </div>
        })}
    </div>
}

const NotesAppContent = ()=>{
    const storage = useContext(StorageContext)
    const byLastEdited = (a,b)=> a.lastEdited-b.lastEdited
    function calcNewQuery(proj) {
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
    const [proj,setProj] = useState(null)
    const [query,setQuery] = useState(calcNewQuery(null))
    const [selectedNote, setSelectedNote] = useState(null)

    const [allProjects] = useState(()=>{
        return storage.createQuery({
            table:'project',
            find: p => true,
        })
    })

    const changeSelectedProject = (newProj) => {
        setProj(newProj)
        setQuery(calcNewQuery(newProj))
    }
    return <VBox className={'notesapp-grid'}>
        <ProjectsListView query={allProjects} proj={proj} setProj={changeSelectedProject} nextFocusTarget={"notes"}/>
        <NotesListView query={query} project={proj} selectedNote={selectedNote} setSelectedNote={setSelectedNote}/>
        <NoteEditor note={selectedNote}/>
    </VBox>
}
