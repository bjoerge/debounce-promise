/* global setTimeout, clearTimeout */
export default function debounce (fn, wait = 0, {leading = false} = {}) {
  let nextArgs
  let pending
  let timer
  return function (...args) {
    nextArgs = args
    let onTimeout
    if (pending) {
      onTimeout = run.bind(this, nextArgs, pending)
    } else {
      pending = defer()
      onTimeout = run.bind(this, nextArgs, pending)
      if (leading) {
        onTimeout()
        onTimeout = clear
      }
    }
    clearTimeout(timer)
    timer = setTimeout(onTimeout, getWait(wait))
    return pending.promise
  }

  function run (_nextArgs, deferred) {
    fn.apply(this, _nextArgs).then(v => {
      deferred.resolve(v)
      clear()
    }, err => {
      deferred.reject(err)
      clear()
    })
  }

  function clear () {
    nextArgs = null
    pending = null
    timer = null
  }

  function getWait (_wait) {
    if (typeof _wait === 'function') {
      return _wait()
    }
    return _wait
  }
}

function defer () {
  const deferred = {}
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })
  return deferred
}
