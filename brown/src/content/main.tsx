function mount() {
  const host = document.createElement('div')
  host.id = 'brown-root'
  const shadow = host.attachShadow({ mode: 'open' })
  document.body.appendChild(host)
  return shadow
}

mount()
