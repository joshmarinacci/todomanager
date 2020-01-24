import React, {useEffect, useState} from 'react'
import './App.css'

const HBox = ({children, className = "", ...rest}) => {
    return <div className={"hbox " + className} {...rest}>{children}</div>
}
const VBox = ({children, className = "", ...rest}) => {
    return <div className={"vbox " + className} {...rest}>{children}</div>
}

const ListItemView = ({realItem, selected, onSelect}) => {
    const [item, setItem] = useState(realItem)
    return <HBox className={(item===selected)?"selected":""}>
        <label onClick={()=>{
            console.log('selecting the item')
            onSelect(item)
        }}>{item.title}</label>
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
        const update = () => setItems(query.results())
        query.on(update)
        return () => query.off(update)
    })
    return <VBox>
        {items.map(item => <ListItemView key={item.id} realItem={item} selected={selected} onSelect={onSelect}/>)}
    </VBox>
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
}

const storage = new QueryStorage()
storage.insert('projects',{
    title:'good',
})
const forget = storage.insert('projects',{
    title:'forget'
})
storage.insert('projects',{
    title:'trash'
})

storage.insert("items", {id: 1,
    title: 'first, that I can forget',
    notes:'this is some notes: https://www.mozilla.com/',
    tags: ['foo'],
    project:forget.id
})
storage.insert("items", {id: 2, title: 'second', tags: ['foo','bar']})
storage.insert("items", {id: 3, title: 'third', tags: ['bar']})
const INBOX_LIST = [1, 3]
const INBOX = storage.createQuery("items", (item => INBOX_LIST.includes(item.id)))
INBOX.title = 'INBOX'
const ALL = storage.createQuery('items', () => true)
const PROJECTS = storage.createQuery('projects',() => true)


function App() {
    const [selected, setSelected] = useState(INBOX)
    const [selectedItem, setSelectedItem] = useState(null)
    const [selectedQuery, setSelectedQuery] = useState(INBOX)
    return <HBox>
    <VBox>
        <ListItemView realItem={INBOX} selected={selected} onSelect={setSelected}/>
        <hr/>
        <ListView query={PROJECTS} selected={selected} onSelect={(proj)=>{
            setSelected(proj)
            console.log("new proj is",proj)
            setSelectedQuery(storage.createQuery('items',
                (item) => item.project === proj.id
            ))
        }}/>
        <button onClick={() => {
            const obj = storage.insert('items', {
                title: 'another',
                tags: []
            })
            INBOX_LIST.push(obj.id)
            storage.refresh('items')
        }}>add
        </button>
    </VBox>
        <ListView query={selectedQuery} selected={selectedItem} onSelect={setSelectedItem}/>
    </HBox>
}

export default App
