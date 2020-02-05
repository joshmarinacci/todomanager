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
    constructor(prefix) {
        this.prefix = prefix
        this.tables = {}
        this._idcount = 1000
        this.queries = []
        this.lf = localforage
        this.empty = true
    }
    load() {
        return this.lf.getItem(this.prefix+'tables').then((tables)=>{
            console.log(this.prefix + ": loaded old tables",tables)
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
    clear() {
        return this.lf.clear().then(()=>{
            this.empty = true
        })
    }
    isEmpty() { return this.empty}

    save() {
        this.lf.setItem(this.prefix+'tables',this.tables)
            .then(()=>this.lf.setItem("ID_COUNTER",this._idcount))
            .then(()=>console.log(`done saving ${this.prefix}`))
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
        this.refresh(table)
        this.save()
    }
    delete(table,filter) {
        if (!this.tables[table]) this.tables[table] = []
        this.tables[table] = this.tables[table].filter((it)=>!filter(it))
        this.save()
        this.refresh(table)
    }
    find(table,filter) {
        if (!this.tables[table]) this.tables[table] = []
        return this.tables[table].find(filter)
    }
    findAll(table,filter) {
        if (!this.tables[table]) this.tables[table] = []
        return this.tables[table].filter(filter)
    }

    refresh(table) {
        this.queries.forEach(query => {
            if (query.table === table) {
                query.fire()
            }
        })
    }

    createQuery(table, filter, sort) {
        const query = new Query(this, table, filter, sort)
        this.queries.push(query)
        return query
    }

    createEmptyQuery() {
        return new EmptyQuery()
    }
}

export class Query {
    constructor(storage, table, filter, sort) {
        this.storage = storage
        this.listeners = []
        this.table = table
        this.filter = filter
        this.sort = sort
    }

    results() {
        if(!this.storage.tables[this.table]) return []
        const res = this.storage.tables[this.table].filter(this.filter)
        if(this.sort) res.sort(this.sort)
        return res
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
    const [items, setItems] = useState(query?query.results():[])
    useEffect(() => {
        setItems(query?query.results():[])
        const update = () => setItems(query.results())
        if(query)query.on(update)
        return () => {
            if(query) query.off(update)
        }
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