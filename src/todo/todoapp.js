import React, {useContext, useEffect, useRef, useState} from 'react'
import {ActionContext, ActionManager, AM, useActionScope} from '../common/actions.js'
import {StorageContext, Storage} from '../common/storage2.js'
import {
    DialogContext,
    DialogManager,
    FocusContext,
    FocusManager,
    PopupContext, PopupManager,
    Toolbar,
    VBox
} from '../common/layout.js'
import {ProjectsListView} from './projects.js'
import {ItemsListView} from './items.js'
import './todo.css'

const storage = new Storage()
const PROJECT = storage.defineTable({
    name:'project',
    schema: {}
})
const ITEM = storage.defineTable({
    name:'item',
    schema:{}
})

function makeInitialData() {
    storage.makeObject('project', {title: 'today', special: true})
    storage.makeObject('project', {title: 'forget'}).then(forget => {
        storage.makeObject("item", {
            today: true,
            title: 'first, that I can forget',
            notes: 'this is some notes: https://www.mozilla.com/',
            tags: ['foo'],
            completed: false,
            deleted: false,
            project: forget._id
        })

    })
    storage.makeObject('project', {title: 'good'}).then(good => {
        storage.makeObject("item", {
            today: false,
            title: 'second is good',
            tags: ['foo', 'bar'],
            project: good._id,
            deleted: false,
            completed: true,
        })
        storage.makeObject("item", {
            today: true,
            title: 'third is good',
            tags: ['bar'],
            project: good._id,
            deleted: false,
            completed: false,
        })

    })
    storage.makeObject('project', {title: 'trash', special: true})
}
storage.init('todos',makeInitialData).then(()=>{
    console.log("todos storage is loaded")
    // storage.deleteAll()
})


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
            setQuery(storage.createQuery({table:'item',find:(it)=>it.title.includes(txt)}))
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
    /*
    const storage = new QueryStorage("todo")
    storage.load().then(()=>{
        if(storage.isEmpty()) makeInitialData()
        const projs = storage.findAll('projects',()=>true)
        projs.forEach((proj) => {
            if(proj.title === 'trash') return proj.sortOrder = Number.MAX_SAFE_INTEGER
            if(proj.title === 'completed') return proj.sortOrder = Number.MAX_SAFE_INTEGER-1
            if(proj.title === 'today') return proj.sortOrder = 0
            if(!('sortOrder' in proj)) {
                console.log("have to add a sort order")
                proj.sortOrder = Math.floor(Math.random()*10*1000*1000)
            }
        })

        const completed = storage.find('projects',p=>p.special && p.title === 'completed')
        if(!completed) {
            console.log('we need to add a completed category')
            storage.insert('projects', {title: 'completed', special: true})
        }
        const items = storage.findAll('items',()=>true)
        items.forEach(item => {
            if(!('sortOrder' in item)) {
                console.log("adding a sort order")
                item.sortOrder = Math.floor(Math.random()*10*1000*1000)
            }
            if(!('completedTimestamp' in item)) {
                item.completedTimestamp = 0
            }
        })
        storage.save()
    })*/
    const am = new ActionManager()
    am.registerKeys([

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

    return <ActionContext.Provider value={am}>
        <StorageContext.Provider value={storage}>
            <DialogContext.Provider value={new DialogManager()}>
                <PopupContext.Provider value={new PopupManager()}>
                    <FocusContext.Provider value={new FocusManager()}>
                        <TodoAppContent/>
                    </FocusContext.Provider>
                </PopupContext.Provider>
            </DialogContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const TodoAppContent = () => {
    const storage = useContext(StorageContext)
    const [selectedProject,setSelectedProject] = useState(null)
    const [query,setQuery] = useState(()=>{
        return storage.createQuery({
            table:'item',
            find: (it)=>(selectedProject && it.project === selectedProject._id),
            sort:(a,b)=>a.sortOrder-b.sortOrder,
        })
    })
    const changeSelectedProject = (project) => {
        setSelectedProject(project)
        if(project.special) {
            if(project.title === 'today') return setQuery(storage.createQuery({table:'item', find:it => it.today === true}))
            if(project.title === 'trash') return setQuery(storage.createQuery({table:'item',find:it => it.deleted === true}))
            if(project.title === 'completed') return setQuery(storage.createQuery({
                    table: 'item',
                    find: it => it.completed === true,
                    sort: (a, b) => a.completedTimestamp - b.completedTimestamp
                }))
        } else {
            setQuery(storage.createQuery({
                table: 'item',
                find: it => it.project === project._id,
                sort: (a, b) => a.sortOrder - b.sortOrder,
            }))
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
    </VBox>

}
