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
const good = storage.insert('projects', {title: 'good'})
const forget = storage.insert('projects', {title: 'forget'})
const trash = storage.insert('projects', {title: 'trash'})

storage.insert("items", {
    id: 1,
    title: 'first, that I can forget',
    notes: 'this is some notes: https://www.mozilla.com/',
    tags: ['foo'],
    completed:false,
    project: forget.id
})
storage.insert("items", {
    id: 2, title: 'second is good', tags: ['foo', 'bar'], project: good.id,
    completed:true,
})
storage.insert("items", {id: 3, title: 'third is good', tags: ['bar'],
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

const TodoItemView = ({setSelected, isSelected, item})=>{
    const hbox = useRef()
    const title = useRef()
    const [setProp] = useObjectUpdate(storage,'items',item)
    useEffect(()=>{
        if(isSelected) {
            if(hbox.current) hbox.current.focus()
        }
        // if(title.current) title.current.focus()
    })
    const toggleItem = () => storage.update('items',item,'completed',!item.completed)
    const [editing, setEditing] = useState(false)
    const startEditing = () => setEditing(true)
    const endEditing = () => setEditing(false)

    const handlers = useActionScope('item',{
        'toggle-completed': toggleItem,
        'edit-item': startEditing,
        'exit-edit-item': endEditing,
    })
    const editTitle = (e) => setProp('title',e.target.value)//storage.update('items',item,'title',e.target.value)
    const editNotes = (e) => setProp('notes',e.target.value)//storage.update('items',item,'notes',e.target.value)

    if(editing) {
        return <div ref={hbox}
                 className={"edit-panel"}
                onKeyDown={handlers.onKeyDown}
        >
            <HBox>
                <input type="checkbox" checked={item.completed} onChange={toggleItem}/>
                <input type="text" value={item.title} className="grow" onChange={editTitle}
                       ref={title}
                />
            </HBox>
            <HBox>
                <textarea className={"grow"} value={item.notes} onChange={editNotes}/>
            </HBox>
            <HBox>
                <button>{item.project}</button>
                <Spacer/>
                <button onClick={endEditing}>done</button>
            </HBox>
        </div>
    } else {
        return <div ref={hbox}
                    onClick={() => setSelected(item)}
                    tabIndex={0}
                    className={(isSelected ? "selected" : "") + " hbox todo-item"}
                    onKeyDown={handlers.onKeyDown}
                    onDoubleClick={startEditing}
        >
            <input type="checkbox" checked={item.completed} onChange={toggleItem}/>
            <b>{item.title}</b>
            <i>{item.project}</i>
        </div>
    }
}

const ItemsListView = ({project}) => {
    const [query,setQuery] = useState(()=>{
        return storage.createQuery('items',(it)=>it.project === project.id)
    })
    useEffect(()=>{
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
