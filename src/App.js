import React, {useEffect, useRef, useState} from 'react'
import './App.css'
import {FillBox, HBox, Toolbar, VBox} from './layout.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import {QueryStorage, StorageContext} from './storage.js'
import {ProjectsListView} from './projects.js'
import {ItemsListView} from './items.js'


const storage = new QueryStorage()
storage.load().then(()=>{
    if(storage.isEmpty()) makeInitialData()
})

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

const SearchBox = ({searching, setSearching, setQuery}) => {
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

function App() {
    const [selectedProject,setSelectedProject] = useState(null)
    const [focusedList, setFocusedList] = useState("lists")
    const [query,setQuery] = useState(()=>{
        return storage.createQuery('items',(it)=>(selectedProject && it.project === selectedProject.id))
    })
    const changeSelectedProject = (project) => {
        setSelectedProject(project)
        if(project.special) {
            if(project.title === 'today') return setQuery(storage.createQuery('items', it => it.today === true))
            if(project.title === 'trash') return setQuery(storage.createQuery('items',it => it.deleted === true))
        } else {
            setQuery(storage.createQuery('items',it=>it.project===project.id))
        }
    }
    const [searching, setSearching] = useState(false)
    const endSearching = () => {
        changeSelectedProject(selectedProject)
        setSearching(false)
        setFocusedList("items")
    }
    const handlers = useActionScope('list',{
        'nav-items': () => setFocusedList("items"),
        'nav-lists': () => setFocusedList("lists"),
        'find-item': () => setSearching(true)
    })
    return <FillBox>
        <ActionContext.Provider value={AM}>
            <StorageContext.Provider value={storage}>
                <VBox>
                    <Toolbar>
                        <SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>
                    </Toolbar>
                    <HBox className={'grow stretch'} onKeyDown={handlers.onKeyDown}>
                        <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject} focusedList={focusedList}/>
                        <ItemsListView query={query} project={selectedProject} focused={focusedList}/>
                        <VBox>
                            <h3>Shortcuts</h3>
                            <ShortcutsPanel/>
                        </VBox>
                    </HBox>
                </VBox>
            </StorageContext.Provider>
        </ActionContext.Provider>
    </FillBox>
}

export default App
