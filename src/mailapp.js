/*

next for the mail app:

data:
    // get lib to generate fake emails. one new email every time you press a 'fake' button in the status bar
    // archived boolean. means it doesn't show up in any folder, but it is in the archive and can be searched
    // read boolean. if unread use a brighter color of text

general
    // make Spacer work in toolbars
    // vertically center icons and text in toolbars

folder list
    // select folder by clicking
    --nav with arrows
mail list
    //changes query based on selected folder
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
    * //creates a new mail document in the drafts folder, populated w/ the email we are replying to
    * //set composing to true
    * //the rest of the compose things

forward dialog
    drop down of names to forward to. then send it

reader view
    make delete, archive, and forward keys work


move popup
    make popup folder list keyboard nav work. reuse some bindings?
    press enter to choose the folder, dismiss, then move
    press escape to escape



 */
import {QueryStorage, StorageContext, useObjectUpdate, useQuery} from './storage.js'
import {ActionContext, AM, ShortcutsPanel, useActionScope} from './actions.js'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {HBox, makeClassNames, PopupContainer, PopupContext, PopupManager, Spacer, Toolbar, VBox} from './layout.js'
import {Folder, Inbox, Trash2, CornerUpLeft, Archive, ArrowRight, FileText, Layout, AlertOctagon} from "react-feather"
import "./mail.css"
import * as faker from "faker"

function GenericListItemView ({
    item,
    selectedItem,
    setSelectedItem,
    ItemTemplate,
                              }) {

    const isSelected = item===selectedItem
    const cname = makeClassNames({
        selected: isSelected,
        'generic-list-item': true,
        hbox:true,
    })
    const hbox = useRef()
    useEffect(()=>{
        if(hbox.current && item===selectedItem) hbox.current.focus()
    },)

    return <div
        ref={hbox}
        className={cname}
        onClick={() => setSelectedItem(item)}
        tabIndex={0}
    >
        <ItemTemplate item={item}/>
    </div>
}

function GenericListView({
                             className,
                             query,
                             ItemTemplate,
                             selectedItem,
                             setSelectedItem
                         }) {
    const [data] = useQuery(query)
    const css = makeClassNames({
        'generic-list-view': true
    })
    const handlers = useActionScope('list', {
        'move-selection-prev': () => {
            const index = data.indexOf(selectedItem)
            if (index > 0) {
                setSelectedItem(data[index - 1])
            }
        },
        'move-selection-next': () => {
            const index = data.indexOf(selectedItem)
            if (index < data.length - 1) {
                setSelectedItem(data[index + 1])
            }
        }
    })
    return <div className={'scroll-wrapper'}>
        <div className={css + " " + className} onKeyDown={handlers.onKeyDown}>
            {data.map((item, i) => {
                return <GenericListItemView
                    key={i}
                    item={item}
                    setSelectedItem={setSelectedItem}
                    ItemTemplate={ItemTemplate}
                    selectedItem={selectedItem}
                />
            })}
        </div>
    </div>
}

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
    const [mails] = useQuery(q)
    const selectMail = (mail) => setMail(mail)
    const handlers = useActionScope('list', {
        'move-selection-prev': () => {
            const index = mails.indexOf(selectedMail)
            if (index > 0) {
                selectMail(mails[index - 1])
            }
        },
        'move-selection-next': () => {
            const index = mails.indexOf(selectedMail)
            if (index < mails.length - 1) {
                selectMail(mails[index + 1])
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

function MoveMailPopup({mail}) {
    const storage = useContext(StorageContext)
    const [q] = useState(() => storage.createQuery('folders', f => !f.special))
    const [folders] = useQuery(q)
    const [selFolder, setSelFolder] = useState(folders[0])
    const pm = useContext(PopupContext)
    console.log("folders are", folders)
    const handlers = useActionScope('popup-list', {
        'move-selection-prev': () => {
            const index = folders.indexOf(selFolder)
            if (index > 0) {
                setSelFolder(folders[index - 1])
            }
        },
        'move-selection-next': () => {
            const index = folders.indexOf(selFolder)
            if (index < folders.length - 1) {
                setSelFolder(folders[index + 1])
            }
        },
        'exit': () => pm.hide()
    })
    const popup = useRef()
    useEffect(() => {
        console.log("current is", popup.current)
        if (popup.current) popup.current.focus()
    }, [popup.current])
    return <ul ref={popup} className={"popup-list"} onKeyDown={handlers.onKeyDown} tabIndex={0}>
        {folders.map(f => {
            const css = makeClassNames({selected: selFolder === f})
            return <li className={css} key={f.id}>{f.title}</li>
        })}
    </ul>
}

function MailItemView({mail, selectedMail, selectMail}) {
    const storage = useContext(StorageContext)
    const [setProp] = useObjectUpdate(storage, 'mails', mail)
    let css = makeClassNames({
        mail: true,
        hbox: true,
        selected: mail === selectedMail,
        deleted: mail.deleted,
        read: mail.read
    })
    const clickedMail = () => {
        setProp('read', true)
        selectMail(mail)
    }
    const pm = useContext(PopupContext)
    const handlers = useActionScope('list', {
        'delete-selected-emails': () => setProp('deleted', true),
        'archive-selected-emails': () => setProp('archived', true),
        'reply': () => {
            console.log("replying to this mail")
        },
        'move-selected-emails': () => {
            pm.show(hbox.current, <MoveMailPopup mail={mail}/>)
        }
    })
    const hbox = useRef()
    useEffect(() => {
        if (hbox.current && mail === selectedMail) hbox.current.focus()
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
        {action: 'exit', scope: 'popup-list', key: 'escape'}
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

