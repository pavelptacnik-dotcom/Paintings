import './style.css'
import * as THREE from 'three'

// ========================================
// HLAVNÍ 3D OBRAZ
// ========================================

const canvasContainer = document.querySelector('.artwork-placeholder')

if (canvasContainer) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#f7f6f2')

  const camera = new THREE.PerspectiveCamera(
    35,
    canvasContainer.clientWidth / canvasContainer.clientHeight,
    0.1,
    100
  )

  camera.position.z = 5

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  })

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(
    canvasContainer.clientWidth,
    canvasContainer.clientHeight
  )

  canvasContainer.replaceChildren(renderer.domElement)

  const loader = new THREE.TextureLoader()

  loader.load(
    '/images/painting-01.jpg',
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace

      const aspect = texture.image.width / texture.image.height
      const painting = new THREE.Mesh(
        new THREE.PlaneGeometry(3 * aspect, 3),
        new THREE.MeshBasicMaterial({ map: texture })
      )

      scene.add(painting)

      let targetX = 0
      let targetY = 0

      canvasContainer.addEventListener('pointermove', (event) => {
        const rect = canvasContainer.getBoundingClientRect()

        targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.08
        targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 0.08
      })

      canvasContainer.addEventListener('pointerleave', () => {
        targetX = 0
        targetY = 0
      })

      function animate() {
        requestAnimationFrame(animate)

        painting.rotation.x += (targetX - painting.rotation.x) * 0.04
        painting.rotation.y += (targetY - painting.rotation.y) * 0.04

        renderer.render(scene, camera)
      }

      animate()
    },
    undefined,
    (error) => console.error('Obraz se nepodařilo načíst:', error)
  )

  window.addEventListener('resize', () => {
    const width = canvasContainer.clientWidth
    const height = canvasContainer.clientHeight

    if (!width || !height) return

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  })
}

// ========================================
// GALERIE OBRAZŮ
// ========================================

const paintingFiles = [
  '_DR_0541 kopie.jpg',
  '_DR_0543 kopie.jpg',
  '_DR_0544 kopie.jpg',
  '_DR_0546 kopie.jpg',
  '_DR_0547 kopie.jpg',
  '_DR_0550 kopie.jpg',
  '_DR_0551 kopie.jpg',
  '_DR_0552 kopie.jpg',
  '_DR_0553 kopie.jpg',
  '_DR_0557 kopie.jpg',
  '_DR_0559 kopie.jpg',
  '_DR_0563 kopie.jpg',
  '_DR_0564 kopie.jpg',
  '_DR_0568 kopie.jpg',
  '_DR_0573 kopie.jpg',
  '_DR_0574_A kopie.jpg',
  '_DR_0574_B kopie.jpg',
  '_DR_0574_C kopie.jpg',
  '_DR_0575_A kopie.jpg',
  '_DR_0575_B kopie.jpg',
  '_DR_0575_C kopie.jpg',
  '_DR_0576_A kopie.jpg',
  '_DR_0576_B kopie.jpg',
  '_DR_0577 kopie.jpg',
  '_DR_0581 kopie.jpg',
  '_DR_0582 kopie.jpg',
  '_DR_0584 kopie.jpg',
  '_DR_0585 kopie.jpg',
  '_DR_0587 kopie.jpg',
  '_DR_0589 kopie.jpg',
  '_DR_0592 kopie.jpg',
  '_DR_0597 kopie.jpg',
  '_DR_0600 kopie.jpg',
  '_DR_0601 kopie.jpg',
  '_DR_0605 kopie.jpg',
  '0581_obraz_1.jpg',
  '0581_obraz_2.jpg',
  '0582_obraz_1.jpg',
  '0582_obraz_2.jpg',
  '0584_obraz_1.jpg',
  '0584_obraz_2.jpg',
  '0585_obraz_1.jpg',
  '0585_obraz_2.jpg'
]

const intro = document.querySelector('.intro')

if (intro) {
  const section = document.createElement('section')
  section.className = 'works-gallery'
  section.id = 'works'

  section.innerHTML = `
    <div class="works-heading">
      <span>SELECTED WORKS</span>
      <span>2023 — 2026</span>
    </div>
    <div class="works-grid"></div>
  `

  intro.after(section)

  const grid = section.querySelector('.works-grid')

  paintingFiles.forEach((file, index) => {
    const item = document.createElement('button')
    item.className = 'work-item'
    item.type = 'button'
    item.setAttribute('aria-label', `Zobrazit obraz ${index + 1}`)

    const image = document.createElement('img')
    image.src = `/images/${encodeURIComponent(file)}`
    image.alt = `Malba ${index + 1}`
    image.loading = index < 6 ? 'eager' : 'lazy'
    image.decoding = 'async'

    const caption = document.createElement('div')
    caption.className = 'work-caption'

    const number = document.createElement('span')
    number.textContent = String(index + 1).padStart(2, '0')

    const title = document.createElement('span')
    title.textContent = file
      .replace(/\.[^.]+$/, '')
      .replace(/ kopie$/i, '')
      .replace(/_obraz_/i, ' / ')

    caption.append(number, title)
    item.append(image, caption)
    grid.appendChild(item)

    image.addEventListener('error', () => {
      console.error('Obraz se nepodařilo načíst:', file)
      item.classList.add('image-error')
    })

    item.addEventListener('click', () => openPainting(index))
  })
}

// ========================================
// ZVĚTŠENÍ OBRAZŮ
// ========================================

const lightbox = document.createElement('div')
lightbox.className = 'painting-lightbox'
lightbox.setAttribute('role', 'dialog')
lightbox.setAttribute('aria-modal', 'true')
lightbox.setAttribute('aria-label', 'Detail malby')
lightbox.hidden = true

lightbox.innerHTML = `
  <button class="lightbox-close" aria-label="Zavřít">CLOSE ×</button>
  <button class="lightbox-prev" aria-label="Předchozí obraz">←</button>
  <div class="lightbox-content">
    <img class="lightbox-image" alt="">
    <div class="lightbox-caption"></div>
  </div>
  <button class="lightbox-next" aria-label="Další obraz">→</button>
  <div class="lightbox-counter"></div>
`

document.body.appendChild(lightbox)

let activePainting = 0

function openPainting(index) {
  activePainting = index
  updateLightbox()
  lightbox.hidden = false
  document.body.classList.add('lightbox-open')
}

function updateLightbox() {
  const file = paintingFiles[activePainting]
  const image = lightbox.querySelector('.lightbox-image')

  image.src = `/images/${encodeURIComponent(file)}`
  image.alt = `Malba ${activePainting + 1}`

  lightbox.querySelector('.lightbox-caption').textContent =
    file.replace(/\.[^.]+$/, '')

  lightbox.querySelector('.lightbox-counter').textContent =
    `${String(activePainting + 1).padStart(2, '0')} / ${String(paintingFiles.length).padStart(2, '0')}`
}

function closeLightbox() {
  lightbox.hidden = true
  document.body.classList.remove('lightbox-open')
}

function changePainting(direction) {
  activePainting =
    (activePainting + direction + paintingFiles.length) % paintingFiles.length

  updateLightbox()
}

lightbox.querySelector('.lightbox-close')
  .addEventListener('click', closeLightbox)

lightbox.querySelector('.lightbox-prev')
  .addEventListener('click', () => changePainting(-1))

lightbox.querySelector('.lightbox-next')
  .addEventListener('click', () => changePainting(1))

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox()
})

document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return

  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') changePainting(-1)
  if (event.key === 'ArrowRight') changePainting(1)
})