import React, {useContext, useEffect, useRef, useState} from 'react'
import {ActionContext, useActionScope} from './actions.js'
import {HBox, makeClassNames, PopupButton, Spacer, VBox} from './layout.js'
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
        'toggle-completed': toggleCompleted,
        'toggle-today': toggleToday,
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

const ItemViewItem = ({item, setEditing, isSelected, setSelected, listFocused})=>{
    const hbox = useRef()
    const storage = useContext(StorageContext)
    const [setProp] = useObjectUpdate(storage,'items',item)
    const toggleCompleted = () => setProp('completed',!item.completed)
    const toggleToday = () => setProp('today',!item.today)
    const handlers = useActionScope('item',{
        'toggle-completed': toggleCompleted,
        'toggle-today': toggleToday,
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
        <TodayIndicator item={item}/>
        <input type="checkbox" checked={item.completed} onChange={toggleCompleted}/>
        <VBox>
            <b>{item.title}
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
const TodoItemView = ({setSelected, isSelected, item, listFocused})=>{
    const [editing, setEditing] = useState(false)
    if(editing) {
        return <ItemEditPanel item={item} setEditing={setEditing}/>
    } else {
        return <ItemViewItem item={item} setEditing={setEditing} setSelected={setSelected} isSelected={isSelected} listFocused={listFocused}/>
    }
}

export const ItemsListView = ({query, project, focused}) => {
    const storage = useContext(StorageContext)
    const [items] = useQuery(query)
    const [sel, setSel] = useState(items[0])
    useEffect(()=>{
        if(items.length > 0) {
            setSel(items[0])
        } else {
            setSel(null)
        }
    },[project,query,focused])
    const addItem = () => {
        const item = am.getAction("add-item-to-target-list")(storage,project)
        setSel(item)
    }
    const handlers = useActionScope('list',{
        'move-selection-prev':()=>{
            const index = items.indexOf(sel)
            if(index > 0) setSel(items[index-1])
        },
        'move-selection-next':()=>{
            const index = items.indexOf(sel)
            if(index < items.length-1) setSel(items[index+1])
        },
        'add-item-to-target-list':addItem,
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
            <button onClick={addItem}>add</button>
        </HBox>
    </VBox>
}
