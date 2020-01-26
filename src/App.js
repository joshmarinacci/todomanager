import React, {useContext, useEffect, useRef, useState} from 'react'
import './App.css'
import {FillBox, HBox, Spacer, VBox} from './layout.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import {QueryStorage, useQuery} from './storage.js'

// const EditableLabel = ({value, editing, doneEditing}) => {
//     const [temp, setTemp] = useState(value)
//     const input = useRef()
//     useEffect(() => {
//         if (input.current) input.current.focus()
//     }, [editing])
//     if (editing) {
//         return <input ref={input} type="text"
//                       value={temp}
//                       onChange={(e) => setTemp(e.target.value)}
//                       onKeyDown={(e) => {
//                           if (e.key === 'Enter') {
//                               doneEditing(temp)
//                           }
//                       }}
//         />
//     }
//     return <label>{temp}</label>
// }

const storage = new QueryStorage()
const today = storage.insert('projects',{title:'today',special:true})
const good = storage.insert('projects', {title: 'good'})
const forget = storage.insert('projects', {title: 'forget'})
const trash = storage.insert('projects', {title: 'trash'})

storage.insert("items", {
    id: 1,
    today:true,
    title: 'first, that I can forget',
    notes: 'this is some notes: https://www.mozilla.com/',
    tags: ['foo'],
    completed:false,
    project: forget.id
})
storage.insert("items", {
    id: 2,
    today:false,
    title: 'second is good',
    tags: ['foo', 'bar'],
    project: good.id,
    completed:true,
})
storage.insert("items", {
    id: 3,
    today:true,
    title: 'third is good',
    tags: ['bar'],
    project: good.id,
    completed:false,
})

const ALLPROJECTS = storage.createQuery('projects',()=>true)

const ProjectsListView = ({selectedProject, setSelectedProject})=> {
    const [projects] = useQuery(ALLPROJECTS)
    const handlers = useActionScope('list',{
        'move-selection-prev':()=>{
            const index = projects.indexOf(selectedProject)
            if(index > 0) setSelectedProject(projects[index-1])
        },
        'move-selection-next':()=>{
            const index = projects.indexOf(selectedProject)
            if(index < projects.length-1) setSelectedProject(projects[index+1])
        }
    })
    return <VBox className={'list-view'} tabIndex={0} onKeyDown={handlers.onKeyDown}>
        {projects.map(project => {
            return <HBox
                onClick={()=>setSelectedProject(project)}
                className={(project===selectedProject)?'selected':''}
                key={project.id}>{project.title}</HBox>
        })}
    </VBox>
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

const TodayIndicator = ({item})=>{
    if(item.today) {
        return <b>[*]</b>
    } else {
        return <b>[ ]</b>
    }
}
const TodoItemView = ({setSelected, isSelected, item})=>{
    const hbox = useRef()
    useEffect(()=> {
        if(isSelected && hbox.current) hbox.current.focus()
    })

    const [setProp] = useObjectUpdate(storage,'items',item)
    const toggleCompleted = () => setProp('completed',!item.completed)

    const [editing, setEditing] = useState(false)
    const startEditing = () => setEditing(true)
    const endEditing = () => setEditing(false)

    const handlers = useActionScope('item',{
        'toggle-completed': toggleCompleted,
        'edit-item': startEditing,
        'exit-edit-item': endEditing,
    })

    if(editing) {
        return <ItemEditPanel item={item} setEditing={setEditing}/>
    } else {
        return <div ref={hbox}
                    onClick={() => setSelected(item)}
                    tabIndex={0}
                    className={(isSelected ? "selected" : "") + " hbox todo-item"}
                    onKeyDown={handlers.onKeyDown}
                    onDoubleClick={startEditing}
        >
            <input type="checkbox" checked={item.completed} onChange={toggleCompleted}/>
            <TodayIndicator item={item}/>
            <b>{item.title}</b>
            <i>{getProjectTitle(storage,item)}</i>
        </div>
    }
}

const ItemsListView = ({project}) => {
    const [query,setQuery] = useState(()=>{
        return storage.createQuery('items',(it)=>it.project === project.id)
    })
    useEffect(()=>{
        if(project.special && project.title === 'today') {
            setQuery(storage.createQuery('items',it=>it.today===true))
            return
        }
        setQuery(storage.createQuery('items',it=>it.project===project.id))
    },[project])
    const [items] = useQuery(query)
    const [sel, setSel] = useState(items[0])
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
        }
    })
    const am = useContext(ActionContext)
    return <VBox className={'list-view items-view'} tabIndex={0} onKeyDown={handlers.onKeyDown}>
        {items.map(item => <TodoItemView key={item.id} isSelected={item===sel} item={item} setSelected={setSel}/>)}
        <HBox>
            <button
                onClick={()=>am.getAction("add-item-to-target-list")(storage,project)}
            >add</button>
        </HBox>
    </VBox>
}

function App() {
    const [selectedProject,setSelectedProject] = useState(good)
    return <FillBox>
        <ActionContext.Provider value={AM}>
            <HBox className={'grow stretch'}>
                <ProjectsListView selectedProject={selectedProject} setSelectedProject={setSelectedProject}/>
                <VBox>
                    <ItemsListView project={selectedProject}/>
                </VBox>
                <VBox>
                    <h3>Shortcuts</h3>
                    <ShortcutsPanel/>
                </VBox>
            </HBox>
        </ActionContext.Provider>
    </FillBox>
}

export default App
