/*

next for the mail app:

data:
    //* get lib to generate fake emails. one new email every time you press a 'fake' button in the status bar
    //* archived boolean. means it doesn't show up in any folder, but it is in the archive and can be searched
    //* read boolean. if unread use a brighter color of text

general
    * make Spacer work in toolbars
    * vertically center icons and text in toolbars

folder list
    select folder by clicking
    nav with arrows
mail list
    changes query based on selected folder
    //nav with arrows
    //nav with j and k
    //delete key deletes the currently selected email
    //x deletes email
    //a archives email
    enter shifts focus to the reader view so we can scroll it

new mail button
    //create new mail document in the drafts folder
    //set composing to true
    //change read view to compose view, show the draft message
    //compose view has a 'save for later' and 'send now' button at the bottom
    // command D sends it
    //alt N makes a new email. if already composing then make a new one in a tab.

reply button
    * creates a new mail document in the drafts folder, populated w/ the email we are replying to
    * set composing to true
    * the rest of the compose things

forward dialog
    drop down of names to forward to. then send it

reader view
    make delete, archive, and forward keys work
 */
import {QueryStorage, StorageContext, useObjectUpdate, useQuery} from './storage.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {HBox, makeClassNames, Spacer, Toolbar, VBox} from './layout.js'
import {Folder,Inbox, Trash2, CornerUpLeft, Archive, ArrowRight, FileText, Layout, AlertOctagon} from "react-feather"
import "./mail.css"
import * as faker from "faker"

const MailAppContent = () => {
    const storage = useContext(StorageContext)
    const [mail,setMail] = useState(null)
    const generateFakeEmail = () => {
        storage.insert('mails',{
            sender: faker.name.firstName(),
            receiver: 'Josh Marinacci',
            subject: faker.random.word(),
            body: faker.random.words(20),
            deleted: false,
            folder: 'inbox',
            timestamp: faker.date.recent().getTime(),
            read: false,
            archived: false,
        })
    }
    const [composing, setComposing] = useState(false)
    const composeNewEmail = () => {
        const newMail = storage.insert('mails',{
            sender: 'Josh Marinacci',
            receiver: 'no one',
            subject: '',
            body: '',
            deleted:false,
            archived:false,
            read:false,
            folder:'drafts',
            timestamp: Date.now(),
        })
        setComposing(true)
        setMail(newMail)
    }
    const reply = () => {
        console.log("replying")
        const newMail = storage.insert('mails',{
            sender: 'Josh Marinacci',
            receiver: mail.sender,
            subject: `Re: ${mail.subject}`,
            body: mail.body,
            deleted:false,
            archived:false,
            read:false,
            folder:'drafts',
            timestamp: Date.now(),
        })
        setComposing(true)
        setMail(newMail)
    }
    const handlers = useActionScope('global',{
        'compose-new-mail':composeNewEmail,
        'reply':reply,
    })
    let mainView = ""
    if(composing) {
        mainView = <ComposingMailView mail={mail} done={()=>{
            setComposing(false)
        }}/>
    } else {
        mainView = <ReadingMailView mail={mail}/>
    }
    return <VBox onKeyDown={handlers.onKeyDown}>
        <Toolbar>
            {/*<SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>*/}
            <button><CornerUpLeft/>Reply</button>
            <button onClick={composeNewEmail}><FileText/> New Mail</button>
            <button><ArrowRight/> Forward</button>
            <button><Archive/> Archive</button>
            <button><Trash2/> Delete</button>
            <Spacer/>
            <button><Layout/></button>
            <button onClick={generateFakeEmail}><AlertOctagon/> fake</button>
        </Toolbar>
        <HBox className={'grow stretch'}>
            <FoldersListView/>
            <MailsListView setMail={setMail} selectedMail={mail}/>
            {mainView}
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
    if(folder.title === 'drafts') return <FileText/>
    if(folder.title === 'all') return <Archive/>

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
    const [q] = useState(()=>{
        return storage.createQuery('mails',(m)=>!m.deleted&&!m.archived &&m.folder==='inbox')
    })
    const [mails] = useQuery(q)
    const selectMail = (mail) => setMail(mail)
    const handlers = useActionScope('list',{
        'move-selection-prev':()=>{
            const index = mails.indexOf(selectedMail)
            if(index > 0) {
                selectMail(mails[index-1])
            }
        },
        'move-selection-next':()=>{
            const index = mails.indexOf(selectedMail)
            if(index < mails.length-1) {
                selectMail(mails[index+1])
            }
        }
    })
    return <VBox className={'mails-list-view'}
                 onKeyDown={handlers.onKeyDown}>
        <div className={'scroll'}>
        {mails.map(mail => {
            return <MailItemView key={mail.id}
                                 mail={mail}
                                 selectedMail={selectedMail}
                                 selectMail={selectMail}
            />
        })}
        </div>
    </VBox>
}

function MailItemView({mail, selectedMail, selectMail}) {
    const storage = useContext(StorageContext)
    const [setProp] = useObjectUpdate(storage,'mails',mail)
    let css = makeClassNames({
        mail:true,
        hbox:true,
        selected:mail===selectedMail,
        deleted:mail.deleted,
        read:mail.read
    })
    const clickedMail = () => {
        setProp('read',true)
        selectMail(mail)
    }
    const handlers = useActionScope('list',{
        'delete-selected-emails':()=>setProp('deleted',true),
        'archive-selected-emails':()=>setProp('archived',true),
    })
    const hbox = useRef()
    useEffect(()=>{
        if(hbox.current && mail===selectedMail) hbox.current.focus()
    })
    return <div ref={hbox} className={css}
                tabIndex={0}
                 onClick={clickedMail}
                 onKeyDown={handlers.onKeyDown}
    >
        <VBox className={'grow'}>
            <b className={'sender'}>{mail.sender}</b>
            <b className={'subject'}>{mail.subject}</b>
        </VBox>
        <b className={'timestamp'}>{new Date(mail.timestamp).toLocaleTimeString()}</b>
    </div>
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toTimeString()
}

function ReadingMailView({mail}) {
    if(!mail) return <VBox className={'reading-mail-view'}>no message selected</VBox>
    return <VBox className={'reading-mail-view'}>
        <HBox className={'subject-line'}>
            <b>{mail.subject}</b>
        </HBox>
        <HBox className={'from-line'}>
            <b>from {mail.sender}</b>
        </HBox>
        <HBox className={'receiver-line'}>
            <b>to {mail.receiver}</b>
        </HBox>
        <HBox className={'timestamp-line'}>
            <b>{formatTimestamp(mail.timestamp)}</b>
        </HBox>
        <HBox className={'body-line'}>{mail.body}</HBox>
    </VBox>
}

function ComposingMailView({mail, done}) {
    const storage = useContext(StorageContext)
    const [q] = useState(()=>{
        return storage.createQuery('mails',(m)=>m===mail)
    })
    const [realmailarray] = useQuery(q)

    const [setProp] = useObjectUpdate(storage,'mails',mail)
    const editedTo = (e) => setProp('receiver',e.target.value)
    const editedSubject = (e) => setProp('subject',e.target.value)
    const editedBody = (e) => setProp('body',e.target.value)

    const handlers = useActionScope('compose',{
        'send-mail':done
    })

    return <VBox className={'composing-mail-view'} onKeyDown={handlers.onKeyDown}>
        <HBox>
            <label>to</label>
            <input type="text" value={mail.receiver} className={'grow'}
            onChange={editedTo}/>
        </HBox>
        <HBox>
            <label>Subject</label>
            <input type="text" value={mail.subject} className='grow'
                   onChange={editedSubject}
            />
        </HBox>
        <textarea className={'grow stretch'} value={mail.body}
                  onChange={editedBody}
        />
        <HBox>
            <button onClick={done}>save for later</button>
            <button onClick={done}>send now</button>
        </HBox>
    </VBox>
}
export const MailApp = ({})=> {
    function makeInitialData() {
        function makeFolder(title) {
            storage.insert('folders',{title:title,special:false})
        }
        storage.insert('folders', {title: 'inbox', special: true})
        storage.insert('folders',{title:'drafts',special:true})
        makeFolder('readme')
        makeFolder('orders')
        storage.insert('folders', {title: 'trash', special: true})
        storage.insert('folders',{title:'all',special:true})

        function makeMail(sender, subject, body) {
            storage.insert("mails", {
                sender: sender,
                receiver:'Josh Marinacci',
                subject: subject,
                body: body,
                deleted: false,
                folder: 'inbox',
                timestamp: Date.now(),
                read:false,
                archived:false,
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
    const storage = new QueryStorage("mail")
    // storage.clear().then(()=>{
        storage.load().then(()=>{
            if(storage.isEmpty()) makeInitialData()
        })
    // })

    AM.registerKeys([
        {
            action:'delete-selected-emails',
            key:'backspace',
            scope:'list',
        },
        {
            action:'move-selection-prev',
            key:'ArrowUp',
            scope:'list',
        },
        {
            action:'move-selection-prev',
            key:'k',
            scope:'list',
        },
        {
            action:'move-selection-next',
            key:'ArrowDown',
            scope:'list',
        },
        {
            action:'move-selection-next',
            key:'j',
            scope:'list',
        },
        {
            action:'archive-selected-emails',
            key:'a',
            scope:'list',
        },
        {
            action:'reply',
            key:'r',
            scope:'list',
        },

        //compose scope
        { action:'send-mail', scope:'compose', key:'d', alt:true},
        //global scope
        { action:'compose-new-mail', scope:'global', key:'n', alt:true},
        { action:'reply', scope:'global', key:'r', alt:true}
    ])
    return <ActionContext.Provider value={AM}>
        <StorageContext.Provider value={storage}>
            <MailAppContent/>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

