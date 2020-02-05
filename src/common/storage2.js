/*
* Schema to define tables
* API to Create, update, delete objects. never modify objects directly
    * (freeze them somehow?)
* Create a draft object that can be manipulated before committing.
* Auto-save and load from local storage
* Hook to log all changes or do remote syncing
* Listen for changes on one object, query, or whole DB.
* Hooks to use particular class for table of objects
* Special types for sort order that handles movement for you
* Queries have updatable parameters
 */

import {createContext, useEffect, useState} from 'react'
import * as localforage from "localforage"

const ID_COUNTER_KEY = 'ID_COUNTER'
export class Storage {
    constructor() {
        this.tables = {}
        this.lf = localforage
        this._idcount = 0
        this.data = {}
        this.queries = []
    }
    log(...args) {
        console.log("STORAGE",...args)
        console.log("queries",this.queries.length)
    }
    defineTable({name,schema}) {
        this.log("making a table",name)
        this.tables[name] = {
            name:name,
            schema:schema
        }
    }
    init(prefix,generator) {
        this.prefix = prefix
        return this.lf.getItem(prefix+'data').then((data)=>{
            if(data) {
                this.log("loaded the old table data",data)
                this.data = data
            } else {
                this.log("no existing data. calling generator")
                generator(this)
            }
            return this.lf.getItem(ID_COUNTER_KEY).then(count=>{
                this.log("loaded the id counter",count)
                if(count) this._idcount = count
            })
        })
    }
    _accessTableData(name) {
        if(!this.tables[name]) throw new Error(`no table defined for ${name}`)
        if(!this.data[name]) this.data[name] = []
        return this.data[name]
    }
    makeObject(table, data) {
        this.log('making object in table',table)
        const tdata = this._accessTableData(table)
        const newObj = {}
        Object.keys(data).forEach(key=>{
            const val = data[key]
            newObj[key] = val
            // this.log(`set ${key} = ${val}`)
        })
        this._idcount++
        newObj._id = this._idcount
        tdata.push(newObj)
        this.queries.forEach(q=> q.updateIfMatch(table,newObj))
        return newObj
    }
    updateObject(table,obj,key,val) {
        this.log('updating object in table',table)
        const tdata = this._accessTableData(table)
        const uptObj = tdata.find(o => o._id === obj._id)
        uptObj[key] = val
        this.queries.forEach(q=> q.updateIfMatch(table,uptObj))
        return uptObj
    }

    removeObjects(table,toDelete) {
        this.log('removing objects in table',table)
        let tdata = this._accessTableData(table)
        tdata = tdata.filter((o)=>!toDelete(o))
        this.data[table] = tdata
        this.queries.forEach(q=> q.updateIfMatch(table,null))
    }

    createEmptyQuery() {
        return new EmptyQuery()
    }

    createQuery(opts) {
        const q = new StorageQuery(this,opts)
        this.queries.push(q)
        return q
    }
}

class EmptyQuery {
    results() { return [] }
    on() {}
    off() {}
}

class StorageQuery {
    constructor(storage,opts) {
        this.storage = storage
        this.listeners = []
        this.storage.log("making a storage query from opts",opts)
        if(!opts.table) throw new Error("query must include a table")
        this.table = opts.table
        if(!opts.find) throw new Error("query must have a find")
        this.find = opts.find
        this.storage.log(`made new query in table ${opts.table} with results`,this.results().length)
    }

    results() {
        const data = this.storage._accessTableData(this.table)
        return data.filter(this.find)
    }
    on(cb) {
        this.listeners.push(cb)
    }
    off(cb) {
        this.listeners = this.listeners.filter(c => c !== cb)
    }
    updateIfMatch(table,obj) {
        if(this.table !== table) return console.log("different table",table)
        this.listeners.forEach(cb => cb(this))
    }
}

export function useQuery (query) {
    const [items, setItems] = useState(query ? query.results() : [])
    useEffect(() => {
        console.log("updating the use query")
        setItems(query ? query.results() : [])
        const update = () => setItems(query.results())
        if (query) query.on(update)
        return () => {
            console.log("removing the use query")
            if (query) query.off(update)
        }
    }, [query])
    return items
}


export const SortOrder = "SortOrder"

export const StorageContext = createContext()
