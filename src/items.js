import React, {useContext, useEffect, useRef, useState} from 'react'
import {ActionContext, useActionScope} from './actions.js'
import {FocusContext, GenericListView, HBox, makeClassNames, PopupButton, Spacer, VBox} from './layout.js'
import {StorageContext, useObjectUpdate, useQuery} from './storage.js'
import {Star, File} from 'react-feather'

const getProjectTitle = (storage,item) => {
    const proj = storage.find('projects',(proj)=>proj.id===item.project)
    if(proj) return proj.title
    return ""
}

const ItemEditPanel = ({item, setEditing}) => {
    const title = useRef()
    const storage = useContext(StorageContext)
    const [setProp] = useObjectUpdate(storage,'items',item)
    const toggleCompleted = () => setProp('completed',!item.completed)
    const toggleToday = () => setProp('today',!item.today)
    const editTitle = (e) => setProp('title',e.target.value)
    const editNotes = (e) => setProp('notes',e.target.value)
    const endEditing = () => setEditing(false)

    const handlers = useActionScope('edit-item',{
        'exit-edit-item': endEditing,
    })

    const [projects] = useState(()=> storage.createQuery('projects',(p)=>!p.special))


    //focus when first opening
    useEffect(()=>{
        if(title.current) title.current.focus()
    },[item])

    return <div className={"edit-panel"} onKeyDown={handlers.onKeyDown}>
        <HBox>
            <input type="checkbox" checked={item.completed} onChange={toggleCompleted}/>
            <input type="text" value={item.title} className="grow" onChange={editTitle} ref={title} onKeyDown={(e)=>{
                if(e.key === 'Enter') endEditing()
            }}/>
        </HBox>
        <HBox>
            <textarea className={"grow"} value={item.notes} onChange={editNotes}/>
        </HBox>
        <HBox>
            <label>today</label>
            <input type={'checkbox'} checked={item.today} onChange={toggleToday}/>
            <PopupButton
                getItems={()=> projects.results()}
                stringify={(item)=>item.title}
                itemSelected={(item)=> setProp('project',item.id)}
            >{getProjectTitle(storage,item)}</PopupButton>
            <Spacer/>
            <button onClick={endEditing}>done</button>
        </HBox>
    </div>
}

const ItemViewItem = ({item, setEditing, focusName, selected})=>{
    const hbox = useRef()
    const storage = useContext(StorageContext)
    const [setProp] = useObjectUpdate(storage,'items',item)
    const toggleCompleted = () => setProp('completed',!item.completed)
    const fm = useContext(FocusContext)
    useEffect(() => {
        const check = () => {
            if (hbox.current && selected && fm.getMasterFocus() === focusName) hbox.current.focus()
        }
        check()
        fm.on(check)
        return ()=>fm.off(check)
    })
    const handlers = useActionScope('item',{
        'edit-item': ()=>  setEditing(true),
        'exit-edit-item': ()=>setEditing(false),
    })

    const cls = makeClassNames({
        'hbox':true,
        'todo-item':true,
        'deleted':item.deleted,
    })
    return <div ref={hbox}
                tabIndex={0}
                className={cls}
                onKeyDown={handlers.onKeyDown}
                onDoubleClick={()=>setEditing(true)}
        >
        <TodayIndicator item={item}/>
        <input type="checkbox" checked={item.completed} onChange={toggleCompleted}/>
        <VBox>
            <b>
                <span className={'title'}>{item.title}</span>
                <NotesIndicator item={item}/>
            </b>
            <i>{getProjectTitle(storage,item)}</i>
        </VBox>
    </div>
}
const TodayIndicator = ({item})=>{
    if(item.today) {
        return <Star size={16}/>
    } else {
        return <b className={'empty-icon'}></b>
    }
}

const NotesIndicator = ({item})=>{
    if(item.notes) {
        return <span className={"notes-indicator"}><File size={12}/></span>
    } else {
        return <b className={'empty-icon'}></b>
    }
}
const TodoItemView = ({item, focusName, selected})=>{
    const [editing, setEditing] = useState(false)
    if(editing) {
        return <ItemEditPanel item={item} setEditing={setEditing}/>
    } else {
        return <ItemViewItem item={item} setEditing={setEditing} focusName={focusName} selected={selected}/>
    }
}

export const ItemsListView = ({query, project, focused}) => {
    const storage = useContext(StorageContext)
    const [sel, setSel] = useState(null)
    const addItem = () => {
        const item = storage.insert('items', {
            title: 'empty item',
            tags: [],
            project:project.id,
            completed:false,
            today:(project.special && project.title === 'today'),
            notes:"",
            deleted:false,
        })
        setSel(item)
    }
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
            fm.setMasterFocus('projects')
        },
        'focus-next-master': () => {
        },
        'add-item-to-target-list':addItem,
        'toggle-completed': ()=>{
            storage.update('items',sel,'completed',!sel.completed)
        },
        'toggle-today': () => {
            storage.update('items',sel,'today',!sel.today)
        },
        'delete-item':(e)=> {
            if(e.target.classList.contains('todo-item')) {
                storage.update('items',sel,'deleted',!sel.deleted)
            }
        },
    })
    let emptyTrash = ""
    const emptyTrashAction = () => {
        storage.delete('items',(it)=>it.deleted)
    }
    let addButton = <button onClick={addItem}>add</button>
    if(project && project.special && project.title === 'trash') {
        emptyTrash = <button onClick={emptyTrashAction}>empty</button>
        addButton = ""
    }
    return <div  onKeyDown={handlers.onKeyDown} className={'items-list-view'}>
        <GenericListView
            ItemTemplate={TodoItemView}
            selectedItem={sel}
            setSelectedItem={setSel}
            focusName={'items'}
            query={query}
            autoFocus={false}
        />
        <HBox>
            {emptyTrash}
            {addButton}
        </HBox>
    </div>
}
