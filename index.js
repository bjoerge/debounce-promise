/* global setTimeout, clearTimeout */
export default function debounce(fn, wait = 0, {leading = false} = {}) {
  let nextArgs
  let pending
  let resolve
  let reject
  let timer
  return function (...args) {
    let onTimeout = clear
    nextArgs = args
    if (!leading) {
      if (!pending) {
        pending = new Promise((_resolve, _reject) => {
          resolve = _resolve
          reject = _reject
        })
      }
      onTimeout = run.bind(this, nextArgs, resolve, reject)
    } else if (!pending) {
      pending = fn.apply(this, nextArgs)
    }
    clearTimeout(timer)
    timer = setTimeout(onTimeout, getWait(wait))
    return pending
  }

  function run(_nextArgs, _resolve, _reject) {
    fn.apply(this, _nextArgs).then(_resolve, _reject)
    clear()
  }

  function clear() {
    nextArgs = null
    resolve = null
    reject = null
    pending = null
    timer = null
  }

  function getWait(_wait) {
    if (typeof _wait === 'function') {
      return _wait()
    }
    return _wait
  }
}
