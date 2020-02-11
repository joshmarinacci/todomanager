import React, {useContext, useEffect, useRef, useState} from 'react'
import {ActionContext, ActionManager, useActionScope} from '../common/actions.js'
import {StorageContext, Storage} from '../common/storage2.js'
import {
    FocusContext,
    FocusManager,
    Toolbar,
    VBox
} from '../common/layout.js'
import {ProjectsListView} from './projects.js'
import {ItemsListView} from './items.js'
import './todo.css'
import {AuthContext, BASE_URL} from '../auth.js'

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
    storage.makeObject('project', {title: 'today', special: true, name:'todo'})
    storage.makeObject('project', {title: 'trash', special: true, name:'trash'})
}
storage.init('todos',makeInitialData).then(()=>{
    console.log("todos storage is loaded")
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
            <FocusContext.Provider value={new FocusManager()}>
                <TodoAppContent/>
            </FocusContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const TodoAppContent = () => {
    const auth = useContext(AuthContext)
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

    const copyToServer = () => {
        storage.asJSON()
            .then(json => {
                console.log("sending to the server",json)
                return auth.fetch(`${BASE_URL}joshmarinacci/upload/?type=todoblob&mimetype=application/json&title=primary`,{
                    method:'POST',
                    body:JSON.stringify(json),
                    headers: {
                        'Content-Type':'application/json'
                    }
                })
            })
            .then(res => res.json())
            .then(res => {
                console.log("got result",res)
            })
    }
    const copyFromServer = () => {
        auth.fetch(`${BASE_URL}joshmarinacci/search?type=todoblob&title=primary`)
            .then(res => res.json())
            .then(data => {
                console.log("data is",data)
                if(data.results.length !== 1) {
                    console.log("too many results")
                } else {
                    const d = data.results[0]
                    console.log("found d",d)
                    return auth.fetch(`${BASE_URL}joshmarinacci/data/${d._id}/latest/application/json/data.json`)
                }
            })
            .then(res => res.json())
            .then(res => {
                console.log("final results",res)
                storage.mergeJSON(res)
            })
    }
    const deleteOnServer = () => {
        auth.fetch(`${BASE_URL}joshmarinacci/delete/?type=todoblob`, {
            method:'POST'
        }).then(res => res.json())
            .then(res => {
                console.log("final result",res)
            })
    }
    const deleteAll = () =>  storage.deleteTableData('item')

    const [loggedIn,setLoggedIn] = useState(auth.isLoggedIn())

    return <VBox className={'todoapp-grid'}>
        <Toolbar className={'grid-toolbar'}>
            <SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>
            <button disabled={!loggedIn} onClick={copyToServer}>copy to server</button>
            <button disabled={!loggedIn} onClick={copyFromServer}>copy from server</button>
            <button disabled={!loggedIn} onClick={deleteOnServer}>delete on server</button>
            <button onClick={deleteAll}>delete all notes</button>

        </Toolbar>
        <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject}/>
        <ItemsListView query={query} project={selectedProject}/>
    </VBox>

}
