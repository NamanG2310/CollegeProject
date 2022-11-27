const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
const { user } = require('pg/lib/defaults');

const database = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: '8520',
        database: 'facereco'
    }
});

database.select('*').from('users');

const app = express();


// const databases = {
//     user: [
//         {
//             id: '123',
//             name: 'khushi',
//             email: 'khushi@gmail.com',
//             password: 'khush12',
//             entries: 0,
//             joined: new Date()
//         },
//         {
//             id: '124',
//             name: 'naman',
//             email: 'naman@gmail.com',
//             password: 'namu12',
//             entries: 0,
//             joined: new Date()
//         }
//     ]
// }

app.use(bodyparser.json());
app.use(cors());

app.get('/', (req, res) => {
    console.log('success');
})

app.post('/signin', (req, res) => {
    const {email, password}=req.body;
    if(!email||!password){
        return res.status(400).json('incorrect form submission');
     }
    database.select('email','hash').from('login')
    .where('email','=',email)
    .then(data=> {
        const isvalid = bcrypt.compareSync(password, data[0].hash);
        if(isvalid){
           return database.select('*').from('users')
            .where('email','=',email)
            .then(user=> {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        }else{
            res.status(400).json('wrong credential')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, password, name } = req.body;
    if(!email||!name||!password){
       return res.status(400).json('incorrect form submission');
    }
    const hash = bcrypt.hashSync(password);
    database.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0].email,
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0]);
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })


        .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    database.select('*').from('user').where({ id })
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.status(400).json('Not found')
            }
        })
        .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    database('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0].entries);
        })
        .catch(err => res.status(400).json('unable to get count'))
})

app.listen(3001, () => {
    console.log('app is running on 3001');
})