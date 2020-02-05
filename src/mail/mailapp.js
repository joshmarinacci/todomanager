import {QueryStorage, StorageContext, useObjectUpdate, useQuery} from '../common/storage.js'
import {ActionContext, AM, useActionScope} from '../common/actions.js'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {
    FocusContext, FocusManager,
    GenericListView,
    HBox,
    makeClassNames,
    PopupContainer,
    PopupContext,
    PopupManager,
    Spacer,
    Toolbar,
    useAutofocusRefWhenSelected,
    VBox
} from '../common/layout.js'
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
            subject: faker.random.words(3),
            body: faker.lorem.paragraphs(20),
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
    return <div onKeyDown={handlers.onKeyDown} className={'mailapp-grid'}>
        <Toolbar className={'grid-toolbar'}>
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
        <FoldersListView selectedFolder={folder} setFolder={setFolder}/>
        <MailsListView setMail={setMail} selectedMail={mail} selectedFolder={folder}/>
        {mainView}
        {/*<VBox>*/}
        {/*    <h3>Shortcuts</h3>*/}
        {/*    <ShortcutsPanel/>*/}
        {/*</VBox>*/}
        <PopupContainer/>
    </div>
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
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list', {
        'focus-prev-master': () => {
        },
        'focus-next-master': () => {
            fm.setMasterFocus('mails')
        },
    })
    return <div onKeyDown={handlers.onKeyDown} style={{
        gridColumn: '1/2',
        gridRow:'2/3',
        display:'flex',
        flexDirection:'column',
        overflowY:'scroll'
    }}>
        <GenericListView
            className={'folders-list-view'}
            ItemTemplate={FolderItemView}
            selectedItem={selectedFolder}
            setSelectedItem={setFolder}
            focusName={'folders'}
            query={afq}
        />
    </div>
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
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'delete-selected-emails': () => {
            storage.update('mails',selectedMail,'deleted',true)
        },
        'archive-selected-emails': () => {
            storage.update('mails',selectedMail,'archived', true)
        },
        'move-selected-emails': (e) => {
            fm.pushMasterFocus('popup')
            pm.show(e.target, <MoveMailPopup mail={selectedMail}/>)
        },
        'reply': () => {
            console.log("replying to this mail")
        },
        'focus-prev-master': () => {
            fm.setMasterFocus('folders')
        },
        'focus-next-master': () => {
            fm.setMasterFocus('viewer')
        },
    })
    return <div onKeyDown={handlers.onKeyDown} style={{
        gridColumn:'2/3',
        gridRow:'2/3',
        display:'flex',
        flexDirection:'column',
        overflowY:'scroll',
        alignItems:'stretch',
    }}>
        <GenericListView
        className={"mails-list-view"}
        ItemTemplate={MailItemView}
        ItemClassName={"mails-item-view"}
        selectedItem={selectedMail}
        setSelectedItem={setMail}
        focusName={'mails'}
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
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'move-mail':()=>{
            console.log('moving',mail,'to',selFolder)
            fm.popMasterFocus()
            pm.hide()
        },
        'exit':()=>{
            console.log("exiting")
            fm.popMasterFocus()
            pm.hide()
        },
    })

    return <div className={"move-mail-popup-wrapper"} onKeyDown={handlers.onKeyDown}>
        <GenericListView
            query={q}
            ItemTemplate={PopupFolderItem}
            selectedItem={selFolder}
            setSelectedItem={setSelFolder}
            focusName={'popup'}
            ItemProps={{
                moveMail:()=>{
                    console.log("clicked")
                    console.log('moving',mail,'to',selFolder)
                    fm.popMasterFocus()
                    pm.hide()
                }
            }}
            />
    </div>
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
    const fm = useContext(FocusContext)
    const clickedMail = () => {
        console.log("clicked on a mail")
        setProp('read', true)
        fm.setMasterFocus('mails')
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
    const fm = useContext(FocusContext)
    const vbox = useRef()
    useAutofocusRefWhenSelected(vbox,true,'viewer')
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
            fm.setMasterFocus('mails')
        },
        'focus-next-master': () => {
        },
    })
    if (!mail) return <VBox className={'reading-mail-view'}
                            onKeyDown={handlers.onKeyDown}
                >no message selected</VBox>
    return <div className={'reading-mail-view'}
                onKeyDown={handlers.onKeyDown}
                tabIndex={0}
                ref={vbox}
                 style={{
                     gridColumn:'3/4',
                     gridRow:'2/3',
                     overflow:'scroll',
                     display:'flex',
                     flexDirection:'column',
                     alignItems:'stretch',
                 }}
            >
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
    </div>
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
        {action: 'focus-prev-master',  key:'ArrowLeft',  scope:'list'  },
        {action: 'focus-next-master',  key:'ArrowRight',  scope:'list'  },
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
                <FocusContext.Provider value={new FocusManager()}>
                    <MailAppContent/>
                </FocusContext.Provider>
            </PopupContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}
