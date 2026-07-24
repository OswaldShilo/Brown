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
    initialState: { animation: { name: 'idle', mode: 'loop' }, pin: 'bottom-right' },
    defaultAnimation: 'idle',
  })

  useEffect(() => {
    petDispatch({ type: 'animation.set', animation: ANIMATION_BY_STATE[state] })
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
    <div style={{ zIndex: 2147483647, cursor: 'pointer' }} onClick={handleClick}>
      <CodexPetWidget
        src={SPRITESHEET_URL}
        atlas={codexPetAtlas}
        animation={pet.animation}
        pin={pet.pin}
      />
    </div>
  )
}
