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

import {createContext, useContext, useEffect, useState} from 'react'
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
        // console.log("STORAGE",...args)
        // console.log("queries",this.queries.length)
    }
    defineTable({name,schema,fixer}) {
        // this.log("making a table",name)
        this.tables[name] = {
            name:name,
            schema:schema,
            fixer: fixer,
        }
    }
    init(prefix,generator) {
        this.prefix = prefix
        return this.lf.getItem(prefix+'data').then((data)=>{
            if(data) {
                this.log("loaded the old table data",data)
                this.data = data
                Object.keys(this.data).forEach(table => {
                    if(this.tables[table].fixer) {
                        this.data[table].forEach(obj=>{
                            this.tables[table].fixer(obj,table,this)
                        })
                    }
                })

                this.updateAllTables()
            } else {
                this.log("no existing data. calling generator")
                generator(this)
            }
            return this.lf.getItem(this.prefix+ID_COUNTER_KEY).then(count=>{
                this.log("loaded the id counter",count)
                if(count) this._idcount = count
            })
        })
    }
    save() {
        // console.log("trhing to save",this.data)
        return this.lf.setItem(this.prefix+'data',this.data)
            .catch((e)=>{
                console.log("error saving",e)
            })
    }
    asJSON() {
        return new Promise((res,rej)=>{
            res(JSON.parse(JSON.stringify(this.data)))
        })
    }
    mergeJSON(data,cb) {
        console.log("merging data from",data,'with local',this.data)
        Object.keys(this.tables).forEach(table => {
            console.log("processing table",table)
            let local = this.data[table]?this.data[table]:[]
            let remote = data[table]?data[table]:[]
            console.log("remote is",remote)
            remote.forEach(row => {
                // console.log("processing remote",row)
                const lrow = local.find(r => r._id === row._id)
                const res = cb(table,lrow,row)
                if(res) {
                    let n = local.indexOf(lrow)
                    console.log("replacing",lrow,'with',res)
                    if(n>=0) {
                        local[n] = res
                    } else {
                        local.push(res)
                    }
                }
            })
        })
        this.updateAllTables()
    }
    saveCounter() {
        return this.lf.setItem(this.prefix+ID_COUNTER_KEY,this._idcount)
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
        if(this.tables[table].fixer) this.tables[table].fixer(newObj,table,this)
        tdata.push(newObj)
        this.queries.forEach(q=> q.updateIfMatch(table,newObj))
        return this.save()
            .then(()=>this.saveCounter())
            .then(()=>newObj)
    }
    updateObject(table,obj,key,val) {
        this.log('updating object in table',table)
        const tdata = this._accessTableData(table)
        const uptObj = tdata.find(o => o._id === obj._id)
        if(uptObj) uptObj[key] = val
        this.queries.forEach(q=> q.updateIfMatch(table,uptObj))
        return this.save().then(()=>uptObj)
    }

    removeObjects(table,toDelete) {
        this.log('removing objects in table',table)
        let tdata = this._accessTableData(table)
        tdata = tdata.filter((o)=>!toDelete(o))
        this.data[table] = tdata
        this.queries.forEach(q=> q.updateIfMatch(table,null))
        return this.save()
    }

    createEmptyQuery() {
        return new EmptyQuery()
    }

    createQuery(opts) {
        const q = new StorageQuery(this,opts)
        this.queries.push(q)
        return q
    }

    updateAllTables() {
        Object.keys(this.tables).forEach(table => {
            // console.log("updating table",table)
        })
        this.queries.forEach(q => q.update())
    }
    find(table,find, sort) {
        let data = this._accessTableData(table).filter(find)
        if(sort) data.sort(sort)
        return data
    }
    findOne(table,find) {
        const res = this._accessTableData(table).filter(find)
        if(res.length >0) return res[0]
        return null
    }

    deleteTableData(table) {
        this._accessTableData(table)
        this.data[table] = []
        this.queries.forEach(q=> q.updateIfMatch(table,null))
        return this.save().then(()=>{
            console.log("deleted table",table)
        })
    }
    clearData() {
        return this.lf.removeItem(this.prefix + 'data').then(() => console.log("deleted all local data"))
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
        this.sort = opts.sort
        this.storage.log(`made new query in table ${opts.table} with results`,this.results().length)
    }

    results() {
        const data = this.storage._accessTableData(this.table)
        const d2 = data.filter(this.find)
        if(this.sort) d2.sort(this.sort)
        return d2
    }
    on(cb) {
        this.listeners.push(cb)
    }
    off(cb) {
        this.listeners = this.listeners.filter(c => c !== cb)
    }
    update() {
        this.listeners.forEach(cb => cb(this))
    }
    updateIfMatch(table,obj) {
        if(this.table !== table) return //console.log("different table",table)
        this.listeners.forEach(cb => cb(this))
    }
}

export function useQuery (query) {
    const [items, setItems] = useState(query ? query.results() : [])
    useEffect(() => {
        // console.log("updating the use query")
        setItems(query ? query.results() : [])
        const update = () => setItems(query.results())
        if (query) query.on(update)
        return () => {
            // console.log("removing the use query")
            if (query) query.off(update)
        }
    }, [query])
    return items
}


export const SortOrder = "SortOrder"

export const StorageContext = createContext()


export const useDraft = (table,note) => {
    const storage = useContext(StorageContext)
    const [temp,setTemp] = useState(()=>{
        const obj = {}
        Object.keys(note).forEach(key => {
            obj[key] = note[key]
        })
        return obj
    })
    const update = (target,val) => {
        const obj = {}
        Object.keys(note).forEach(key => {
            obj[key] = (key===target)?val:temp[key]
        })
        setTemp(obj)
    }
    const save = () => {
        console.log('saving',temp)
        Object.keys(note).forEach(key => {
            const oval = note[key]
            const nval = temp[key]
            if(!(key in temp)) return
            if(oval !== nval) {
                storage.updateObject(table,note,key,nval)
            }
        })
    }
    useEffect(()=>{
        setTemp(note)
    },[note])
    return [temp, update, save]
}

