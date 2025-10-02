/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 * - Enhanced by Ladybug System by MR UNIQUE HACKER
 */

// Auto-download required dependencies and files
async function downloadRequiredFiles() {
    const https = require('https');
    const fs = require('fs');
    const path = require('path');
    
    console.log('🚀 Knight Bot Initialization Started...');
    
    // Create required directories (EXCLUDING session folder from downloads)
    const requiredDirs = [
        './lib',
        './commands', 
        './data',
        // './session', // REMOVED - Session folder should NOT be downloaded
        './temp',
        './media',
        './plugins',
        './database',
        './assets',
        './utils',
        './logs' // Added for Ladybug error logging
    ];
    
    requiredDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
    
    // Create session directory separately (empty, for auth state only)
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session', { recursive: true });
        console.log('📁 Created session directory (empty for authentication)');
    }
    
    // Enhanced download function with better error handling
    const downloadFile = (url, filepath) => {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filepath);
            const request = https.get(url, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                } else if (response.statusCode === 302 || response.statusCode === 301) {
                    // Handle redirects
                    file.close();
                    fs.unlink(filepath, () => {});
                    downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
                } else {
                    file.close();
                    fs.unlink(filepath, () => {});
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                }
            });
            
            request.on('error', (err) => {
                file.close();
                fs.unlink(filepath, () => {});
                reject(err);
            });
            
            // Set timeout for downloads
            request.setTimeout(30000, () => {
                request.destroy();
                reject(new Error('Download timeout'));
            });
        });
    };
    
    // Required files to download (NO session files included)
    const filesToDownload = [
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/lib/myfunc.js',
            path: './lib/myfunc.js'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/lib/exif.js',
            path: './lib/exif.js'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/lib/lightweight_store.js',
            path: './lib/lightweight_store.js'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/main.js',
            path: './main.js'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/settings.js',
            path: './settings.js'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/commands/anticall.js',
            path: './commands/anticall.js'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/data/owner.json',
            path: './data/owner.json'
        },
        {
            url: 'https://raw.githubusercontent.com/mruniquehacker/knight-bot/main/package.json',
            path: './package.json'
        }
        // NOTE: Ladybug.js is created locally above
        // NOTE: Session files are NEVER downloaded for security reasons
    ];
    
    // Download missing files with progress tracking
    console.log(`📥 Checking ${filesToDownload.length} required files...`);
    let downloadCount = 0;
    let skipCount = 0;
    
    for (const file of filesToDownload) {
        if (!fs.existsSync(file.path)) {
            try {
                console.log(`📥 Downloading ${file.path}...`);
                await downloadFile(file.url, file.path);
                downloadCount++;
                console.log(`✅ Downloaded ${file.path}`);
            } catch (error) {
                console.log(`❌ Failed to download ${file.path}:`, error.message);
                console.log(`🔧 Creating fallback file...`);
                createFallbackFile(file.path);
            }
        } else {
            skipCount++;
            console.log(`✅ ${file.path} already exists`);
        }
    }
    
    console.log(`📦 Download Summary: ${downloadCount} downloaded, ${skipCount} skipped`);
    
    // Create enhanced fallback files if download fails
    function createFallbackFile(filepath) {
        const dir = path.dirname(filepath);
        const filename = path.basename(filepath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        switch (filename) {
            case 'settings.js':
                fs.writeFileSync(filepath, `
module.exports = {
    ownerNumber: "911234567890",
    botName: "KNIGHT BOT",
    version: "2.1.0",
    storeWriteInterval: 10000,
    prefix: ".",
    autoRead: true,
    autoTyping: false,
    autoRecording: false,
    autoStatus: false,
    maxMemoryUsage: 400,
    enableLadybug: true,
    sessionName: "knight-session",
    timezone: "Asia/Kolkata"
};`);
                break;
                
            case 'owner.json':
                fs.writeFileSync(filepath, '["911234567890"]');
                break;
                
            case 'myfunc.js':
                fs.writeFileSync(filepath, `
const fs = require('fs');
const axios = require('axios');

const smsg = (conn, m, store) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '');
        if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || '';
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0];
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[Object.keys(m.message[m.mtype].message)[0]] : m.message[m.mtype]);
        m.body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : '';
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0];
            m.quoted = m.quoted[type];
            if (['productMessage'].includes(type)) {
                type = Object.keys(m.quoted)[0];
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            m.quoted.mtype = type;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant) || m.quoted.chat || '';
            m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        }
    }
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, { ...options }) : conn.sendText(chatId, text, m, { ...options });
    return m;
};

module.exports = { 
    smsg,
    isUrl: (text) => text.match(new RegExp(/https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi)),
    getBuffer: async (url, options) => {
        try {
            const res = await axios({ method: "get", url, headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 }, ...options, responseType: 'arraybuffer' });
            return res.data;
        } catch (err) { return err; }
    },
    generateMessageTag: () => Math.random().toString(36).substring(7),
    getSizeMedia: (media) => media.length,
    fetch: require('axios'),
        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    formatp: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    runtime: (seconds) => {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }
};`);
                break;
                
            case 'exif.js':
                fs.writeFileSync(filepath, `
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

class Exif {
    create(packname, author, filename) {
        return new Promise((resolve, reject) => {
            const stickerPackId = packname;
            const stickerPackName = author;
            const stickerPackPublisher = '';
            const stickerPackTrayIcon = '';
            
            const json = {
                "sticker-pack-id": stickerPackId,
                "sticker-pack-name": stickerPackName,
                "sticker-pack-publisher": stickerPackPublisher,
                "sticker-pack-tray-icon": stickerPackTrayIcon
            };
            
            let length = JSON.stringify(json).length;
            const f = Buffer.alloc(length + 8 + 4);
            
            f.writeUInt32LE(20, 0);
            f.writeUInt32LE(length, 4);
            f.write(JSON.stringify(json), 8);
            
            fs.writeFile(filename, f, (err) => {
                if (err) reject(err);
                else resolve(filename);
            });
        });
    }
}

module.exports = new Exif();`);
                break;
                
            case 'lightweight_store.js':
                fs.writeFileSync(filepath, `
const { proto } = require('@whiskeysockets/baileys');

const makeInMemoryStore = () => {
    const chats = {};
    const messages = {};
    const contacts = {};
    
    return {
        chats,
        messages,
        contacts,
        
        bind(ev) {
            ev.on('chats.set', (chatsSet) => {
                for (const chat of chatsSet) {
                    chats[chat.id] = chat;
                }
            });
            
            ev.on('chats.update', (chatsUpdate) => {
                for (const chat of chatsUpdate) {
                    if (chats[chat.id]) {
                        Object.assign(chats[chat.id], chat);
                    }
                }
            });
            
            ev.on('messages.set', (messagesSet) => {
                for (const message of messagesSet) {
                    if (!messages[message.key.remoteJid]) {
                        messages[message.key.remoteJid] = {};
                    }
                    messages[message.key.remoteJid][message.key.id] = message;
                }
            });
            
            ev.on('messages.update', (messagesUpdate) => {
                for (const message of messagesUpdate) {
                    if (messages[message.key.remoteJid] && messages[message.key.remoteJid][message.key.id]) {
                        Object.assign(messages[message.key.remoteJid][message.key.id], message);
                    }
                }
            });
            
            ev.on('contacts.set', (contactsSet) => {
                for (const contact of contactsSet) {
                    contacts[contact.id] = contact;
                }
            });
        },
        
        loadMessage(jid, id) {
            return messages[jid] && messages[jid][id] ? messages[jid][id] : null;
        },
        
        writeToFile(path) {
            // Lightweight store doesn't write to file by default
            console.log('Lightweight store: writeToFile called');
        },
        
        readFromFile(path) {
            // Lightweight store doesn't read from file by default
            console.log('Lightweight store: readFromFile called');
        }
    };
};

module.exports = { makeInMemoryStore };`);
                break;
                
            case 'main.js':
                fs.writeFileSync(filepath, `
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    jidNormalizedUser, 
    getContentType,
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const { smsg } = require('./lib/myfunc');
const { makeInMemoryStore } = require('./lib/lightweight_store');

// Load settings
let settings;
try {
    settings = require('./settings');
} catch (error) {
    console.log('⚠️ Settings file not found, using defaults');
    settings = {
        ownerNumber: "911234567890",
        botName: "KNIGHT BOT",
        prefix: ".",
        autoRead: true,
        sessionName: "knight-session"
    };
}

// Initialize Ladybug Enhancement System
let ladybug;
try {
    ladybug = require('./ladybug');
    console.log('🐞 Ladybug Enhancement System loaded');
} catch (error) {
    console.log('⚠️ Ladybug system not available:', error.message);
    ladybug = null;
}

// Create store
const store = makeInMemoryStore();

async function startBot() {
    console.log(chalk.cyan('🚀 Starting Knight Bot...'));
    
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
        auth: state,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: new Map(),
        defaultQueryTimeoutMs: 60000,
    });
    
    // Bind store to connection
    store.bind(conn.ev);
    
    // Initialize Ladybug if available
    if (ladybug) {
        try {
            ladybug.init(conn);
        } catch (error) {
            console.log('⚠️ Ladybug initialization failed:', error.message);
        }
    }
    
    // Connection update handler
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(chalk.yellow('📱 QR Code generated. Scan with WhatsApp.'));
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;
                
            console.log(chalk.red('❌ Connection closed due to'), lastDisconnect?.error, chalk.yellow('Reconnecting...'), shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => startBot(), 3000);
            }
        } else if (connection === 'open') {
            console.log(chalk.green('✅ Bot connected successfully!'));
            console.log(chalk.blue(\`📱 Bot Number: \${conn.user.id.split(':')[0]}\`));
        }
    });
    
    // Credentials update handler
    conn.ev.on('creds.update', saveCreds);
    
    // Message handler
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            
            const m = smsg(conn, mek, store);
            
            // Auto-read messages
            if (settings.autoRead && !m.fromMe) {
                await conn.readMessages([m.key]);
            }
            
            // Basic command handling
            if (m.body && m.body.startsWith(settings.prefix)) {
                const command = m.body.slice(settings.prefix.length).trim().split(' ')[0].toLowerCase();
                const args = m.body.slice(settings.prefix.length + command.length).trim().split(' ');
                
                console.log(chalk.blue(\`📨 Command: \${command} from \${m.sender}\`));
                
                // Basic commands
                switch (command) {
                    case 'ping':
                        const start = Date.now();
                        const msg = await m.reply('🏓 Pinging...');
                        const end = Date.now();
                        await conn.sendMessage(m.chat, { 
                            text: \`🏓 Pong! \${end - start}ms\`, 
                            edit: msg.key 
                        });
                        break;
                        
                    case 'alive':
                        await m.reply(\`✅ \${settings.botName} is alive and running!\\n\\n📊 Status:\\n• Uptime: \${process.uptime().toFixed(2)}s\\n• Memory: \${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB\\n• Version: \${settings.version || '2.1.0'}\`);
                        break;
                        
                    case 'help':
                        await m.reply(\`🤖 \${settings.botName} Commands:\\n\\n• \${settings.prefix}ping - Check bot response\\n• \${settings.prefix}alive - Bot status\\n• \${settings.prefix}help - Show this menu\\n\\n🐞 Enhanced by Ladybug System\`);
                        break;
                        
                    default:
                        // Command not found
                        break;
                }
            }
            
        } catch (error) {
            console.log(chalk.red('❌ Message handler error:'), error.message);
        }
    });
    
    // Anti-call feature
    conn.ev.on('call', async (callUpdate) => {
        try {
            for (const call of callUpdate) {
                if (call.status === 'offer') {
                    console.log(chalk.yellow(\`📞 Incoming call from \${call.from}\`));
                    await conn.rejectCall(call.id, call.from);
                    await conn.sendMessage(call.from, { 
                        text: '❌ Calls are not allowed. This call has been automatically rejected.' 
                    });
                }
            }
        } catch (error) {
            console.log(chalk.red('❌ Anti-call error:'), error.message);
        }
    });
    
    return conn;
}

module.exports = { startBot };`);
                break;
                
            case 'anticall.js':
                fs.writeFileSync(filepath, `
// Anti-call module for Knight Bot
module.exports = {
    name: 'anticall',
    description: 'Automatically reject incoming calls',
    
    execute: async (conn, call) => {
        try {
            if (call.status === 'offer') {
                await conn.rejectCall(call.id, call.from);
                await conn.sendMessage(call.from, { 
                    text: '❌ Sorry, calls are not allowed. This call has been automatically rejected.' 
                });
                console.log(\`📞 Rejected call from \${call.from}\`);
            }
        } catch (error) {
            console.log('Anti-call error:', error.message);
        }
    }
};`);
                break;
                
            case 'package.json':
                fs.writeFileSync(filepath, `{
  "name": "knight-bot",
  "version": "2.1.0",
  "description": "Advanced WhatsApp Bot with Ladybug Enhancement System",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "whatsapp",
    "bot",
    "baileys",
    "knight",
    "ladybug"
  ],
  "author": "Professor & MR UNIQUE HACKER",
  "license": "MIT",
  "dependencies": {
    "@whiskeysockets/baileys": "^6.5.0",
    "@hapi/boom": "^10.0.1",
    "pino": "^8.15.0",
    "qrcode-terminal": "^0.12.0",
    "chalk": "^4.1.2",
    "axios": "^1.5.0",
    "fs-extra": "^11.1.1",
    "moment-timezone": "^0.5.43"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}`);
                break;
                
            default:
                fs.writeFileSync(filepath, `// Fallback file for ${filename}\nmodule.exports = {};`);
        }
        
        console.log(`🔧 Created fallback file: ${filepath}`);
    }
}

// Auto-install dependencies
async function installDependencies() {
    const { spawn } = require('child_process');
    
    console.log('📦 Installing dependencies...');
    
    return new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], { 
            stdio: 'inherit',
            shell: true 
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Dependencies installed successfully');
                resolve();
            } else {
                console.log('⚠️ Some dependencies may not have installed correctly');
                resolve(); // Continue anyway
            }
        });
        
        npm.on('error', (error) => {
            console.log('⚠️ NPM install error:', error.message);
            resolve(); // Continue anyway
        });
        
        // Timeout after 5 minutes
        setTimeout(() => {
            npm.kill();
            console.log('⚠️ NPM install timeout, continuing...');
            resolve();
        }, 300000);
    });
}

// Main initialization function
async function initialize() {
    try {
        console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    🤖 Ladybug BOT INITIALIZER 🤖              ║
║                        Version 2.1.0                        ║
║                    Enhanced by Ladybug 🐞                   ║
╚══════════════════════════════════════════════════════════════╝
        `));
        
        // Step 1: Download required files
        await downloadRequiredFiles();
        
        // Step 2: Install dependencies
        await installDependencies();
        
        // Step 3: Start the bot
        console.log('🚀 Starting Knight Bot...');
        
        // Import and start main bot
        const { startBot } = require('./main');
        await startBot();
        
    } catch (error) {
        console.log(chalk.red('❌ Initialization error:'), error.message);
        console.log(chalk.yellow('🔄 Retrying in 5 seconds...'));
        setTimeout(initialize, 5000);
    }
}

// Handle process events
process.on('uncaughtException', (error) => {
    console.log(chalk.red('❌ Uncaught Exception:'), error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
});

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Bot stopped by user'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Bot terminated'));
    process.exit(0);
});

// Start initialization
if (require.main === module) {
    initialize().catch(console.error);
}

module.exports = { initialize, downloadRequiredFiles, installDependencies };
