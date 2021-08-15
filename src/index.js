'use strict';

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const ejsMate = require('ejs-mate');
const moment = require('moment');


const { name: appName, env, port } = require('./configs');
const { NotFoundError } = require('./utils/error')

const app = express();

app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.moment = moment;
  res.locals.appName = appName;
  next();
});

app.get('/', async (req, res, next) => {
  try {
    res.render('home');
  } catch (error) {
    next(error);
  }
});

app.use('/api', require('./routes/api'));

// not found handler
app.use((req, res, next) => next(new NotFoundError()));

// error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = 'Internal Server Error' } = err;
  const errData = { message };
  if (env !== 'production') {
    // console.error(err);
    console.error(err && err.response);
    errData.stack = err.stack;
  }
  return res.status(statusCode).json(errData);
});

app.listen(port, () => console.log(`Server running on PORT ${port}`));
