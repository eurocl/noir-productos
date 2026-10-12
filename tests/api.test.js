import { test } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import jwt from 'jsonwebtoken'
import Product from '../src/models/Product.js'
import { createProductsApp } from '../src/app.js'

test('creación y eliminación comunican inventario por HTTP y compensan un fallo de persistencia', async t => {
  process.env.JWT_SECRET = 'test-jwt'
  process.env.INTERNAL_SERVICE_SECRET = 'test-service'
  const products = new Map()
  const inventory = new Map()
  let failCreate = false
  t.mock.method(Product, 'find', async () => [...products.values()])
  t.mock.method(Product, 'findById', async id => products.get(String(id)))
  t.mock.method(Product, 'create', async item => {
    if (failCreate) throw new Error('Simulated persistence failure')
    products.set(String(item._id), item)
    return item
  })
  t.mock.method(Product, 'findByIdAndDelete', async id => products.delete(String(id)))
  const stock = express()
  stock.use(express.json())
  stock.get('/stock/:id', (req, res) => res.json({ productId: req.params.id, stock: inventory.get(req.params.id) }))
  stock.use('/internal', (req, res, next) => {
    assert.equal(req.get('X-Service-Key'), process.env.INTERNAL_SERVICE_SECRET)
    next()
  })
  stock.put('/internal/stock/:id', (req, res) => {
    inventory.set(req.params.id, req.body.stock)
    res.json({ stock: req.body.stock })
  })
  stock.delete('/internal/stock/:id', (req, res) => {
    inventory.delete(req.params.id)
    res.json({ deleted: true })
  })
  const stockServer = stock.listen(0, '127.0.0.1')
  await once(stockServer, 'listening')
  t.after(() => new Promise(resolve => stockServer.close(resolve)))
  process.env.STOCK_SERVICE_URL = `http://127.0.0.1:${stockServer.address().port}`
  const server = createProductsApp().listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  const token = jwt.sign({ id: 'test-user' }, process.env.JWT_SECRET, { expiresIn: '1m' })
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const body = JSON.stringify({ name: 'Mesa', category: 'Muebles', description: 'Mesa de prueba', price: 10, image: '/mesa.jpg', stock: 4 })
  assert.equal((await fetch(base + '/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 401)
  const created = await fetch(base + '/products', { method: 'POST', headers, body })
  assert.equal(created.status, 201)
  const { product } = await created.json()
  assert.equal(inventory.get(product._id), 4)
  assert.ok(!Object.hasOwn(product, 'stock'))
  assert.equal((await fetch(base + '/products/' + product._id, { method: 'DELETE', headers })).status, 200)
  assert.equal(inventory.size, 0)
  assert.equal(products.size, 0)
  failCreate = true
  assert.equal((await fetch(base + '/products', { method: 'POST', headers, body })).status, 500)
  assert.equal(inventory.size, 0)
  assert.equal(products.size, 0)
})
