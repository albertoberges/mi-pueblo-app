import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { sha256, base64url, challengeFor, randomVerifier, extractCode, buildAuthUrl } from './spotify-auth.js'

test('sha256 coincide con node:crypto', () => {
  for (const s of ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'x'.repeat(200), randomVerifier()]) {
    assert.deepEqual(sha256(s), [...createHash('sha256').update(s).digest()])
  }
})

test('challenge PKCE igual al de referencia', () => {
  const v = randomVerifier()
  assert.equal(challengeFor(v), createHash('sha256').update(v).digest('base64url'))
  assert.equal(base64url([0xff, 0xee]), Buffer.from([0xff, 0xee]).toString('base64url'))
})

test('extractCode', () => {
  assert.equal(extractCode('http://127.0.0.1:8888/callback?code=AQB_x-1234567890abcdefghij&state=1'), 'AQB_x-1234567890abcdefghij')
  assert.equal(extractCode('AQB_x-1234567890abcdefghij'), 'AQB_x-1234567890abcdefghij')
  assert.equal(extractCode('http://127.0.0.1:8888/callback?error=access_denied'), null)
})

test('URL de autorización', () => {
  const u = new URL(buildAuthUrl(' abc ', randomVerifier()))
  assert.equal(u.searchParams.get('client_id'), 'abc')
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256')
})
