import React, {useContext, useEffect, useRef, useState} from 'react'
import './App.css'
import {FillBox, HBox, Spacer, VBox} from './layout.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import {QueryStorage, useQuery} from './storage.js'


const storage = new QueryStorage()
const today = storage.insert('projects',{title:'today',special:true})
const good = storage.insert('projects', {title: 'good'})
const forget = storage.insert('projects', {title: 'forget'})
const trash = storage.insert('projects', {title: 'trash', special:true})

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

const ALLPROJECTS = storage.createQuery('projects',()=>true)

const ProjectItemView = ({selectedProject, setSelectedProject, project, listFocused})=> {
    const hbox = useRef()
    useEffect(()=>{
        if(listFocused && selectedProject === project) hbox.current.focus()
    },[listFocused, selectedProject])
    const cls = makeClassNames({
        selected:(project===selectedProject),
        hbox:true,
        'project-item':true,
    })
    return <div ref={hbox} tabIndex={0} className={cls} key={project.id}
        onClick={()=>{
            setSelectedProject(project)
            hbox.current.focus()
        }}
    >{project.title}</div>
}

const ProjectsListView = ({selectedProject, setSelectedProject, focusedList})=> {
    const [projects] = useQuery(ALLPROJECTS)
    const box = useRef()
    const handlers = useActionScope('list',{
        'move-selection-prev':()=>{
            const index = projects.indexOf(selectedProject)
            if(index > 0) setSelectedProject(projects[index-1])
        },
        'move-selection-next':()=>{
            const index = projects.indexOf(selectedProject)
            if(index < projects.length-1) setSelectedProject(projects[index+1])
        },
    })
    useEffect(()=>{
        if(focusedList === 'lists' && box.current) box.current.focus()
    },[focusedList])
    const cls = makeClassNames({
        vbox:true,
        'list-view':true,
        focused:(focusedList==='lists')
    })
    return <div ref={box} className={cls} onKeyDown={handlers.onKeyDown}>
        {projects.map(project => <ProjectItemView
            key={project.id}
            project={project}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            listFocused={focusedList==='lists'}
        />)}
    </div>
}

function useObjectUpdate(storage,table, item) {
    return [
        (key,value)=>{
            storage.update(table,item,key,value)
        }
    ]
}
const getProjectTitle = (storage,item) => {
    const proj = storage.find('projects',(proj)=>proj.id===item.project)
    if(proj) return proj.title
    return ""
}


const ItemEditPanel = ({item, setEditing}) => {
    const title = useRef()
    const [setProp] = useObjectUpdate(storage,'items',item)
    const toggleCompleted = () => setProp('completed',!item.completed)
    const toggleToday = () => setProp('today',!item.today)
    const editTitle = (e) => setProp('title',e.target.value)
    const editNotes = (e) => setProp('notes',e.target.value)
    const endEditing = () => setEditing(false)

    const handlers = useActionScope('item',{
        'toggle-completed': toggleCompleted,
        'exit-edit-item': endEditing,
    })

    //focus when first opening
    useEffect(()=>{
        if(title.current) title.current.focus()
    },[item])

    return <div className={"edit-panel"} onKeyDown={handlers.onKeyDown}>
        <HBox>
            <input type="checkbox" checked={item.completed} onChange={toggleCompleted}/>
            <input type="text" value={item.title} className="grow" onChange={editTitle} ref={title}/>
        </HBox>
        <HBox>
            <textarea className={"grow"} value={item.notes} onChange={editNotes}/>
        </HBox>
        <HBox>
            <label>today</label>
            <input type={'checkbox'} checked={item.today} onChange={toggleToday}/>
            <button>{getProjectTitle(storage,item)}</button>
            <Spacer/>
            <button onClick={endEditing}>done</button>
        </HBox>
    </div>
}
const ItemViewItem = ({item, setEditing, isSelected, setSelected, listFocused})=>{
    const hbox = useRef()
    const [setProp] = useObjectUpdate(storage,'items',item)
    const toggleCompleted = () => setProp('completed',!item.completed)
    const handlers = useActionScope('item',{
        'toggle-completed': toggleCompleted,
        'edit-item': ()=>  setEditing(true),
        'exit-edit-item': ()=>setEditing(false),
        'delete-item':()=> setProp('deleted',!item.deleted),
    })

    useEffect(()=>{
        if(listFocused && isSelected && hbox.current) {
            hbox.current.focus()
        }
    },[listFocused, isSelected])
    const cls = makeClassNames({
        'selected':isSelected,
        'hbox':true,
        'todo-item':true,
        'deleted':item.deleted,
    })
    return <div ref={hbox}
                tabIndex={0}
                className={cls}
                onKeyDown={handlers.onKeyDown}
                onClick={() => setSelected(item)}
                onDoubleClick={()=>setEditing(true)}
    >
        <input type="checkbox" checked={item.completed} onChange={toggleCompleted}/>
        <TodayIndicator item={item}/>
        <b>{item.title}</b>
        <i>{getProjectTitle(storage,item)}</i>
    </div>
}
const TodayIndicator = ({item})=>{
    if(item.today) {
        return <b>[*]</b>
    } else {
        return <b>[ ]</b>
    }
}
const TodoItemView = ({setSelected, isSelected, item, listFocused})=>{
    const [editing, setEditing] = useState(false)
    if(editing) {
        return <ItemEditPanel item={item} setEditing={setEditing}/>
    } else {
        return <ItemViewItem item={item} setEditing={setEditing} setSelected={setSelected} isSelected={isSelected} listFocused={listFocused}/>
    }
}

function makeClassNames(map) {
    let classNames = ""
    Object.keys(map).forEach(key=>{
        if(map[key]) classNames+= (" " + key)
    })
    return classNames
}

const ItemsListView = ({query, project, focused}) => {
    const [items] = useQuery(query)
    const [sel, setSel] = useState(items[0])
    useEffect(()=>{
        if(items.length > 0) {
            setSel(items[0])
        } else {
            setSel(null)
        }
    },[project,query,focused])
    const handlers = useActionScope('list',{
        'move-selection-prev':()=>{
            const index = items.indexOf(sel)
            if(index > 0) setSel(items[index-1])
        },
        'move-selection-next':()=>{
            const index = items.indexOf(sel)
            if(index < items.length-1) setSel(items[index+1])
        },
        'add-item-to-target-list':(am)=>{
            am.getAction('add-item-to-target-list')(storage,project)
        },
    })
    const am = useContext(ActionContext)
    const isFocused = (focused==='items')
    const cls = makeClassNames({
        'list-view':true,
        'items-view':true,
        'focused':isFocused,
    })
    return <VBox className={cls}
                 onKeyDown={handlers.onKeyDown}>
        {items.map(item => <TodoItemView
            key={item.id}
            item={item}
            isSelected={item===sel}
            setSelected={setSel}
            listFocused={isFocused}
        />)}
        <HBox>
            <button
                onClick={()=>am.getAction("add-item-to-target-list")(storage,project)}
            >add</button>
        </HBox>
    </VBox>
}

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
            <HBox className={'grow stretch'} onKeyDown={handlers.onKeyDown}>
                <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject} focusedList={focusedList}/>
                <ItemsListView query={query} project={selectedProject} focused={focusedList}/>
                <VBox>
                    <h3>Shortcuts</h3>
                    <ShortcutsPanel/>
                </VBox>
            </HBox>
        </ActionContext.Provider>
    </FillBox>
}

export default App
