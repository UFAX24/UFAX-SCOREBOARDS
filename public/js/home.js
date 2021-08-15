let dataStandings = [];
let dataScoreboards = [];
let eventSelected = {};
const BLANK_LOGO = '/icons/blank-shield.png';

const containerStanding = document.querySelector('.home-container-item.standing');
const containerScoreboard = document.querySelector('.home-container-item.scoreboard');

const containerHeaderStanding = containerStanding.querySelector('.home-container-title');
const containerHeaderScoreboard = containerScoreboard.querySelector('.home-container-title');

const standingContent = containerStanding.querySelector('.home-container-content');
const scoreboardContent = containerScoreboard.querySelector('.home-container-content');

const dateFormat = 'YYYYMMDD';
const dateNow = moment().format(dateFormat);

const datePicker = new Pikaday({
  field: document.getElementById('datepicker-scoreboard'),
  format: dateFormat,
  setDefaultDate: true,
  defaultDate : new Date(),
  maxDate: moment().add(1, 'years').toDate(),
  toString(date, format) {
    const now = moment();
    const dateSelected = moment(date);
    const yesterday = now.clone().subtract(1, 'days').format(format);
    const tomorrow = now.clone().add(1, 'days').format(format);
    const isToday = now.format(format) === dateSelected.format(format);
    const isYesterday = yesterday === dateSelected.format(format);
    const isTomorrow = tomorrow === dateSelected.format(format);
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    if (isTomorrow) return 'Tomorrow';
    return dateSelected.format('dddd, MMM DD YYYY');
  },
  onSelect: async function (data) {
    const dateSelected = moment(data).format(dateFormat);
    await fetchDataScoreboard(dateSelected);
  },
  onDraw: function() {
    document.querySelector('.pika-prev').innerText = '<';
    document.querySelector('.pika-next').innerText = '>';
  }
});

const controlFunction = async function (event) {
  if (this.getAttribute('data-type') === 'standing') {
    const currentIndex = Number(containerHeaderStanding.getAttribute('data-index'));
    let newIndex;
    if (this.getAttribute('data-value') === 'left') {
      newIndex = currentIndex - 1;
      if (currentIndex - 1 < 0) {
        newIndex = dataStandings.length - 1;
      }
    } else {
      newIndex = currentIndex + 1;
      if (currentIndex + 1 >= dataStandings.length) {
        newIndex = 0;
      }
    }    
    const loader = new Loader(standingContent);
    loader.show(true);
    disabledRecursively(containerHeaderStanding);
    setTimeout(() => {
      setStanding(dataStandings, newIndex);
      loader.hide();
      disabledRecursively(containerHeaderStanding, true);
    }, 500);
  } else {
    const datePickerValue = new Date(datePicker.getDate());
    let newDateValue = '';
    if (this.getAttribute('data-value') === 'left') {
      newDateValue = moment(datePickerValue).subtract(1, 'days');
    } else {
      newDateValue = moment(datePickerValue).add(1, 'days');
    }
    datePicker.setMoment(newDateValue);
  }
};

const arrowControls = document.querySelectorAll('.arrow-control');
for (let i = 0; i < arrowControls.length; i++) {
  arrowControls[i].addEventListener('click', controlFunction, false);
}

scoreboardContent.addEventListener('click', function (event) {
  const matchContainer = event.target.closest('.match-container');
  const code = matchContainer.getAttribute('data-code');
  const eventId = matchContainer.getAttribute('data-eventId');
  const competition = matchContainer.getAttribute('data-competition');

  fetchDataEvent(code, eventId, competition);
});

const disabledRecursively = (element, isEnable = false) => {
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    disabledRecursively(child, isEnable);
    if (isEnable) {
      child.removeAttribute('disabled');
    } else {
      child.setAttribute('disabled', true);
    }
  }
}

const setStanding = (dataStandings, index) => {
  containerHeaderStanding.querySelector('span').innerText = dataStandings[index].name + ' ' + dataStandings[index].season;
  containerHeaderStanding.setAttribute('data-index', index);
  let tbodyContent = '';
  for (let dataStanding of dataStandings[index].standings) {
    let classTd = '';
    const description = dataStanding.description;
    if (description.toLowerCase().includes('champions league')) {
      classTd = 'bg-ucl';
    } else if (description.toLowerCase().includes('europa league')) {
      classTd = 'bg-uel';
    } else if (description.toLowerCase().includes('europa conference ')) {
      classTd = 'bg-uecl';
    } else if (description.toLowerCase().includes('relegation ')) {
      classTd = 'bg-relegated';
    }
    tbodyContent += `
      <tr>
        <td class="${classTd}" title="${description}">${dataStanding.rank}</td>
        <td>
            <img class="match-team-logo" src="${dataStanding.logo || BLANK_LOGO}">
            ${dataStanding.shortName}
        </td>
        <td>${dataStanding.play}</td>
        <td>${dataStanding.win}</td>
        <td>${dataStanding.draw}</td>
        <td>${dataStanding.loss}</td>
        <td>${dataStanding.gd}</td>
        <td>${dataStanding.gf}-${dataStanding.ga}</td>
        <td>${dataStanding.point}</td>
      </tr>
    `;
  }
  tbodyContent += '</tr>';
  const table = `
    <table class="table-standing">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>PL</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>+/-</th>
          <th>GD</th>
          <th>PTS</th>
      </tr>
      </thead>
      <tbody>
        ${tbodyContent}
      </tbody>
    </table>
  `;
  standingContent.insertAdjacentHTML('beforeend', table);
}

const fetchDataStanding = async () => {
  const loader = new Loader(standingContent);
  loader.show(true);
  disabledRecursively(containerHeaderStanding);
  try {  
    const responseData = await fetch('/api/standings');
    dataStandings = await responseData.json();
    if (dataStandings.length) {
      setStanding(dataStandings, 0);
    }
  } catch (error) {
    alert(error.message);
  } finally {
    loader.hide();
    disabledRecursively(containerHeaderStanding, true);
  }
};

const fetchDataScoreboard = async (date) => {
  const scoreboardContent = document.querySelector('.scoreboard .home-container-content');
  disabledRecursively(containerHeaderScoreboard);
  const loader = new Loader(scoreboardContent);
  loader.show(true);
  try {
    if (!date) throw new Error('Invalid Date');
    const responseData = await fetch(`/api/scoreboards?date=${date}`);
    dataScoreboards = await responseData.json();
    if (dataScoreboards.length) {
      for (let dataScoreboard of dataScoreboards) {
        const matches = dataScoreboard.matches.filter((match) => {
          const onGoingMatch = (match.status.state === 'in');
          const matchDate = moment(match.date).format(dateFormat);
          return onGoingMatch || date === matchDate;
        });
        if (matches.length) {
          scoreboardContent.insertAdjacentHTML('beforeend', `
            <div class="competition-title">
                ${dataScoreboard.name}
            </div>
            ${matches.map((match) => (`
              <div class="match-container" data-code="${dataScoreboard.code}" data-eventId="${match.eventId}" data-competition="${dataScoreboard.name}">
                <div class="match-container-item home-team">
                    ${match.homeTeam.shortName}
                    <img class="match-team-logo" src="${match.homeTeam.logo || BLANK_LOGO}">
                </div>
                <div class="match-container-item match-result">
                    <div class="match-score">
                        <span class="home-team-score">${match.homeTeam.score}</span>
                        <span> - </span>
                        <span class="away-team-score">${match.awayTeam.score}</span>
                    </div>
                    <div class="match-time">
                      ${(() => {
                        let textClass = '';
                        let textContent = '';
                        if (match.status.state === 'pre') {
                          textContent = new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
                        } else if (match.status.state === 'in') {
                          textClass = 'text-green';
                          textContent = match.status.displayClock;
                        } else {
                          textContent = match.status.detail;
                        }
                        return `<span class=${textClass}>${textContent}</span>`;
                      })()}
                    </div>
                </div>
                <div class="match-container-item away-team">
                    <img class="match-team-logo" src="${match.awayTeam.logo || BLANK_LOGO}">
                    ${match.awayTeam.shortName}
                </div>
              </div>
            `)).join("")}
          `);
        }
      }
    }
  } catch (error) {
    alert(error.message);
  } finally {
    loader.hide();
    disabledRecursively(containerHeaderScoreboard, true);
  }
};

const createIcon = (path) => {
  const element = document.createElement('img');
  element.src = path;
};

const colorizeForm = (str = []) => {
  let content = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === 'W') {
      content += `<span class="text-green text-bold">${str[i]}</span>`;
    } else if (str[i] === 'L') {
      content += `<span class="text-red text-bold">${str[i]}</span>`;
    } else {
      content += `<span class="text-bold">${str[i]}</span>`;
    }
  }
  return content;
};

const fetchDataEvent = async (code, eventId, competition = '') => {
  const loader = new Loader(null, true);
  loader.show();
  try {  
    const responseData = await fetch(`/api/event/${code}/${eventId}`);
    eventSelected = await responseData.json();
    eventSelected.code = code;
    eventSelected.competition = competition;
    const { homeTeam, awayTeam, status, venue, date, attendance } = eventSelected;
    const matchHeaders = modal.querySelectorAll('.match-header-item');

    matchHeaders[0].querySelector('.match-header-logo').setAttribute('src', homeTeam.logo || BLANK_LOGO);
    matchHeaders[0].querySelector('span').innerHTML = homeTeam.name;
    matchHeaders[0].querySelector('div').innerHTML = colorizeForm(homeTeam.form);

    matchHeaders[1].querySelector('.home-team-score').innerHTML = homeTeam.score;
    matchHeaders[1].querySelector('.away-team-score').innerHTML = awayTeam.score;

    let textContent = '';
    let textClass = '';
    if (status.state === 'pre') {
      textContent = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    } else if (status.state === 'in') {
      textClass = 'text-green';
      textContent = status.displayClock;
    } else {
      textContent = status.detail;
    }
    matchHeaders[1].querySelector('.match-header-time').innerHTML = `<span class=${textClass}>${textContent}</span>`;

    matchHeaders[2].querySelector('.match-header-logo').setAttribute('src', awayTeam.logo || BLANK_LOGO);
    matchHeaders[2].querySelector('span').innerHTML = awayTeam.name;
    matchHeaders[2].querySelector('div').innerHTML = colorizeForm(awayTeam.form);

    const matchEventContainer = document.querySelector('.match-event');
    matchEventContainer.innerHTML = '';
    if (eventSelected.events.length) {

      for (let event of eventSelected.events) {
        let classEvent = 'home-event';
        let homeScoredClass = '';
        let awayScoredClass = '';
        if (event.teamId === awayTeam.id) {
          classEvent = 'away-event';
        }
        let iconSrc = null;
        if (event.scoreValue > 0) {
          if (event.ownGoal) {
            iconSrc = '/icons/own-goal.svg';
          } else if (event.penaltyKick) {
            iconSrc = '/icons/penalty.svg';
          } else {
            iconSrc = '/icons/goal.svg';
          }
          if (event.teamId === awayTeam.id) {
            awayScoredClass = 'text-green text-bold';
          } else {
            homeScoredClass = 'text-green text-bold';
          }
        } else if (event.yellowCard) {
          iconSrc = '/icons/yellow-card.svg';
        } else if (event.redCard) {
          iconSrc = '/icons/red-card.svg';;
        }
        matchEventContainer.insertAdjacentHTML('beforeend', `
          <div class="match-event-item ${classEvent}">
              <span class="match-event-minute">${event.time}</span>
              <span class="match-event-icon" title="${event.name}">${iconSrc ? `<img src="${iconSrc}">` : ''}</span>
              <span class="match-event-player">${event.player ? event.player[0].shortName : ''}</span>
              <span class="match-event-score">( <span class="${homeScoredClass}">${event.homeScore}</span> - <span class="${awayScoredClass}">${event.awayScore}</span> )</span>
          </div>
        `);
      }
    } else {
      matchEventContainer.insertAdjacentHTML('beforeend', `
        <div class="match-event-item no-event">
          ${status.state === 'pre' ? 'Match isn\'t started yet' : 'No events happened'}
        </div>
      `);
    }
  
    const matchDetailItems = document.querySelectorAll('.match-detail-item');
    matchDetailItems[0].querySelector('span:nth-of-type(2)').innerHTML = moment(date).format('dddd, MMMM D YYYY, HH:mm');
    matchDetailItems[1].querySelector('span:nth-of-type(2)').innerHTML = attendance;
    matchDetailItems[2].querySelector('span:nth-of-type(2)').innerHTML = competition;
    matchDetailItems[3].querySelector('span:nth-of-type(2)').innerHTML = venue ? venue.name : '-';
    openModal();
  } catch (error) {
    alert(error.message);
  } finally {
    loader.hide();
  }
};

setInterval(() => {
  // get is modal open
  if (modal.style.display === 'block') {
    const { code, eventId, competition, status } = eventSelected;
    if (status.state === 'in') {
      fetchDataEvent(code, eventId, competition);
    }
  }

  if (datePicker.toString() !== 'Today') return;
  const datePickerValue = new Date(datePicker.getDate());
  const selectedDate = moment(datePickerValue).format(dateFormat);
  fetchDataScoreboard(selectedDate);
  
}, 1000 * 60);
fetchDataScoreboard(dateNow);
fetchDataStanding();
