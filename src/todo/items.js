import React, {useContext, useEffect, useRef, useState} from 'react'
import {useActionScope} from '../common/actions.js'
import {
    FocusContext,
    GenericListView,
    HBox,
    makeClassNames,
    PopupButton,
    Spacer,
    useAutofocusRefWhenSelected,
    VBox
} from '../common/layout.js'
import {StorageContext, useDraft, useQuery} from '../common/storage2.js'
import {File, Star} from 'react-feather'

const getProjectTitle = (storage, item) => {
    const proj = storage.findOne('project', (proj) => proj._id === item.project)
    if (proj) return proj.title
    return "[no project]"
}

const ItemEditPanel = ({item}) => {
    const [draft, update, save] = useDraft('item',item)
    const storage = useContext(StorageContext)
    const endEditing = () => {
        save()
        storage.updateObject('item',item,'editing',false)
    }

    const handlers = useActionScope('edit-item', {
        'exit-edit-item': endEditing
    })

    const [projects] = useState(() => storage.createQuery({table:'project', find:(p) => !p.special}))
    const title = useRef()
    useEffect(()=>{
        title.current.focus()
    },[])

    return <div className={"edit-panel"} onKeyDown={handlers.onKeyDown}>
        <HBox>
            <input type="checkbox" checked={draft.completed} onChange={(e)=>{
                update('completed',e.target.checked)
                // update('completedTimestamp',Date.now())
            }}/>
            <input ref={title} type="text" value={draft.title} className="grow"
                   onChange={(e)=>{
                       update('title',e.target.value)
                   }} onKeyDown={(e) => {
                       if (e.key === 'Enter') endEditing()
                   }
            }/>
        </HBox>
        <HBox>
            <textarea className={"grow"} value={draft.notes} onChange={(e)=>{
                update('notes',e.target.value)
            }}/>
        </HBox>
        <HBox>
            <label>today</label>
            <input type={'checkbox'} checked={draft.today} onChange={(e)=>{
                update('today',e.target.checked)
            }}/>
            <PopupButton
                getItems={() => projects.results()}
                stringify={(item) => item.title}
                itemSelected={(item) => {
                    update('project',item._id)
                }}
            >{getProjectTitle(storage,draft)}</PopupButton>
            <Spacer/>
            <button onClick={endEditing}>done</button>
        </HBox>
    </div>
}

const ItemViewItem = ({item, focusName, selected}) => {
    const hbox = useRef()
    const storage = useContext(StorageContext)
    useAutofocusRefWhenSelected(hbox, selected, focusName)
    const startEditing = () => storage.updateObject('item',item,'editing',true)
    const stopEditing = () => storage.updateObject('item',item,'editing',false)
    const handlers = useActionScope('item', {
        'edit-item': () => startEditing(),
        'exit-edit-item': () => stopEditing(),
    })

    const cls = makeClassNames({
        'hbox': true,
        'todo-item': true,
        'deleted': item.deleted
    })
    return <div ref={hbox}
                tabIndex={0}
                className={cls}
                onKeyDown={handlers.onKeyDown}
                onDoubleClick={startEditing}
    >
        <input type="checkbox" checked={item.completed} onChange={(e)=>{
            storage.updateObject('item',item,'completed',e.target.checked)
        }}/>
        <TodayIndicator item={item}/>
        <span style={{width:'0.5rem'}}></span>
        <VBox>
            <HBox>
                <span className={'title'}>{item.title}</span>
                <NotesIndicator item={item}/>
            </HBox>
            <span className={'project'}>{getProjectTitle(storage, item)}</span>
        </VBox>
    </div>
}
const TodayIndicator = ({item}) => {
    if (item.today) {
        return <Star size={16}/>
    } else {
        return <b className={'empty-icon'}></b>
    }
}

const NotesIndicator = ({item}) => {
    if (item.notes) {
        return <span className={"notes-indicator"}><File size={12}/></span>
    } else {
        return <b className={'empty-icon'}></b>
    }
}
const TodoItemView = ({item, focusName, selected}) => {
    if (item.editing) {
        return <ItemEditPanel item={item}/>
    } else {
        return <ItemViewItem item={item} focusName={focusName} selected={selected}/>
    }
}

export const ItemsListView = ({query, project}) => {
    const storage = useContext(StorageContext)
    const [sel, setSel] = useState(null)
    const addItem = () => {
        storage.makeObject('item', {
            title: 'empty item',
            tags: [],
            project: project._id,
            completed: false,
            today: (project.special && project.title === 'today'),
            notes: "",
            deleted: false,
            editing:true,
        }).then(item =>  setSel(item))
    }
    const fm = useContext(FocusContext)
    const items = useQuery(query)
    const handlers = useActionScope('list', {
        'focus-prev-master': () => {
            fm.setMasterFocus('projects')
        },
        'focus-next-master': () => {
        },
        'add-item-to-target-list': addItem,
        'toggle-completed': () => {
            storage.updateObject('item', sel, 'completed', !sel.completed)
        },
        'toggle-today': () => {
            storage.updateObject('item', sel, 'today', !sel.today)
        },
        'delete-item': (e) => {
            if (e.target.classList.contains('todo-item')) {
                storage.updateObject('item', sel, 'deleted', !sel.deleted)
            }
        },
        'shift-selection-prev': () => {
            if (project.special) return console.log("cannot change sort in a special")
            const index = items.indexOf(sel)
            const newIndex = index - 1
            console.log("moving the selection up from", index, 'to', newIndex, sel)
            if (newIndex < 0) return console.log("can't move up past the start")
            const prev = items[newIndex]
            console.log("prev is", prev)
            const prevprev = items[newIndex - 1]
            console.log("prevprev", prevprev)
            let sortA = prev.sortOrder
            let sortB = 0
            if (prevprev) sortB = prevprev.sortOrder
            const newOrder = (sortA + sortB) / 2
            console.log("the new order is", newOrder)
            storage.updateObject('item', sel, 'sortOrder', newOrder)
        },
        'shift-selection-next': () => {
            if (project.special) return console.log("cannot change sort in a special")
            const index = items.indexOf(sel)
            const newIndex = index + 1
            console.log('moving selection', sel)
            if (newIndex > items.length - 1) return console.log("cannot move down past the end")
            const next = items[newIndex]
            let sortA = next.sortOrder
            let sortB = Number.MAX_SAFE_INTEGER
            const nextnext = items[newIndex + 1]
            if (nextnext) sortB = nextnext.sortOrder
            console.log("will be after", nextnext)
            const newOrder = (sortA + sortB) / 2
            console.log("the new order is", newOrder)
            storage.updateObject('item', sel, 'sortOrder', newOrder)
        }

    })
    let emptyTrash = ""
    const emptyTrashAction = () => {
        storage.delete('item', (it) => it.deleted)
    }
    let addButton = <button onClick={addItem}>add</button>
    if (project && project.special && project.title === 'trash') {
        emptyTrash = <button onClick={emptyTrashAction}>empty</button>
        addButton = ""
    }
    return <div onKeyDown={handlers.onKeyDown} className={'items-list-view panel'}>
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
