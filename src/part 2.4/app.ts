import express, { type Express, type Request, type Response } from 'express';

const app = express();

interface Idb {
    id: number,
    text: string,
    checked: boolean,
}

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

app.use(express.json());

app.route('/api/v1/items')
    .get((req, res) => {
        res.status(200).json({ items: dataBase });
    })
    .post((req, res) => {
        const { text } = req.body;
        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ error: `Field 'text' is required` });
        }
        const maxId = dataBase.length > 0 ? Math.max(...dataBase.map(item => item.id)) : 0;
        const id = maxId + 1;
        const obj: Idb = { id, text: text.trim(), checked: false };
        const response = `generated ID: ${id}, text: ${text}`;
        dataBase.push(obj);
        console.log(response);
        res.status(201).json({ id: id });
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


app.listen(3000, () => {
    console.log('Server is running on port 3000');
}).on('error', (err) => {
    console.error('Server error:', err);
});