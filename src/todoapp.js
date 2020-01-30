import React, {useContext, useEffect, useRef, useState} from 'react'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import {QueryStorage, StorageContext} from './storage.js'
import {FocusContext, FocusManager, HBox, Toolbar, VBox} from './layout.js'
import {ProjectsListView} from './projects.js'
import {ItemsListView} from './items.js'
import './todo.css'

const SearchBox = ({searching, setSearching, setQuery}) => {
    const storage = useContext(StorageContext)
    const [searchText, setSearchText] = useState("")
    const searchBox = useRef()
    const handlers = useActionScope('search',{
        'exit-search': () => {
            setSearchText("")
            setSearching(false)
        }
    })
    useEffect(()=>{
        if(searching && searchBox.current) {
            searchBox.current.focus()
        }
    },[searching])
    const updateSearchText = (e) => {
        const txt = e.target.value
        setSearchText(txt)
        if(txt.length > 0) {
            setQuery(storage.createQuery('items',(it)=>it.title.includes(txt)))
        } else {
            setQuery(storage.createEmptyQuery())
        }
    }

    return <>
        <input type="search" ref={searchBox} placeholder={'search here'} value={searchText} onChange={updateSearchText}
               onKeyDown={handlers.onKeyDown}
        />
    </>
}

export const TodoApp = () => {
    function makeInitialData() {
        storage.insert('projects', {title: 'today', special: true})
        const good = storage.insert('projects', {title: 'good'})
        const forget = storage.insert('projects', {title: 'forget'})
        storage.insert('projects', {title: 'trash', special: true})

        storage.insert("items", {
            id: 1,
            today: true,
            title: 'first, that I can forget',
            notes: 'this is some notes: https://www.mozilla.com/',
            tags: ['foo'],
            completed: false,
            deleted: false,
            project: forget.id
        })
        storage.insert("items", {
            id: 2,
            today: false,
            title: 'second is good',
            tags: ['foo', 'bar'],
            project: good.id,
            deleted: false,
            completed: true,
        })
        storage.insert("items", {
            id: 3,
            today: true,
            title: 'third is good',
            tags: ['bar'],
            project: good.id,
            deleted: false,
            completed: false,
        })
    }
    const storage = new QueryStorage("todo")
    storage.load().then(()=>{
        if(storage.isEmpty()) makeInitialData()
        const projs = storage.findAll('projects',()=>true)
        projs.forEach((proj) => {
            if(proj.title === 'trash') return proj.sortOrder = Number.MAX_SAFE_INTEGER
            if(proj.title === 'today') return proj.sortOrder = 0
            if(!('sortOrder' in proj)) {
                console.log("have to add a sort order")
                proj.sortOrder = Math.floor(Math.random()*10*1000*1000)
            }
        })
        const items = storage.findAll('items',()=>true)
        items.forEach(item => {
            if(!('sortOrder' in item)) {
                console.log("adding a sort order")
                item.sortOrder = Math.floor(Math.random()*10*1000*1000)
            }
        })
        storage.save()
    })
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
        {action: 'add-item-to-target-list',  scope:'list',  key: 'N',  control:true,  shift:true,  },
        {action: 'add-item-to-target-list',  scope:'list',  key: 'N',  alt:true, },
        {action: 'toggle-completed', scope:'list', key: 'period',  control:true},
        {action: 'toggle-completed', scope: 'list', key: 'period',  alt:true },
        {action: 'toggle-today',  scope: 'list', key:'t',  control:true,  shift:true },
        {action: 'toggle-today',  scope:'list',  key:'t',  alt:true },
        {action: 'delete-item',   scope:'list',  key:'backspace' },

        //item scope
        {action: 'edit-item',   key: 'Enter',  scope:'item',  },
        { action: 'exit-edit-item',   key:'escape', scope:'edit-item',   },
    ])

    return <ActionContext.Provider value={AM}>
        <StorageContext.Provider value={storage}>
            <FocusContext.Provider value={new FocusManager()}>
                <TodoAppContent/>
            </FocusContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const TodoAppContent = () => {
    const storage = useContext(StorageContext)
    const [selectedProject,setSelectedProject] = useState(null)
    const [query,setQuery] = useState(()=>{
        return storage.createQuery('items',(it)=>(selectedProject && it.project === selectedProject.id),(a,b)=>a.sortOrder-b.sortOrder)
    })
    const changeSelectedProject = (project) => {
        setSelectedProject(project)
        if(project.special) {
            if(project.title === 'today') return setQuery(storage.createQuery('items', it => it.today === true))
            if(project.title === 'trash') return setQuery(storage.createQuery('items',it => it.deleted === true))
        } else {
            setQuery(storage.createQuery('items',
                    it=>it.project===project.id,
                (a,b)=>a.sortOrder-b.sortOrder))
        }
    }
    const [searching, setSearching] = useState(false)
    const endSearching = () => {
        changeSelectedProject(selectedProject)
        setSearching(false)
    }
    const handlers = useActionScope('list',{
        'find-item': () => setSearching(true)
    })
    return <VBox className={'todoapp-grid'}>
        <Toolbar className={'grid-toolbar'}>
            <SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>
        </Toolbar>
        <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject}/>
        <ItemsListView query={query} project={selectedProject}/>
        <VBox>
            <h3>Shortcuts</h3>
            <ShortcutsPanel/>
        </VBox>
    </VBox>

}
