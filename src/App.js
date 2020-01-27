import React, {useState} from 'react'
import './App.css'
import {FillBox, HBox, VBox} from './layout.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import {QueryStorage, StorageContext} from './storage.js'
import {ProjectsListView} from './projects.js'
import {ItemsListView} from './items.js'


const storage = new QueryStorage()
storage.insert('projects',{title:'today',special:true})
const good = storage.insert('projects', {title: 'good'})
const forget = storage.insert('projects', {title: 'forget'})
storage.insert('projects', {title: 'trash', special:true})

storage.insert("items", {
    id: 1,
    today:true,
    title: 'first, that I can forget',
    notes: 'this is some notes: https://www.mozilla.com/',
    tags: ['foo'],
    completed:false,
    deleted:false,
    project: forget.id
})
storage.insert("items", {
    id: 2,
    today:false,
    title: 'second is good',
    tags: ['foo', 'bar'],
    project: good.id,
    deleted:false,
    completed:true,
})
storage.insert("items", {
    id: 3,
    today:true,
    title: 'third is good',
    tags: ['bar'],
    project: good.id,
    deleted:false,
    completed:false,
})

function App() {
    const [selectedProject,setSelectedProject] = useState(good)
    const [focusedList, setFocusedList] = useState("lists")
    const [query,setQuery] = useState(()=>{
        return storage.createQuery('items',(it)=>it.project === selectedProject.id)
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
    const handlers = useActionScope('list',{
        'nav-items': () => setFocusedList("items"),
        'nav-lists': () => setFocusedList("lists"),
    })
    return <FillBox>
        <ActionContext.Provider value={AM}>
            <StorageContext.Provider value={storage}>
                <HBox className={'grow stretch'} onKeyDown={handlers.onKeyDown}>
                    <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject} focusedList={focusedList}/>
                    <ItemsListView query={query} project={selectedProject} focused={focusedList}/>
                    <VBox>
                        <h3>Shortcuts</h3>
                        <ShortcutsPanel/>
                    </VBox>
                </HBox>
            </StorageContext.Provider>
        </ActionContext.Provider>
    </FillBox>
}

export default App
