// run with node create-icons.js
const { createCanvas } = require('canvas')
const fs = require('fs')

function makeIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1a120b'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#c9a87c'
  ctx.font = `italic ${size * 0.35}px Georgia`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('e', size/2, size/2)
  return canvas.toBuffer('image/png')
}

fs.writeFileSync('pwa-192.png', makeIcon(192))
fs.writeFileSync('pwa-512.png', makeIcon(512))
console.log('done')
