import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'node:path';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
// import mongoose from 'mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
// import { Todo } from './todoSchema.js';
// import { User } from './userSchema.js';
// import { error } from 'node:console';

interface IUser {
    _id?: ObjectId;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ITodo {
    _id?: ObjectId;
    text: string;
    checked: boolean;
    userId: ObjectId;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });
const MONGO_URI = process.env.MONGO_URI || '';
const client = new MongoClient(MONGO_URI);
const db = client.db('2');
const usersCollection = db.collection<IUser>('users');
const todoCollection = db.collection<ITodo>('todos')

client.connect()
    .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
    .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

declare module 'express-session' {
    interface SessionData {
        user: {
            id: string;
            email: string;
        };
    }
}

// mongoose.connect(MONGO_URI)
//     .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
//     .catch((err) => console.error('MongoDB connection error:', err));

const FileStore = sessionFileStore(session);
app.use(session({
    store: new FileStore({}),
    secret: 'some-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use(cors({
    origin: 'http://localhost:8085',
    credentials: true,
    optionsSuccessStatus: 200
}));
/* app.use(express.static(path.join(__dirname, 'public')));*/

app.use(express.json());

const routes: Record<string, (req: Request, res: Response) => Promise<unknown> | unknown> = {
    'login': async (req: Request, res: Response) => {
        const { login, pass } = req.body;
        if (typeof login !== 'string' || typeof pass !== 'string') {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        try {
            const user = await usersCollection.findOne({ email: login.toLowerCase().trim() });

            if (!user || pass.trim() !== user.password) return res.status(400).json({ error: `User not found or password is incorrect` });
            req.session.user = {
                id: user._id!.toString(),
                email: login.toLocaleLowerCase().trim(),
            };
            res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    'logout': async (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: 'some trouble, couldn`t log out' });
            res.clearCookie('connect.sid');
            res.status(200).json({ ok: true });
        })
    },
    'register': async (req: Request, res: Response) => {
        const { login, pass } = req.body;

        if (!login || !pass) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        try {
            const cleanEmail = login.toLowerCase().trim();

            const exitsUser = await usersCollection.findOne({ email: cleanEmail });

            if (exitsUser) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }
            const result = await usersCollection.insertOne({
                email: cleanEmail,
                password: pass.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            req.session.user = {
                id: result.insertedId.toString(),
                email: cleanEmail,
            };

            return res.status(200).json({ ok: true });
        } catch (error: any) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    'getItems': async (req: Request, res: Response) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const userDB = await todoCollection.find({ userId }).toArray();
            const userItems = userDB.map(todo => ({
                id: todo._id!.toString(),
                text: todo.text,
                checked: todo.checked
            }));
            res.status(200).json({ items: userItems });
        }
        catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    'deleteItem': async (req: Request, res: Response) => {
        const data = req.body;
        if (!data || !data.id) {
            return res.status(400).json({ error: 'No id' });
        }
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const result = await todoCollection.deleteOne({ _id: new ObjectId(data.id), userId });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Item not found' });
            }
            res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    'createItem': async (req: Request, res: Response) => {
        const { text } = req.body;
        console.log(`${JSON.stringify(text)}`);
        if (!req.session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ error: `Field 'text' is required` });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const newTodo = await todoCollection.insertOne({
                text: text.trim(),
                checked: false,
                userId,
            });
            res.status(201).json({ id: newTodo.insertedId.toString() });
        }
        catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    'editItem': async (req: Request, res: Response) => {
        const data = req.body;
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        if (!data || !data.id || typeof data.text !== 'string' || typeof data.checked !== 'boolean') {
            return res.status(400).json({ error: 'Data is not full' });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const todoId = new ObjectId(data.id);
            const result = await todoCollection.updateOne(
                { _id: todoId, userId },
                {
                    $set: {
                        text: data.text.trim(),
                        checked: data.checked
                    }
                },
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Item not found' });
            }
            return res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
};

app.post('/api/v2/router', async (req, res) => {
    const action = req.query.action;

    if (typeof action !== 'string') {
        return res.status(400).json({ error: 'invalid or missing action parameter' });
    }

    const handler = routes[action];
    if (!handler) {
        return res.status(400).json({ error: 'unknown action' });
    }
    await handler(req, res);
});

app.route('/api/v1/items')
    .get(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const userDB = await todoCollection.find({ userId }).toArray();
            const userItems = userDB.map(todo => ({
                id: todo._id!.toString(),
                text: todo.text,
                checked: todo.checked
            }));
            res.status(200).json({ items: userItems });
        }
        catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    })
    .post(async (req, res) => {
        const { text } = req.body;
        console.log(`${JSON.stringify(text)}`);
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        } 
        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ error: `Field 'text' is required` });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const newTodo = await todoCollection.insertOne({
                text: text.trim(),
                checked: false,
                userId,
            });
            res.status(201).json({ id: newTodo.insertedId.toString() });
        }
        catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    })
    .put(async (req, res) => {
        const data = req.body;
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        if (!data || !data.id || typeof data.text !== 'string' || typeof data.checked !== 'boolean') {
            return res.status(400).json({ error: 'Data is not full' });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const result = await todoCollection.updateOne(
                { _id: new ObjectId(data.id), userId },
                {
                    $set: {
                        text: data.text.trim(),
                        checked: data.checked,
                    }
                }

            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Item not found' });
            }
            return res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    })
    .delete(async (req, res) => {
        const data = req.body;
        if (!data || !data.id) {
            return res.status(400).json({ error: 'No id' });
        }
        if (!req.session.user) {
            return res.status(403).json({ error: 'forbidden' });
        }
        try {
            const userId = new ObjectId(req.session.user.id);
            const result = await todoCollection.deleteOne({ _id: new ObjectId(data.id), userId });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Item not found' });
            }
            res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    });


app.post('/api/v1/login', async (req, res) => {
    const { login, pass } = req.body;
    if (typeof login !== 'string' || typeof pass !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await usersCollection.findOne({ email: login.toLowerCase().trim() });

        if (!user || pass.trim() !== user.password) return res.status(400).json({ error: `User not found or password is incorrect` });

        req.session.user = {
            id: user._id!.toString(),
            email: login.toLowerCase().trim(),
        };
        res.status(200).json({ ok: true });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/v1/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'some trouble, couldn`t log out' });
        res.clearCookie('connect.sid');
        res.status(200).json({ ok: true });
    })
});

app.post('/api/v1/register', async (req, res) => {

    const { login, pass } = req.body;

    if (!login || !pass) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const existUser = await usersCollection.findOne({ email: login.toLowerCase().trim() });
        if (existUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const newUser = await usersCollection.insertOne({
            email: login.toLowerCase().trim(),
            password: pass.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        req.session.user = {
            id: newUser.insertedId.toString(),
            email: login.toLowerCase().trim(),
        };

        return res.status(200).json({ ok: true });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
}).on('error', (err) => {
    console.error('Server error:', err);
});