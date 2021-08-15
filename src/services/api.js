const axios = require('axios');
const moment = require('moment');

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/{midsizeName}/scoreboard';
const STANDING_URL = 'https://site.api.espn.com/apis/v2/sports/soccer/{midsizeName}/standings';

const sleep = (second) => new Promise((resolve) => setTimeout(resolve, second * 1000));

const allCompetitions = require('../data/competitions.json');
const selectedScoreboardCompetitions = [
  'ENG.1',
  'ESP.1',
  'ITA.1',
  'GER.1',
  'ENG.FA',
  'ENG.LEAGUE_CUP',
  'ESP.COPA_DEL_REY',
  'ITA.COPPA_ITALIA',
  'GER.AUDI_CUP',
  'FRA.COUPE_DE_FRANCE',
  'UEFA.CHAMPIONS',
  'UEFA.CHAMPIONS_QUAL',
  'UEFA.EUROPA',
  'UEFA.EUROPA_QUAL',
  'FIFA.CWC',
  'FIFA.WORLD',
  'UEFA.EURO',
  'UEFA.EUROQ',
  'CONMEBOL.AMERICA',
  'CONCACAF.NATIONS.LEAGUE',
  'FIFA.WORLDQ.CONMEBOL',
  'FIFA.WORLDQ.CONCACAF',
  'FIFA.FRIENDLY',
  'FIFA.WORLDQ.AFC',
  'FIFA.WORLDQ.UEFA',
  'FIFA.WORLDQ.CAF',
  'FIFA.WORLDQ.OFC',
  'CLUB.FRIENDLY',
  'CONCACAF.GOLD',
  'UEFA.NATIONS',
  'CAF.NATIONS',
  'CAF.NATIONS_QUAL',
  'CAF.CHAMPIONSHIP',
  'FIFA.CONFEDERATIONS',
  'ITA.SUPER_CUP',
  'UEFA.SUPER_CUP',
  'ESP.SUPER_CUP',
  'FRA.SUPER_CUP',
  'GER.SUPER_CUP',
  'ENG.CHARITY',
  'GER.PLAYOFF.RELEGATION',
  'FRA.1.PROMOTION.RELEGATION',
];

const selectedStandingCompetitions = [
  'ENG.1',
  'ESP.1',
  'ITA.1',
  'GER.1',
  'FRA.1',
  'UEFA.EURO',
  'UEFA.CHAMPIONS',
  // 'FIFA.WORLD',
];
const scoreboardCompetitions = allCompetitions.filter((com) => selectedScoreboardCompetitions.includes(com.midsizeName));
const standingCompetitions = allCompetitions.filter((com) => selectedStandingCompetitions.includes(com.midsizeName));

const reformatTeam = (data) => ({
  id: data.id,
  name: data.team.name,
  shortName: data.team.shortDisplayName,
  logo: data.team.logo,
  score: data.score,
  winner: data.winner,
  form: data.form,
  statistics: data.statistics,
});

const getDataScoreBoard = async (midsizeName, date) => {
  const { data: responseData } = await axios.get(`${SCOREBOARD_URL.replace('{midsizeName}', midsizeName)}`, {
    params: { dates: date }
  });
  const scoreboard = {};
  const league = responseData.leagues[0];
  scoreboard.name = league.name;
  scoreboard.code = league.midsizeName;
  scoreboard.matches = [];
  for (let event of responseData.events) {
    const { competitors } = event.competitions[0];
    const { status  } = event;
    const homeTeam = reformatTeam(competitors.find((com) => com.homeAway === 'home'));
    const awayTeam = reformatTeam(competitors.find((com) => com.homeAway === 'away'));
    scoreboard.matches.push({
      eventId: event.id,
      homeTeam,
      awayTeam,      
      status: {
        state: status.type.state,
        clock: status.clock,
        displayClock: status.displayClock,
        detail: status.type.detail,
        completed: status.type.completed,
      },
      date: event.date, 
    });
  }
  return scoreboard;
};

const fetchScoreBoards = async (date) => {
  if (!date) date = moment().format('YYYYMMDD');
  const min1Day = moment(date).subtract(1, 'days').format('YYYYMMDD');
  date = `${min1Day}-${date}`;
  const competitions = [];
  const promises = [];
  for (let availableCompetition of scoreboardCompetitions) {
    const { midsizeName } = availableCompetition;
    promises.push(getDataScoreBoard(midsizeName, date));
  }
  const scoreboards = await Promise.all(promises);
  for (let scoreboard of scoreboards) {
    // const scoreboard = await getDataScoreBoard(midsizeName, date);
    if (scoreboard.matches.length <= 0) continue; 
    competitions.push(scoreboard);
  }
  return competitions;
};

const fetchStandings = async (season) => {
  let competitions = [];
  const promises = [];
  for (let availableCompetition of standingCompetitions) {
    const { midsizeName, hasStandings, id } = availableCompetition;
    promises.push(axios.get(`${STANDING_URL.replace('{midsizeName}', midsizeName)}`, {
      params: { season }
    }));
  }
  const standings = await Promise.all(promises);
  for (let { data: responseData } of standings) {
    const { children } = responseData;
    for (let child of children) {
      const competition = {};
      competition.id = responseData.id;
      competition.name = responseData.name;
      competition.season = child.abbreviation;
      competition.fullName = child.name;
      competition.standings = child.standings.entries.map((ent) => ({
        teamId: ent.team.id,
        name: ent.team.name,
        shortName: ent.team.shortDisplayName,
        logo: ent.team.logos[0].href,
        description: ent.note ? ent.note.description : '',
        rank: ent.stats.find((stat) => stat.type === 'rank').value,
        play: ent.stats.find((stat) => stat.type === 'gamesplayed').value,
        win: ent.stats.find((stat) => stat.type === 'wins').value,
        draw: ent.stats.find((stat) => stat.type === 'ties').value,
        loss: ent.stats.find((stat) => stat.type === 'losses').value,
        gf: ent.stats.find((stat) => stat.type === 'pointsfor').value,
        ga: ent.stats.find((stat) => stat.type === 'pointsagainst').value,
        gd: ent.stats.find((stat) => stat.type === 'pointdifferential').value,
        point: ent.stats.find((stat) => stat.type === 'points').value,
        rankchange: ent.stats.find((stat) => stat.type === 'rankchange').value,
        deduction: ent.stats.find((stat) => stat.type === 'deductions').value,
        summary: ent.stats.find((stat) => stat.type === 'total').summary,
      }));
      const groupName = competition.season.match(/Group\s[A-Z]/);
      if (groupName && groupName.length) {
        competition.season = groupName[0];
      }
      competition.standings = competition.standings.sort((a, b) => a.rank - b.rank);
      competition.code = 
      competitions.push(competition);
    }
  }
  return competitions;
};

const fetchEvent = async (midsizeName, eventId) => {
  const { data: responseData } = await axios.get(`${SCOREBOARD_URL.replace('{midsizeName}', midsizeName)}/${eventId}`);
  const competition = responseData.competitions[0];
  let { competitors, venue } = competition;
  if (venue) {
    venue = {
      venueId: venue.id,
      name: venue.fullName,
      capacity: venue.capacity,
      address: venue.address.city + ', ' + venue.address.country,
    }
  } else {
    venue = null
  }
  const { status  } = responseData;
  const homeTeam = reformatTeam(competitors.find((com) => com.homeAway === 'home'));
  const awayTeam = reformatTeam(competitors.find((com) => com.homeAway === 'away'));
  let homeScore = 0;
  let awayScore = 0;
  const event = {
    eventId: responseData.id,
    attendance: competition.attendance,
    venue: venue,
    homeTeam,
    awayTeam,
    status: {
      state: status.type.state,
      clock: status.clock,
      displayClock: status.displayClock,
      detail: status.type.detail,
      completed: status.type.completed,
    },
    date: responseData.date,
    events: competition.details.map((detail) => {
      const { scoreValue } = detail;
      if (scoreValue > 0) {
        if (detail.team.id == homeTeam.id) {
          homeScore += scoreValue;
        } else {
          awayScore += scoreValue;
        }
      }
      let player = null;
      if (detail.athletesInvolved) {
        player = detail.athletesInvolved.map((ath) => ({
          playerId: ath.id,
          fullName: ath.fullName,
          shortName: ath.shortName,
          position: ath.position,
          teamId: ath.teamId,
        }));
      }
      return {
        name: detail.type.text,
        time: detail.clock.displayValue,
        timeInSecond: detail.clock.value,
        scoringPlay: detail.scoringPlay,
        scoreValue: detail.scoreValue,
        redCard: detail.redCard,
        penaltyKick: detail.penaltyKick,
        yellowCard: detail.yellowCard,
        ownGoal: detail.ownGoal,
        shootout: detail.shootout,
        teamId: detail.team.id,
        homeScore,
        awayScore,
        player,
      }
    }),
  };
  return event;
};

exports.fetchScoreBoards = fetchScoreBoards;
exports.fetchStandings = fetchStandings;
exports.fetchEvent = fetchEvent;
