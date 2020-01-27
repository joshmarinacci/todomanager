import {createContext, useEffect, useState} from 'react'

import * as localforage from "localforage"

export class EmptyQuery {
    results() {
        return []
    }

    on() {
    }

    off() {
    }

    toString() {
        return `empty []`
    }
}

export class QueryStorage {
    constructor() {
        this.tables = {}
        this._idcount = 1000
        this.queries = []
        this.lf = localforage
        this.empty = true
    }
    load() {
        return this.lf.getItem('tables').then((tables)=>{
            console.log("loaded old tables",tables)
            if(tables) {
                this.tables = tables
                Object.keys(this.tables).forEach((table)=>this.refresh(table))
                this.empty = false
            }
            return this.lf.getItem('ID_COUNTER').then(count=>{
                console.log("loaded the count",count)
                this._idcount = count
            })
        })
    }
    isEmpty() { return this.empty}

    save() {
        this.lf.setItem('tables',this.tables)
            .then(()=>this.lf.setItem("ID_COUNTER",this._idcount))
            .then(()=>console.log("done saving"))
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
                    query.fire()
                }
            }
        })
        this.save()
        return obj
    }
    update(table, obj, prop, value) {
        obj[prop] = value
        this.queries.forEach(query => {
            if(query.table === table) {
                query.fire()
            }
        })
        this.save()
    }
    delete(table,filter) {
        this.tables[table] = this.tables[table].filter((it)=>!filter(it))
        this.save()
        this.refresh(table)
    }
    find(table,filter) {
        return this.tables[table].find(filter)
    }

    refresh(table) {
        this.queries.forEach(query => {
            if (query.table === table) {
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

export class Query {
    constructor(storage, table, filter) {
        this.storage = storage
        this.listeners = []
        this.table = table
        this.filter = filter
    }

    results() {
        if(!this.storage.tables[this.table]) return []
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


export function useQuery (query)  {
    const [items, setItems] = useState(query.results())
    useEffect(() => {
        setItems(query.results())
        const update = () => setItems(query.results())
        query.on(update)
        return () => query.off(update)
    }, [query])
    return [
        items
    ]
}

export function useObjectUpdate(storage,table, item) {
    return [
        (key,value)=>{
            storage.update(table,item,key,value)
        }
    ]
}

export const StorageContext = createContext()
