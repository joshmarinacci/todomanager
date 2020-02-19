import React, {useContext, useEffect, useRef, useState} from 'react'
import {ActionContext, ActionManager, useActionScope} from '../common/actions.js'
import {StorageContext, Storage} from '../common/storage2.js'
import {
    ColumnResizer,
    FocusContext,
    PopupContainer,
    Toolbar
} from '../common/layout.js'
import {ProjectsListView} from './projects.js'
import {ItemsListView} from './items.js'
import './todo.css'
import {AuthContext, BASE_URL} from '../auth.js'
import {
    addProject,
    copyFromServer,
    copyToServer, createQueryForProject,
    deleteAll,
    deleteAllLocal,
    deleteAllProjects,
    deleteOnServer,
    dumpServer
} from './actions.js'

const storage = new Storage()
storage.defineTable({
    name:'project',
    schema: {
        title: { type: String},
        special: { type:Boolean},
        name: { type: String},
        sortOrder: {type:Number},
    },
    fixer: (p,table,sto)=>{
        if(!p.sortOrder) {
            if(p.special && p.name === 'today') return storage.updateObject('project',p,'sortOrder',0)
            if(p.special && p.name === 'trash') return storage.updateObject('project',p,'sortOrder',Number.MAX_SAFE_INTEGER)

            const data = sto.find(table,f=>true,(a,b)=>a.sortOrder-b.sortOrder)
            const last = data[data.length-1]
            const prev = data[data.length-2]
            const newsort = (last.sortOrder+prev.sortOrder)/2
            p.sortOrder = newsort
            sto.updateObject(table,p,'sortOrder',newsort)
        }
    }
})
storage.defineTable({
    name:'item',
    schema:{
        title: { type: String},
        project: { type: String},
        completed: { type:Boolean},
        today: { type: Boolean},
        notes: { type: String},
        deleted: { type: Boolean},
        editing: { type: Boolean},
    }
})

function makeInitialData() {
    storage.makeObject('project', {title: 'today', special: true, name:'today'})
    storage.makeObject('project', {title: 'trash', special: true, name:'trash'})
}
storage.init('todos',makeInitialData).then(()=>{
    console.log("todos storage is loaded")
})


const SearchBox = ({searching, setSearching, setQuery}) => {
    const storage = useContext(StorageContext)
    const [searchText, setSearchText] = useState("")
    const searchBox = useRef()
    const fm = useContext(FocusContext)
    const handlers = useActionScope('search',{
        'exit-search': () => {
            fm.popMasterFocus()
            setSearchText("")
            setSearching(false)
        }
    })
    useEffect(()=>{
        if(searching && searchBox.current) {
            if(fm.getMasterFocus() !== 'search') fm.pushMasterFocus('search')
            searchBox.current.focus()
        }
    },[searching])
    const updateSearchText = (e) => {
        const txt = e.target.value
        setSearchText(txt)
        if(txt.length > 0) {
            setQuery(storage.createQuery({table:'item',find:(it)=>it.title.includes(txt)}))
        } else {
            setQuery(storage.createEmptyQuery())
        }
    }
    const startSearch = () => {
        fm.pushMasterFocus('search')
        setSearching(true)
    }

    return <>
        <input type="search" ref={searchBox} placeholder={'search here'} value={searchText}
               onClick={startSearch}
               onChange={updateSearchText}
               onKeyDown={handlers.onKeyDown}
        />
    </>
}

export const TodoApp = () => {
    const am = new ActionManager()
    am.registerKeys([

        //navigation
        {action: 'shift-selection-prev', key:'ArrowUp', alt:true, scope:'list'},
        {action: 'shift-selection-prev', key:'ArrowUp', meta:true, scope:'list'},
        {action: 'shift-selection-next', key:'ArrowDown', alt:true, scope:'list'},
        {action: 'shift-selection-next', key:'ArrowDown', meta:true, scope:'list'},
        {action: 'move-selection-prev', key: 'ArrowUp', scope: ['list','popup']},
        {action: 'move-selection-prev', key: 'k', scope: ['list','popup']},
        {action: 'move-selection-next', key: 'ArrowDown', scope: ['list','popup']},
        {action: 'move-selection-next', key: 'j', scope: ['list','popup']},
        {action: 'focus-prev-master',  key:'ArrowLeft',  scope:'list'  },
        {action: 'focus-next-master',  key:'ArrowRight',  scope:'list'  },

        //list scope
        {action: 'add-item-to-target-list',  scope:'list',  key: 'N',  control:true,  shift:true,  },
        {action: 'add-item-to-target-list',  scope:'list',  key: 'N',  alt:true, },
        {action: 'toggle-completed', scope:'list', key: 'period',  control:true},
        {action: 'toggle-completed', scope: 'list', key: 'period',  alt:true },
        {action: 'toggle-today',  scope: 'list', key:'t',  control:true,  shift:true },
        {action: 'toggle-today',  scope:'list',  key:'t',  alt:true },
        {action: 'delete-item',   scope:'list',  key:'backspace' },
        {action: 'delete-item',   scope:'list',  key:'delete' },
        {action: 'move-item',     scope:'list',  key:'m'},

        //item scope
        {action: 'edit-item',   scope:'item',  key: 'Enter' },
        {action: 'exit-edit-item',   key:'escape', scope:'edit-item',   },

        //search scope
        {action:'start-search', key: 'f', meta:true, scope:'global', os:['mac']},
        {action:'start-search', key: 'f', control:true, scope:'global', os:['windows','linux']},
        {action:'exit-search', key: 'escape', scope:'search' },

        // popup-list scope
        {action:'select-menu-item', scope:['popup'], key:'enter',},
        {action:'exit-menu-item', scope:['popup'], key:'escape',},

    ])

    return <ActionContext.Provider value={am}>
        <StorageContext.Provider value={storage}>
            <TodoAppContent/>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const TodoAppContent = () => {
    const auth = useContext(AuthContext)
    const storage = useContext(StorageContext)
    const [selectedProject,setSelectedProject] = useState(null)
    const [query,setQuery] = useState(()=> createQueryForProject(storage,selectedProject))
    const changeSelectedProject = (project) => {
        setSelectedProject(project)
        setQuery(createQueryForProject(storage,project))
    }
    const [searching, setSearching] = useState(false)
    const endSearching = () => {
        changeSelectedProject(selectedProject)
        setSearching(false)
    }
    const handlers = useActionScope('list',{
        'find-item': () => setSearching(true)
    })

    const am = useContext(ActionContext)
    am.registerAction('global','add-project',()=> addProject(storage).then(obj => setSelectedProject(obj)))
    am.registerAction('global','start-search',()=>setSearching(true))

    const [loggedIn,setLoggedIn] = useState(auth.isLoggedIn())

    //only set the column widths here.
    const [c1,setC1] = useState(200)
    const [c2,setC2] = useState(500)
    const style = {
        gridTemplateColumns: `${c1}px 0px ${c2-c1}px 0px 1fr`,
     }

    return <div style={style} className={'todoapp-grid'}>
        <Toolbar className={'grid-toolbar'}>
            <SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>
            <button disabled={!loggedIn} onClick={()=>copyToServer(auth,storage)}>copy to server</button>
            <button disabled={!loggedIn} onClick={()=>copyFromServer(auth,storage)}>merge from server</button>
            <button disabled={!loggedIn} onClick={()=>deleteOnServer(auth,storage)}>delete on server</button>
            <button onClick={()=>deleteAll(storage)}>delete all notes</button>
            <button onClick={()=>deleteAllProjects(storage)}>delete all projects</button>
            <button onClick={()=>deleteAllLocal(storage)}>delete all local </button>
            <button onClick={()=>dumpServer(storage)}>dump server</button>
        </Toolbar>
        <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject}/>
        <ColumnResizer width={c1} setWidth={setC1}/>
        <ItemsListView query={query} project={selectedProject}/>
        <ColumnResizer width={c2} setWidth={setC2}/>
        <PopupContainer/>
    </div>

}

