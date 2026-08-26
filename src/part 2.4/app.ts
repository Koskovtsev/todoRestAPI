import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'node:path';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { Todo } from './todoSchema.js';
import { User } from './userSchema.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ 
  path: path.resolve(__dirname, './.env'),
  override: true 
});
console.log('MONGO_URI зчитано:', process.env.MONGO_URI ? 'ТАК' : 'НІ');
interface Idb {
    id: number,
    text: string,
    checked: boolean,
}
declare module 'express-session' {
    interface SessionData {
        user: {
            id: string;
            email: string;
        };
    }
}

const MONGO_URI = process.env.MONGO_URI || '';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const dataBase: Idb[] = [{
    id: 22,
    text: 'someText',
    checked: true,
},
{
    id: 12,
    text: 'dvanadcyat',
    checked: false,
}];

const FileStore = sessionFileStore(session);
app.use(session({
    store: new FileStore({}),
    secret: 'some-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use(cors({
    origin: 'https://jsfiddle.net',
    optionsSuccessStatus: 200
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.route('/api/v1/items')
    .get((req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        res.status(200).json({ items: dataBase });
    })
    .post(async (req, res) => {
        const { text } = req.body;
        const userId = req.session.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ error: `Field 'text' is required` });
        }
        // const maxId = dataBase.length > 0 ? Math.max(...dataBase.map(item => item.id)) : 0;
        // const id = maxId + 1;
        // const obj: Idb = { id, text: text.trim(), checked: false };
        // const response = `generated ID: ${id}, text: ${text}`;
        const newTodo = await Todo.create({
            text: text.trim(),
            userId,
        });
        console.log('ID новоствореної тудушки:', newTodo);
        // dataBase.push(obj);
        res.status(201).json({ id: newTodo._id });
    })
    .put((req, res) => {
        const data: Idb = req.body;
        const numericId = Number(data.id);
        if (!data || typeof data.text !== 'string' || Number.isNaN(numericId) || typeof data.checked !== 'boolean') {
            return res.status(400).json({ error: 'Data is not full' });
        }
        const item = dataBase.find(elem => elem.id === numericId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        item.text = data.text.trim();
        item.checked = data.checked;

        return res.status(200).json({ ok: true });
    })
    .delete((req, res) => {
        const data = req.body;
        if (!data || data.id === undefined || Number.isNaN(Number(data.id))) return res.status(400).json({ error: 'No id, or id is not a number' });
        const index = dataBase.findIndex(elem => elem.id === Number(data.id));

        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        dataBase.splice(index, 1);
        res.status(200).json({ ok: true });
    });


app.post('/api/v1/login', async (req, res) => {
    const { login, pass } = req.body;
    if (typeof login !== 'string' || typeof pass !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: login.toLowerCase().trim() });

    if (!user || pass.trim() !== user.password) return res.status(400).json({ error: `User not found or password is incorrect` });

    req.session.user = {
        id: user._id.toString(),
        email: login.trim(),
    };
    res.status(200).json({ ok: true });
});

app.post('/api/v1/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'some trouble, couldn`t log out' });
        res.clearCookie('connect.sid');
        res.status(200).json({ ok: true });
    })
});

app.post('/api/v1/register', async (req, res) => {
    try {
        const { login, pass } = req.body;

        if (!login || !pass) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const newUser = await User.create({ email: login, password: pass });

        req.session.user = {
            id: newUser._id.toString(),
            email: newUser.email,
        };

        return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
}).on('error', (err) => {
    console.error('Server error:', err);
});