/* global setTimeout */
import {test} from 'tap'
import debounce from '../index'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
test('returns the result of the latest operation ', async t => {
  const debounced = debounce(async (value) => value, 100)
  const promises = ['foo', 'bar', 'baz', 'qux'].map(debounced)
  const results = await* promises

  t.deepEqual(results, ['qux', 'qux', 'qux', 'qux'])
})

test('if leading=true, the value from the first promise is used', async t => {
  const debounced = debounce(async (value) => value, 100, {leading: true})
  const promises = ['foo', 'bar', 'baz', 'qux'].map(debounced)
  const results = await* promises

  t.deepEqual(results, ['foo', 'foo', 'foo', 'foo'])
})

test('do not call the given function repeatedly', async t => {
  let callCount = 0
  const debounced = debounce(async () => callCount++, 100)
  await* [1, 2, 3, 4].map(debounced)
  t.equal(callCount, 1)
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
