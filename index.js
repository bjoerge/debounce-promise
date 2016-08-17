/* global setTimeout, clearTimeout */
export default function debounce(fn, wait = 0, {leading = false} = {}) {
  let nextArgs
  let pending
  let resolve
  let reject
  let timer
  return function (...args) {
    nextArgs = args
    if (!pending) {
      if (leading) {
        pending = fn.apply(this, nextArgs)
      } else {
        pending = new Promise((_resolve, _reject) => {
          resolve = _resolve
          reject = _reject
        })
      }
    }
    clearTimeout(timer)
    timer = setTimeout(run.bind(this, nextArgs, resolve, reject), getWait(wait))
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
