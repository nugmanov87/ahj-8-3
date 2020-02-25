/* eslint-disable class-methods-use-this */
import API from './Api.js';

// const api = new API('http://localhost:7070/inst');
const api = new API('https://ahj-8-3-3.herokuapp.com/inst');

function convertDate(value) {
  const rValue = value < 10 ? `0${value}` : value;
  return rValue;
}

function printData(valueDate) {
  const itemDate = new Date(valueDate);
  const date = convertDate(itemDate.getDate());
  const month = convertDate(itemDate.getMonth() + 1);
  const year = convertDate(itemDate.getFullYear());
  const hours = convertDate(itemDate.getHours());
  const minut = convertDate(itemDate.getMinutes());
  const second = convertDate(itemDate.getSeconds());
  const itemCreated = `${hours}:${minut}:${second} ${date}.${month}.${year}`;
  return itemCreated;
}

export default class Messanger {
  constructor() {
    this.url = 'wss://ahj-8-3-3.herokuapp.com/ws';
  }

  init() {
    this.elInstances = document.getElementById('instances');
    this.initWS();
    this.events();

    this.elMessanger = document.querySelector('.messanger');
    this.elInputMessage = document.querySelector('#inp-msg');
    this.elListMessages = document.querySelector('#list-msg');
    this.elMessanger.classList.remove('hidden');

    this.drawUsersList();

    window.addEventListener('beforeunload', () => {
      this.ws.close(1000, 'work end');
      api.remove(this.nameUser);
      this.drawUsersList();
    });
  }

  events() {
    this.elInstances.addEventListener('click', (event) => {
      event.preventDefault();

      const evtClassList = event.target.classList;
      if (evtClassList.contains('new-instance')) {
        api.add();
      } else if (evtClassList.contains('stop-start')) {
        const idPatch = event.target
          .closest('.instance-item')
          .querySelector('.instance-id').innerText;

        api.patch(idPatch);
      } else if (evtClassList.contains('close')) {
        const idPatch = event.target
          .closest('.instance-item')
          .querySelector('.instance-id').innerText;

        api.remove(idPatch);
      }
    });
  }

  initWS() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      console.log('connected');
    });

    this.ws.addEventListener('message', (evt) => {
      // print msg
      this.drawMessage(evt);
    });

    this.ws.addEventListener('close', (evt) => {
      console.log('connection closed', evt);
    });

    this.ws.addEventListener('error', () => {
      console.log('error');
    });
  }

  async drawUsersList() {
    const response = await api.load();
    const arrUsers = await response.json();
    // console.log(this.nameUser);
    const elListInst = document.querySelector('.instance-list');
    elListInst.innerHTML = '';
    for (const item of arrUsers) {
      const elItemUser = document.createElement('li');
      elItemUser.className = `instance-item ${item.state}`;
      elItemUser.innerHTML = `
      <span class="instance-id">${item.id}</span>
      <span class="instance-status">
        Status: 
        <span class="status"></span>
      </span>
      <span class="instance-actions">
        Actions: 
        <div class="stop-start status-icon"></div>
        <div class="close status-icon"></div>
      </span>
      `;
      elListInst.appendChild(elItemUser);
    }
  }

  drawMessage(message) {
    const { type } = JSON.parse(message.data);

    if (type === 'message') {
      const { name, msg, dateTime } = JSON.parse(message.data);

      const itemMessage = document.createElement('li');
      itemMessage.className = 'list-item-msg';

      itemMessage.innerHTML = `
      <div class="list-item-head">
        <span>${printData(dateTime)}</span>
      </div>
      <div class="list-item-msg">
      <span>Server: ${name}</span>
      INFO: ${msg}
      </div>
      `;

      if (msg === 'Created') {
        this.drawUsersList();
      }

      if (msg === 'Deleted') {
        this.drawUsersList();
      }

      if (msg === 'started' || msg === 'stopped') {
        this.drawUsersList();
      }

      this.elListMessages.appendChild(itemMessage);
      this.elListMessages.scrollTo(0, itemMessage.offsetTop);
    }
  }

  sendMessage(message) {
    // change
    if (this.ws.readyState === WebSocket.OPEN) {
      const msgC = {
        type: 'change',
        name: this.nameUser,
        msg: message,
        dateTime: new Date(),
      };
      const jsonMsgC = JSON.stringify(msgC);
      this.ws.send(jsonMsgC);

      try {
        const msg = {
          type: 'message',
          name: this.nameUser,
          msg: message,
          dateTime: new Date(),
        };
        const jsonMsg = JSON.stringify(msg);
        this.ws.send(jsonMsg);
      } catch (e) {
        console.log('err');
        console.log(e);
      }
    } else {
      // Reconnect
      console.log('reconect');
      this.ws = new WebSocket(this.url);
    }
  }
}
const messanger = new Messanger();
messanger.init();
