const express = require('express');
const router = express.Router();
const { BadRequestError } = require('../../utils/error');
const moment = require('moment');

const { fetchScoreBoards, fetchStandings, fetchEvent } = require('../../services/api');

router.get('/scoreboards', async (req, res, next) => {
  try {
    let { date } = req.query;
    if (date && moment(date, 'YYYYMMDD', true).isValid() === false) {
      throw new BadRequestError('Invalid date specified');
    }
    if (!date) date = moment().format('YYYYMMDD');
    const scoreboards = await fetchScoreBoards(date);
    res.json(scoreboards);
  } catch (error) {
    next(error);
  }
});

router.get('/standings', async (req, res, next) => {
  try {
    const standings = await fetchStandings();
    res.json(standings);
  } catch (error) {
    next(error);
  }
});

router.get('/event/:code/:eventId', async (req, res, next) => {
  try {
    const { code, eventId } = req.params;
    if (!code || !eventId) {
      throw new BadRequestError('Invalid Parameter');
    }
    const event = await fetchEvent(code, eventId);
    res.json(event);
  } catch (error) {
    next(error);
  }
});

module.exports = router;