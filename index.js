/* global setTimeout, clearTimeout */
export default function debounce (fn, wait = 0, {leading = false, accumulate = false} = {}) {
  let nextArgs = []
  let pending
  let timer
  return function debounced (...args) {
    const nextIdx = nextArgs.length
    nextArgs[nextIdx] = args
    let onTimeout
    let wasLeading = false
    if (pending) {
      onTimeout = callOriginal.bind(this, nextArgs, pending)
    } else {
      pending = defer()
      onTimeout = callOriginal.bind(this, nextArgs, pending)
      if (leading) {
        onTimeout()
        nextArgs = []
        onTimeout = clear
        wasLeading = true
      }
    }
    clearTimeout(timer)
    timer = setTimeout(onTimeout, getWait(wait))
    if (accumulate) {
      const _pending = pending
      if (wasLeading) {
        pending = defer()
      }
      return _pending.promise.then(res => res[nextIdx])
    }
    return pending.promise
  }

  function callOriginal (args, deferred) {
    const returnValue = accumulate ? fn.call(this, args) : fn.apply(this, args[args.length - 1])
    returnValue.then(v => {
      deferred.resolve(v)
      clear()
    }, err => {
      deferred.reject(err)
      clear()
    })
  }

  function clear () {
    nextArgs = []
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
