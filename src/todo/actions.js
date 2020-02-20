import {BASE_URL} from '../auth.js'
export function createQueryForProject(storage,project) {
    if(!project) return storage.createEmptyQuery()
    if(project.special) {
        if (project.title === 'today') return storage.createQuery({table: 'item', find: it => it.today === true})
        if (project.title === 'trash') return storage.createQuery({table: 'item', find: it => it.deleted === true})
        if (project.title === 'completed') return storage.createQuery({
            table: 'item',
            find: it => it.completed === true,
            sort: (a, b) => a.completedTimestamp - b.completedTimestamp
        })
    }
    return storage.createQuery({
        table: 'item',
        find: it => it.project === project._id,
        sort: (a, b) => a.sortOrder - b.sortOrder,
    })
}

export function addProject(storage) {
    return storage.makeObject('project', {
        title: 'untitled',
        special: false,
    })
}

export const copyToServer = (auth,storage) => {
    auth.fetch(`${BASE_URL}joshmarinacci/search?type=todoblob&title=primary`)
        .then(res => res.json())
        .then(data => {
            console.log("data is", data)
            let query = '?type=todoblob&mimetype=application/json&title=primary'
            if(data.results.length === 1) {
                console.log("already exists. we just want to overwrite it")
                query += '&id='+data.results[0]._id
            } else {

            }
            return storage.asJSON().then(json => {
                console.log("sending to the server",json)
                console.log("with the query",query)
                return auth.fetch(`${BASE_URL}joshmarinacci/upload/${query}`,{
                    method:'POST',
                    body:JSON.stringify(json),
                    headers: {
                        'Content-Type':'application/json'
                    }
                })
            })
        })
        .then(res => res.json())
        .then(res => {
            console.log("got result",res)
        })

}
export const copyFromServer = (auth,storage) => {
    auth.fetch(`${BASE_URL}joshmarinacci/search?type=todoblob&title=primary`)
        .then(res => res.json())
        .then(data => {
            console.log("data is",data)
            if(data.results.length !== 1) {
                console.log("too many results")
            } else {
                const d = data.results[0]
                console.log("found d",d)
                return auth.fetch(`${BASE_URL}joshmarinacci/data/${d._id}/latest/application/json/data.json`)
            }
        })
        .then(res => res.json())
        .then(res => {
            console.log("final results",res)
            storage.mergeJSON(res,(table,local,remote)=>{
                console.log("comparing",table,local,remote)
                if(table === 'project') {
                    if(!local) {
                        console.log("no local, just use the remote version",remote)
                        return remote
                    }
                    if(local.special) {
                        console.log("local is special")
                        return local
                    }
                }
                if(table === 'item') {
                    if(remote && !local) {
                        console.log("no local, using remote")
                        return remote
                    }
                    console.log("using local")
                    return local
                }
            })
        })
}
export const deleteOnServer = (auth) => {
    auth.fetch(`${BASE_URL}joshmarinacci/delete/?type=todoblob`, {
        method:'POST'
    }).then(res => res.json())
        .then(res => {
            console.log("final result",res)
        })
}

export const deleteAll = (storage) =>  storage.deleteTableData('item')
export const deleteAllProjects = (storage) =>  storage.deleteTableData('project')
export const deleteAllLocal = (storage) => storage.clearData()
export const dumpServer = (auth) => {
    auth.fetch(`${BASE_URL}joshmarinacci/search?type=todoblob`)
        .then(res => res.json())
        .then(data => {
            console.log("data is", data)
        })
}
