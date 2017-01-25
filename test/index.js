/* global setTimeout */
import {test} from 'tap'
import debounce from '../index'

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

test('returns the result of a single operation ', async t => {
  const debounced = debounce(async (value) => value, 100)
  const promise = debounced('foo')
  const result = await promise

  t.equal(result, 'foo')
})

test('returns the result of the latest operation ', async t => {
  const debounced = debounce(async (value) => value, 100)
  const promises = ['foo', 'bar', 'baz', 'qux'].map(debounced)
  const results = await Promise.all(promises)

  t.deepEqual(results, ['qux', 'qux', 'qux', 'qux'])
})

test('if leading=true, the value from the first promise is used', async t => {
  const debounced = debounce(async (value) => value, 100, {leading: true})
  const promises = ['foo', 'bar', 'baz', 'qux'].map(debounced)
  const results = await Promise.all(promises)

  t.deepEqual(results, ['foo', 'foo', 'foo', 'foo'])
})

test('do not call the given function repeatedly', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, 100)
  await Promise.all([1, 2, 3, 4].map(debounced))
  t.equal(callCount, 1)
})

test('does not call the given function again after the timeout when leading=true if executed only once', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, 100, {leading: true})
  await debounced()
  await sleep(200)
  t.equal(callCount, 1)
})

test('calls the given function again after the timeout when leading=true if executed multiple times', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, 100, {leading: true})
  await Promise.all([1, 2, 3, 4].map(debounced))
  await sleep(200)
  t.equal(callCount, 2)
})

test('waits until the wait time has passed', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, 10)
  debounced()
  debounced()
  debounced()
  t.equal(callCount, 0)
  await sleep(20)
  t.equal(callCount, 1)
})

test('supports passing function as wait parameter', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, () => 10)
  debounced()
  debounced()
  debounced()
  t.equal(callCount, 0)
  await sleep(20)
  t.equal(callCount, 1)
})

test('calls the given function again if wait time has passed', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, 10)
  debounced()

  await sleep(20)
  t.equal(callCount, 1)

  debounced()

  await sleep(20)
  t.equal(callCount, 2)
})

test('maintains the context of the original function', async t => {
  const context = {
    foo: 1,
    debounced: debounce(async function () {
      await this.foo++
    }, 10)
  }

  context.debounced()

  await sleep(20)
  t.equal(context.foo, 2)
})

test('maintains the context of the original function when leading=true', async t => {
  const context = {
    foo: 1,
    debounced: debounce(async function () {
      await this.foo++
    }, 10, {leading: true})
  }

  await context.debounced()

  t.equal(context.foo, 2)
})

test('calls debounced function with accumulates arguments', async t => {
  function squareBatch (args) {
    t.deepEqual(args, [[1], [2], [3]])
    return Promise.resolve(args.map(arg => arg * arg))
  }

  const square = debounce(squareBatch, 10, {accumulate: true})

  const one = square(1)
  const two = square(2)
  const three = square(3)

  await sleep(20)

  t.equal(await one, 1)
  t.equal(await two, 4)
  t.equal(await three, 9)
})

test('accumulate works with leading=true', async t => {
  let callNo = 1
  function squareBatch (args) {
    if (callNo === 1) {
      t.deepEqual(args, [[1]])
    }
    if (callNo === 2) {
      t.deepEqual(args, [[2], [3]])
    }
    callNo++
    return Promise.resolve(args.map(arg => arg * arg))
  }

  const square = debounce(squareBatch, 10, {leading: true, accumulate: true})

  const one = square(1)
  const two = square(2)
  const three = square(3)

  await sleep(20)

  t.equal(await one, 1)
  t.equal(await two, 4)
  t.equal(await three, 9)
})

test('calling again when function is "cold", but previous promise still pending', async t => {
  const calls = []
  async function slow (id, wait) {
    calls.push(id)
    await sleep(wait)
    return id
  }

  const slowDebounced = debounce(slow, 20)

  // this is fast
  slowDebounced('first', 10)

  // takes much longer time to finish, but that shouldn't matter
  slowDebounced('second', 200)

  await sleep(100)
  // fn is now cold again, but previous ('second') still in progress
  const thirdPromise = slowDebounced('third', 10) // hot
  const fourth = await slowDebounced('fourth', 0)  // hot

  t.same(await thirdPromise, 'fourth')
  t.same(fourth, 'fourth')
  t.same(calls, ['second', 'fourth'])
})

test('calling again an expensive promise when function is "cold", but previous expensive promise still pending', async t => {
  const calls = []
  async function slow (id, wait) {
    calls.push(id)
    await sleep(wait)
    return id
  }

  const slowDebounced = debounce(slow, 20)

  // takes lots of time to finish, but that shouldn't matter
  slowDebounced('first', 200)

  await sleep(100)
  // fn is now cold again, but previous ('first') still in progress
  const secondPromise = slowDebounced('second', 10) // hot
  const third = await slowDebounced('third', 200)  // hot and should finish after 'first'

  t.same(await secondPromise, 'third')
  t.same(third, 'third')
  t.same(calls, ['first', 'third'])
})

test('calling again when function is "cold", but previous promise still pending, leading=true', async t => {
  const calls = []
  async function slow (id, wait) {
    calls.push(id)
    await sleep(wait)
    return id
  }

  const slowDebounced = debounce(slow, 20, {leading: true})

  // this is fast
  slowDebounced('first', 10)

  // takes much longer time to finish, but that shouldn't matter
  slowDebounced('second', 200)

  await sleep(100)

  // fn is now cold again, but previous ('second') still in progress
  const thirdPromise = slowDebounced('third', 10) // hot again, on leading edge, so should resolve to third
  const fourth = await slowDebounced('fourth', 0)  // hot, should not call but resolve with 'third'

  t.same(await thirdPromise, 'third')
  t.same(fourth, 'third')
  t.same(calls, ['first', 'second', 'third'])
})
