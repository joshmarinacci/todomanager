import {ActionContext, ActionManager, AM, useActionScope} from '../common/actions.js'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {
    DialogManager,
    DialogContext,
    FocusContext, FocusManager,
    PopupContainer,
    PopupContext,
    PopupManager,
    Spacer,
    Toolbar,
    DialogContainer, CSS, HBox
} from '../common/layout.js'
import {
    AlertOctagon,
    Archive,
    ArrowRight,
    CornerUpLeft,
    FileText,
    Layout,
    Settings,
    Trash2
} from "react-feather"
import "./mail.css"
import * as faker from "faker"
import {StorageContext, Storage} from '../common/storage2.js'
import {ReadingMailView} from './read.js'
import {ComposingMailView} from './compose.js'
import {FoldersListView, MailsListView} from './folders.js'

const storage = new Storage()
const FOLDER = storage.defineTable({
    name:'folder',
    schema: {
        title: {
            type:String,
            required:true,
        },
        special: {
            type:Boolean,
            default:false,
        },
    },
})
const MESSAGE = storage.defineTable({
    name:'message',
    schema: {
        sender: String,
        receiver:String,
        subject:String,
        body:String,
        deleted:Boolean,
        folder:FOLDER,
        timestamp:Date,
        read:Boolean,
        archived:Boolean,
    }
})

function makeInitialData() {
    storage.makeObject('folder', {title: 'inbox', special: true})
    storage.makeObject('folder', {title: 'drafts', special: true})
    storage.makeObject('folder', {title:'readme', special:false})
    storage.makeObject('folder', {title:'orders', special:false})
    storage.makeObject('folder', {title: 'trash', special: true})
    storage.makeObject('folder', {title: 'all', special: true})

    function makeMail(sender, subject, body) {
        storage.makeObject("message", {
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
}
storage.init('email',makeInitialData).then(()=>{
    console.log("mail storage is loaded")
})

export const MailApp = () => {
    const am = new ActionManager()
    am.registerKeys([
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
    return <ActionContext.Provider value={am}>
        <StorageContext.Provider value={storage}>
            <DialogContext.Provider value={new DialogManager()}>
                <PopupContext.Provider value={new PopupManager()}>
                    <FocusContext.Provider value={new FocusManager()}>
                        <MailAppContent/>
                    </FocusContext.Provider>
                </PopupContext.Provider>
            </DialogContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const SPACING = {
    'comfortable': '1.0rem',
    'tight':'0.5rem',
}
const SettingsDialog = () => {
    const dm = useContext(DialogContext)
    const css = CSS({
        dialog:'true'
    })
    const hide = () => {
        dm.hide()
    }

    const [spacing,setSpacing] = useState('comfortable')
    return <div className={css}>
        <header>Settings</header>
        <div className='body'>
            <label>change your theme</label>
            <HBox>
            <label>spacing</label>
            <select value={spacing} onChange={(e)=>{
                const v = e.target.value
                document.documentElement.style.setProperty('--spacing',SPACING[v])
                setSpacing(v)
            }}>
                <option value={"comfortable"}>comfortable</option>
                <option value={"tight"}>tight</option>
            </select>
            </HBox>
        </div>
        <footer>
            <Spacer/>
            <button onClick={hide}>done</button>
        </footer>
    </div>
}


const MailAppContent = () => {
    const storage = useContext(StorageContext)
    const [mail, setMail] = useState(null)
    const [folder, setFolder] = useState(null)
    const generateFakeEmail = () => {
        storage.makeObject('message', {
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
        const newMail = storage.makeObject('message', {
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
        const newMail = storage.makeObject('message', {
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
    const dm = useContext(DialogContext)
    const showSettings = () => {
        dm.show(<SettingsDialog/>)
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
    return <div onKeyDown={handlers.onKeyDown} className={'mailapp-grid grow'}>
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
            <button onClick={showSettings}><Settings/></button>
        </Toolbar>
        <FoldersListView selectedFolder={folder} setFolder={setFolder}/>
        <MailsListView setMail={setMail} selectedMail={mail} selectedFolder={folder}/>
        {mainView}
        <DialogContainer/>
        <PopupContainer/>
    </div>
}




