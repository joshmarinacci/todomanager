import {useEffect, useState} from 'react'

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
        return obj
    }
    update(table, obj, prop, value) {
        obj[prop] = value
        this.queries.forEach(query => {
            if(query.table === table) {
                query.fire()
            }
        })
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
