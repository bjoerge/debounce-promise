# debounce-promise

[![NPM](https://nodei.co/npm/debounce-promise.png)](https://nodei.co/npm/debounce-promise/)

Create a debounced version of a promise returning function

## Install

    npm i -S debounce-promise


## Usage example

```js

var debounce = require('debounce-promise')

function expensiveOperation(value) {
  return Promise.resolve(value)
}

var saveCycles = debounce(expensiveOperation, 100)

;[1,2,3,4].forEach(function(num) {
  return saveCycles('call no #' + num).then(function(value) {
    console.log(value)
  })
})

// Will only call expensiveOperation once with argument `4` and print:
//=> call no #4
//=> call no #4
//=> call no #4
//=> call no #4
```

### With leading=true

```js
var debounce = require('debounce-promise')

function expensiveOperation(value) {
  return Promise.resolve(value)
}

var saveCycles = debounce(expensiveOperation, 100, {leading: true})

;[1,2,3,4].forEach(function(num) {
  return saveCycles('call no #' + num).then(function(value) {
    console.log(value)
  })
})

//=> call no #1
//=> call no #1
//=> call no #1
//=> call no #1
```

## Api
`debounce(func, [wait=0], [{leading: true|false})`

Returns a debounced version of `func` that delays invoking until after `wait` milliseconds. Set `leading: true` if you 
want to call `func` immediately and use the value from the first call for all subsequent promises
