/*

next for the mail app:

focus manager
    only let one stack have focus at a time
    enter on mail item shifts focus to the reader view so we can scroll it
    composing an email shifts focus to the composer view
    track the previous focus so we can return to it

fm.requestFocus(ref)
    //warns if no tab index?
    //makes ref have the focus. puts onto focus stack
fm.releaseFocus(ref)
    //returns focus to the previous owner
    //pops off the focus stack
fm.replaceFocus(ref)
    //gets focus
    //replaces current item in the focus stack

need a sense of the master focus, which is a parent component
don't steal focus if you aren't the master focus

use a FocusContext
request if your FC has the current focus
if not, then don't request the focus

forward dialog
    drop down of names to forward to. then send it. email is in
    separate pane so you can add notes above it
    disappears then releases focus

move popup
    use generic list view
    press enter to choose the folder, dismiss, then move
    press escape to escape and return focus to previous

 */
import {QueryStorage, StorageContext, useObjectUpdate, useQuery} from './storage.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {
    GenericListView,
    HBox,
    makeClassNames,
    PopupContainer,
    PopupContext,
    PopupManager,
    Spacer,
    Toolbar,
    VBox
} from './layout.js'
import {AlertOctagon, Archive, ArrowRight, CornerUpLeft, FileText, Folder, Inbox, Layout, Trash2} from "react-feather"
import "./mail.css"
import * as faker from "faker"

const MailAppContent = () => {
    const storage = useContext(StorageContext)
    const [mail, setMail] = useState(null)
    const [folder, setFolder] = useState(null)
    const generateFakeEmail = () => {
        storage.insert('mails', {
            sender: faker.name.firstName(),
            receiver: 'Josh Marinacci',
            subject: faker.random.word(),
            body: faker.random.words(20),
            deleted: false,
            folder: 'inbox',
            timestamp: faker.date.recent().getTime(),
            read: false,
            archived: false
        })
    }
    const [composing, setComposing] = useState(false)
    const composeNewEmail = () => {
        const newMail = storage.insert('mails', {
            sender: 'Josh Marinacci',
            receiver: 'no one',
            subject: '',
            body: '',
            deleted: false,
            archived: false,
            read: false,
            folder: 'drafts',
            timestamp: Date.now()
        })
        setComposing(true)
        setMail(newMail)
    }
    const reply = () => {
        console.log("replying")
        const newMail = storage.insert('mails', {
            sender: 'Josh Marinacci',
            receiver: mail.sender,
            subject: `Re: ${mail.subject}`,
            body: mail.body,
            deleted: false,
            archived: false,
            read: false,
            folder: 'drafts',
            timestamp: Date.now()
        })
        setComposing(true)
        setMail(newMail)
    }
    const handlers = useActionScope('global', {
        'compose-new-mail': composeNewEmail,
        'reply': reply
    })
    let mainView = ""
    if (composing) {
        mainView = <ComposingMailView mail={mail} done={() => {
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
            <FoldersListView selectedFolder={folder} setFolder={setFolder}/>
            <MailsListView setMail={setMail} selectedMail={mail} selectedFolder={folder}/>
            {mainView}
            <VBox>
                <h3>Shortcuts</h3>
                <ShortcutsPanel/>
            </VBox>
        </HBox>
        <PopupContainer/>
    </VBox>
}

function FolderIcon({folder}) {
    if (folder.title === 'inbox') return <Inbox/>
    if (folder.title === 'trash') return <Trash2/>
    if (folder.title === 'drafts') return <FileText/>
    if (folder.title === 'all') return <Archive/>

    return <Folder/>
}

function FolderItemView({item}) {
    return <>
        <FolderIcon folder={item}/>
        <b>{item.title}</b>
    </>
}

function FoldersListView({selectedFolder, setFolder}) {
    const storage = useContext(StorageContext)
    const [afq] = useState(() => storage.createQuery('folders', f => true))
    return <GenericListView
        className={'folders-list-view'}
        ItemTemplate={FolderItemView}
        selectedItem={selectedFolder}
        setSelectedItem={setFolder}
        query={afq}
    />
}

function MailsListView({setMail, selectedMail, selectedFolder}) {
    const storage = useContext(StorageContext)
    const [q, setQ] = useState(() => {
        return storage.createQuery('mails', (m) => !m.deleted && !m.archived && m.folder === 'inbox')
    })
    useEffect(() => {
        if (selectedFolder) {
            if (selectedFolder.title === 'trash') {
                return setQ(storage.createQuery('mails', m => m.deleted === true))
            }
            if (selectedFolder.title === 'archived') {
                return setQ(storage.createQuery('mails', m => m.archived === true))
            }
            setQ(storage.createQuery('mails', m => (m.folder === selectedFolder.title
                && !m.deleted
                && !m.archived
            )))
        }
    }, [selectedFolder])
    const pm = useContext(PopupContext)
    const handlers = useActionScope('list',{
        'delete-selected-emails': () => {
            storage.update('mails',selectedMail,'deleted',true)
        },
        'archive-selected-emails': () => {
            storage.update('mails',selectedMail,'archived', true)
        },
        'move-selected-emails': (e) => {
            pm.show(e.target, <MoveMailPopup mail={selectedMail}/>)
        },
        'reply': () => {
            console.log("replying to this mail")
        },
    })
    return <div onKeyDown={handlers.onKeyDown}>
        <GenericListView
        className={"mails-list-view"}
        ItemTemplate={MailItemView}
        ItemClassName={"mails-item-view"}
        selectedItem={selectedMail}
        setSelectedItem={setMail}
        query={q}
        />
    </div>
}

function PopupFolderItem({item, moveMail}) {
    return <span onClick={moveMail}>{item.title}</span>
}
function MoveMailPopup({mail}) {
    const storage = useContext(StorageContext)
    const [q] = useState(() => storage.createQuery('folders', f => !f.special))
    const [folders] = useQuery(q)
    const [selFolder, setSelFolder] = useState(folders[0])
    const pm = useContext(PopupContext)
    const moveMail = () => {
        console.log('moving',mail,'to',selFolder)
        pm.hide()
    }
    const exit = () => {
        pm.hide()
    }
    return <GenericListView
        style={{
            minWidth:'10rem'
        }}
        query={q}
        ItemTemplate={PopupFolderItem}
        selectedItem={selFolder}
        setSelectedItem={setSelFolder}
        actionHandlers={{
            'move-mail':moveMail,
            'exit':exit,
        }}
        ItemProps={{
            moveMail:moveMail
        }}
        />
}

function MailItemView({item}) {
    const mail = item
    const storage = useContext(StorageContext)
    const [setProp] = useObjectUpdate(storage, 'mails', mail)
    let css = makeClassNames({
        mail: true,
        hbox: true,
        deleted: mail.deleted,
        read: mail.read
    })
    const clickedMail = () => {
        setProp('read', true)
    }
    return <div className={css} onClick={clickedMail}>
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
    if (!mail) return <VBox className={'reading-mail-view'}>no message selected</VBox>
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
    const [q] = useState(() => {
        return storage.createQuery('mails', (m) => m === mail)
    })
    const [realmailarray] = useQuery(q)

    const [setProp] = useObjectUpdate(storage, 'mails', mail)
    const editedTo = (e) => setProp('receiver', e.target.value)
    const editedSubject = (e) => setProp('subject', e.target.value)
    const editedBody = (e) => setProp('body', e.target.value)

    const handlers = useActionScope('compose', {
        'send-mail': done
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

export const MailApp = ({}) => {
    function makeInitialData() {
        function makeFolder(title) {
            storage.insert('folders', {title: title, special: false})
        }

        storage.insert('folders', {title: 'inbox', special: true})
        storage.insert('folders', {title: 'drafts', special: true})
        makeFolder('readme')
        makeFolder('orders')
        storage.insert('folders', {title: 'trash', special: true})
        storage.insert('folders', {title: 'all', special: true})

        function makeMail(sender, subject, body) {
            storage.insert("mails", {
                sender: sender,
                receiver: 'Josh Marinacci',
                subject: subject,
                body: body,
                deleted: false,
                folder: 'inbox',
                timestamp: Date.now(),
                read: false,
                archived: false
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
    storage.load().then(() => {
        if (storage.isEmpty()) makeInitialData()
    })
    // })

    AM.registerKeys([
        //list scope
        {action: 'delete-selected-emails', key: 'backspace', scope: 'list'},
        {action: 'move-selection-prev', key: 'ArrowUp', scope: 'list'},
        {action: 'move-selection-prev', key: 'k', scope: 'list'},
        {action: 'move-selection-next', key: 'ArrowDown', scope: 'list'},
        {action: 'move-selection-next', key: 'j', scope: 'list'},
        {action: 'archive-selected-emails', key: 'a', scope: 'list'},
        {action: 'reply', key: 'r', scope: 'list'},
        {action: 'move-selected-emails', key: 'm', scope: 'list'},

        //compose scope
        {action: 'send-mail', scope: 'compose', key: 'd', alt: true},
        //global scope
        {action: 'compose-new-mail', scope: 'global', key: 'n', alt: true},
        {action: 'reply', scope: 'global', key: 'r', alt: true},

        // popup-list scope
        {action: 'exit', scope: 'list', key: 'escape'},
        {action: 'move-mail', scope:'list', key:'enter'},
    ])
    const PM = new PopupManager()
    return <ActionContext.Provider value={AM}>
        <StorageContext.Provider value={storage}>
            <PopupContext.Provider value={PM}>
                <MailAppContent/>
            </PopupContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

