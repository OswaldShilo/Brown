// brown/src/content/PetWidget.tsx
import { useCallback, useEffect, useState } from 'react'
import {
  PetWidget as CodexPetWidget,
  usePetController,
  codexPetAtlas,
  type CodexPetAnimationName,
} from 'codex-pets-react'

export type BrownPetState = 'idle' | 'busy' | 'settled'

export interface BrownPetProps {
  state: BrownPetState
  onFirstTap: () => void
  onSecondTap: () => void
}

// Real animation names from codex-pets-react's CodexPetAnimationName (confirmed
// against the installed package's atlas.d.ts, not invented): 'idle' for resting,
// 'waiting' while the Gemini call is in flight, 'review' once notes are placed
// and ready for the user to look at.
const ANIMATION_BY_STATE: Record<BrownPetState, CodexPetAnimationName> = {
  idle: 'idle',
  busy: 'waiting',
  settled: 'review',
}

const SPRITESHEET_URL = chrome.runtime.getURL('public/pets/yuan/spritesheet.webp')

export function BrownPet({ state, onFirstTap, onSecondTap }: BrownPetProps) {
  const [tapped, setTapped] = useState(false)
  const { pet, petDispatch } = usePetController<CodexPetAnimationName>({
    initialState: { animation: { name: 'idle', mode: 'once' }, pin: 'bottom-right' },
    defaultAnimation: 'idle',
  })

  // 'animation.set' always forces mode: 'loop' in codex-pets-react's reducer —
  // there is no way to get a single play-through from it. 'animation.play' with
  // mode: 'once' plays the cycle exactly once and then SpriteAnimator freezes
  // on the last frame on its own (no further dispatch needed to hold it there).
  useEffect(() => {
    petDispatch({ type: 'animation.play', animation: ANIMATION_BY_STATE[state], mode: 'once' })
  }, [state, petDispatch])

  const handleClick = useCallback(() => {
    if (!tapped) {
      setTapped(true)
      onFirstTap()
    } else {
      setTapped(false)
      onSecondTap()
    }
  }, [tapped, onFirstTap, onSecondTap])

  return (
    <div style={{ cursor: 'pointer' }} onClick={handleClick}>
      {/* Keyed by animation name so React fully remounts the sprite on every
          transition instead of relying on the library's internal reset
          effect, which runs after the row (from the new animation) is
          already painted alongside the stale frame column (from the old
          one) — a one-frame flash of a mismatched pose on every switch. */}
      <CodexPetWidget
        key={pet.animation.name}
        src={SPRITESHEET_URL}
        atlas={codexPetAtlas}
        animation={pet.animation}
        pin={pet.pin}
        zIndex={2147483647}
      />
    </div>
  )
}
