import React, {useEffect, useState} from 'react'
import './App.css'

const HBox = ({children, className = "", ...rest}) => {
    return <div className={"hbox " + className} {...rest}>{children}</div>
}
const VBox = ({children, className = "", ...rest}) => {
    return <div className={"vbox " + className} {...rest}>{children}</div>
}

const EditableLabel = ({value, editing, doneEditing})=>{
    if(editing) {
        return <input type="text" value={value} onChange={(e)=>{
            console.log("changed")
        }}
                      onKeyDown={(e)=>{
                      if(e.key === 'Enter') {
                          doneEditing(e.target.value)
                      }
                      }}
        />
    }
    return <label>{value}</label>
}
const ListItemView = ({realItem, selected, onSelect}) => {
    const [item, setItem] = useState(realItem)
    const [editing, setEditing] = useState(false)
    let sel = false
    if(selected) {
        if(selected.includes && selected.includes(item)) sel = true
        if(selected === realItem) sel = true
    }
    return <HBox className={" list-view-item "+(sel?"selected":"")}
                 onClick={()=>onSelect(item)}
                 onDoubleClick={()=>{
                     console.log('double clicked')
                     setEditing(true)
                 }}
    >
        <EditableLabel value={item.title} editing={editing} doneEditing={(value)=>{
            console.log("fully done",value)
            setEditing(false)
        }}/>
    </HBox>
}

let RENDER_COUNT = 0

function countRender() {
    RENDER_COUNT++
    if (RENDER_COUNT > 10) throw new Error("")
}

const ListView = ({query, selected, onSelect}) => {
    const [items, setItems] = useState(query.results())
    useEffect(() => {
        setItems(query.results())
        const update = () => setItems(query.results())
        query.on(update)
        return () => query.off(update)
    },[query])
    return <VBox className={"list-view"}>
        {items.map(item => <ListItemView key={item.id} realItem={item} selected={selected} onSelect={onSelect}/>)}
    </VBox>
}

class EmptyQuery {
    results() {
        return []
    }
    on() {}
    off() {}
    toString() {
        return `empty []`
    }
}

class QueryStorage {
    constructor() {
        this.tables = {}
        this._idcount = 1000
        this.queries = []
    }

    insert(table, obj) {
        if (!this.tables[table]) this.tables[table] = []
        if (!obj.id) {
            this._idcount++
            obj.id = this._idcount
        }
        obj.table = table
        this.tables[table].push(obj)
        this.queries.forEach(query => {
            if (query.table === table) {
                if (query.filter(obj)) {
                    console.log("must update this query")
                    query.fire()
                }
            }
        })
        return obj
    }

    refresh(table) {
        this.queries.forEach(query => {
            if(query.table === table) {
                query.fire()
            }
        })
    }

    createQuery(table, filter) {
        const query = new Query(this, table, filter)
        this.queries.push(query)
        return query
    }

    createEmptyQuery() {
        return new EmptyQuery()
    }
}

class Query {
    constructor(storage, table, filter) {
        this.storage = storage
        this.listeners = []
        this.table = table
        this.filter = filter
    }

    results() {
        return this.storage.tables[this.table].filter(this.filter)
    }

    on(cb) {
        this.listeners.push(cb)
    }

    off(cb) {
        this.listeners = this.listeners.filter(cbi => cbi !== cb)
    }

    fire() {
        this.listeners.slice().forEach(cb => cb(this))
    }
    toString() {
        return `${this.table} where ${this.filter}`
    }
}

const storage = new QueryStorage()
const good = storage.insert('projects',{ title:'good',})
const forget = storage.insert('projects',{ title:'forget'})
const trash = storage.insert('projects',{ title:'trash'})

storage.insert("items", {id: 1,
    title: 'first, that I can forget',
    notes:'this is some notes: https://www.mozilla.com/',
    tags: ['foo'],
    project:forget.id
})
storage.insert("items", {id: 2, title: 'second is good', tags: ['foo','bar'], project:good.id})
storage.insert("items", {id: 3, title: 'third is good', tags: ['bar'], project:good.id})

const ALL_PROJECTS = storage.createQuery('projects',() => true)

function App() {
    const [selection,setSelection] = useState([trash])
    const [query,setQuery] = useState(storage.createEmptyQuery())
    const [selItem,setSelItem] = useState(null)

    return <HBox>
        <VBox>
            <ListView query={ALL_PROJECTS} selected={selection} onSelect={(project)=>{
                setSelection([project])
                setQuery(storage.createQuery('items',(item)=>item.project === project.id))
            }}/>
            <button className={'primary'} onClick={() => {
                storage.insert('items', {
                    title: 'empty item',
                    tags: [],
                    project:good.id
                })
            }}>add
            </button>
        </VBox>
        <ListView query={query} selected={selItem} onSelect={(item)=>setSelItem(item)}/>
    </HBox>
}

export default App
