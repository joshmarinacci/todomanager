import {QueryStorage, StorageContext, useQuery} from './storage.js'
import {ActionContext, AM, ShortcutsPanel} from './actions.js'
import React, {useContext, useState} from 'react'
import {HBox, Spacer, Toolbar, VBox} from './layout.js'
import {Folder,Inbox, Trash2, CornerUpLeft, Archive, ArrowRight, FileText, Layout} from "react-feather"
import "./mail.css"

const MailAppContent = () => {
    const storage = useContext(StorageContext)
    const [mail,setMail] = useState(null)
    return <VBox>
        <Toolbar>
            {/*<SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>*/}
            <button><CornerUpLeft/>Reply</button>
            <button><FileText/> New Mail</button>
            <button><ArrowRight/> Forward</button>
            <button><Archive/> Archive</button>
            <button><Trash2/> Delete</button>
            <Spacer/>
            <button><Layout/></button>
        </Toolbar>
        <HBox className={'grow stretch'}>
            <FoldersListView/>
            <MailsListView setMail={setMail} selectedMail={mail}/>
            <ReadingMailView mail={mail}/>
            <VBox>
                <h3>Shortcuts</h3>
                <ShortcutsPanel/>
            </VBox>
        </HBox>
    </VBox>
}

function FolderIcon({folder}) {
    if(folder.title === 'inbox') return <Inbox/>
    if(folder.title === 'trash') return <Trash2/>
    return <Folder/>
}
function FoldersListView({}){
    const storage = useContext(StorageContext)
    const [afq] = useState(()=>storage.createQuery('folders',f => true))
    const [folders] = useQuery(afq)
    return <VBox className={'folders-list-view'}>
        {folders.map(folder => {
            return <HBox key={folder.id}>
                <FolderIcon folder={folder}/>
                <b>{folder.title}</b>
            </HBox>
        })}
    </VBox>
}

function MailsListView({setMail,selectedMail}) {
    const storage = useContext(StorageContext)
    const [q] = useState(()=>storage.createQuery('mails',()=>true))
    const [mails] = useQuery(q)
    const selectMail = (mail) => setMail(mail)
    return <VBox className={'mails-list-view'}>
        {mails.map(mail => {
            let selected = (mail===selectedMail)
            return <HBox key={mail.id}
                         className={selected?"selected":""}
                         onClick={()=>selectMail(mail)}>
                <b>{mail.sender}</b>
                <b>{mail.subject}</b>
            </HBox>
        })}
    </VBox>
}

function ReadingMailView({mail}) {
    if(!mail) return <VBox className={'reading-mail-view'}>no message selected</VBox>
    return <VBox className={'reading-mail-view'}>
        <HBox>
            <label>From</label>
            <b>{mail.sender}</b>
        </HBox>
        <HBox>
            <label>Subject</label>
            <b>{mail.subject}</b>
        </HBox>
    </VBox>

}
export const MailApp = ({})=> {
    function makeInitialData() {
        console.log("making")
        function makeFolder(title) {
            storage.insert('folders',{title:title,special:false})
        }
        storage.insert('folders', {title: 'inbox', special: true})
        storage.insert('folders',{title:'drafts',special:true})
        makeFolder('readme')
        makeFolder('orders')
        storage.insert('folders', {title: 'spam', special: true})
        storage.insert('folders', {title: 'trash', special: true})

        function makeMail(sender, subject, body) {
            storage.insert("mails", {
                sender: sender,
                subject: subject,
                body: body,
                deleted: false,
                folder: 'inbox'
            })
        }
        makeMail('github',
            '[MozillaReality/FirefoxReality] Fixes #2706 Remove dialog from stack',
            `Remove dialog from stack when released`)
        makeMail('Lego Ideas',
            'Weekly Digest',
            `Here's whats's happening on LEGO ideas `)
        console.log(storage)
    }
    const storage = new QueryStorage()
    storage.clear().then(()=>{
        storage.load().then(()=>{
            if(storage.isEmpty()) makeInitialData()
        })
    })


    return <ActionContext.Provider value={AM}>
        <StorageContext.Provider value={storage}>
            <MailAppContent/>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

