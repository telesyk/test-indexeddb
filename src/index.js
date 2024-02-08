let store

const DATA = {
  dbName: 'CarsDB',
  initDBindex: 1,
  reqError: 'Faild open indexedDB',
  form: {
    model: 'carModel',
    color: 'carColor',
  },
}

if (!localStorage.getItem('db_index')) localStorage.setItem('db_index', DATA.initDBindex.toString())

const indexedDB = window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

const formElement = document.querySelector('#cars')
formElement.addEventListener('submit', handleSubmit)

// first init
onGetData()

// UI functionality
function updateStore(data) {
  if (!data) return
  store = data
  updateUI(data)
}

function updateUI(dataArr) {
  const containerElement = document.querySelector('.container')
  const currentTableElement = document.querySelector('[table]')

  if (!!currentTableElement) currentTableElement.remove()
  
  const tableElement = document.createElement('table')
  const tableHeadElement = document.createElement('thead')
  const tableBodyElement = document.createElement('tbody')
  const rowHeadElement = document.createElement('tr')

  const titles = ['#', 'Model', 'Color']
  
  titles.map(item => {
    const cellElement = document.createElement('th')
    cellElement.textContent = item
    rowHeadElement.appendChild(cellElement)
  })
  tableHeadElement.append(rowHeadElement)

  dataArr.map((item, index) => {
    const rowElement = document.createElement('tr')
    rowElement.innerHTML = `
      <td>${index + 1}</td><td>${item.maker}</td><td>${item.color} <span style="display: inline-block; width: 16px; height: 16px; background-color: ${item.color}"><span></td>
    `
    tableBodyElement.append(rowElement)
  })

  tableElement.appendChild(tableHeadElement)
  tableElement.appendChild(tableBodyElement)

  containerElement.appendChild(tableElement)
}

function clearFields() {
  const allInputs = Array.from(formElement.getElementsByTagName('input'))
  allInputs.forEach(element => element.value = '')
}

function handleSubmit(event) {
  const formData = new FormData(formElement);

  event.preventDefault()

  onUpdateDB({
    color: String(formData.get(DATA.form.color)).trim().toLowerCase(),
    model: String(formData.get(DATA.form.model)).trim().toLowerCase(),
  })

  clearFields()

  onGetData()
}

// DB functionality
function initDBRequest(dbIndex) {
  const request = indexedDB.open(DATA.dbName, dbIndex);

  request.onerror = (event) => {
    console.error(DATA.reqError)
    console.error(event)
  }

  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains('cars')) {
      const store = db.createObjectStore("cars", {autoIncrement: true})
      store.createIndex("car_color", ["color"], {unique: false})
      store.createIndex("car_maker", ["maker"], {unique: false})
    }
  }

  return request;
}

function onUpdateDB(car) {
  const localDBIndex = Number(localStorage.getItem('db_index'))
  const newDBIndex  = localDBIndex + 1
  localStorage.setItem('db_index', newDBIndex.toString())
  
  const request = initDBRequest(newDBIndex)
  
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction("cars", "readwrite")
    const store = transaction.objectStore("cars")
  
    store.put({
      color: car.color,
      maker: car.model.substring(0,1).toUpperCase().concat(car.model.substring(1))
    })
  
    transaction.oncomplete = () => db.close()
  }
}

function onGetData() {
  const currentDBIndex = Number(localStorage.getItem('db_index'))
  const request = initDBRequest(currentDBIndex)
  
  request.onsuccess = () => {
    const db = request.result
    const transaction = db.transaction("cars", "readonly")
    const store = transaction.objectStore("cars")

    const allDataQuery = store.getAll()

    allDataQuery.onsuccess = () => {
      updateStore(allDataQuery.result)
    }

    transaction.oncomplete = () => db.close()
  }
}
