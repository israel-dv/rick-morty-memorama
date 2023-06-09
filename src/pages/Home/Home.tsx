import { useEffect, useState } from 'react'
import { useGetCharacters } from 'src/hooks/useGetCharacters'

import { Card } from 'components/Card'
import { ButtonContainer } from 'components/Container/ButtonContainer'
import { CardsContainer } from 'components/Container/CardsContainer'
import { FinishContainer } from 'components/Container/FinishContainer'
import { GameContainer } from 'components/Container/GameContainer'
import { Layout } from 'components/Layouts/Layout'
import { Loader } from 'components/Loader/Loader'

import {
  CHAR_INITIAL,
  HITS_TO_WIN,
  INITAL_HITS,
  INITIAL_FLIPPED_CARDS,
  INITIAL_TURNS,
  MAX_SELECTED_CARDS,
  MIN_SELECTED_CARDS,
} from 'utils/constants/homeValues'
import { randomNumbers } from 'utils/functions/randomNumber'
import { suffle } from 'utils/functions/suffle'
import { CharactersProps } from 'utils/types/characters.types'

import './Home.styles.scss'

export const Home = (): JSX.Element => {
  const [randomIDS, setRandomIDS] = useState<string[]>(randomNumbers(6).map(String))
  const [isGameActive, setIsGameActive] = useState<boolean>(false)
  const [hits, setHits] = useState<number>(INITAL_HITS)
  const [turns, setTurns] = useState<number>(INITIAL_TURNS)
  const [flippedCards, setFlippedCards] = useState<number>(INITIAL_FLIPPED_CARDS)
  const [cardCharacters, setCardCharacters] = useState<CharactersProps[]>([])
  const [firstCardSelected, setFirstCardSelected] = useState<CharactersProps>(CHAR_INITIAL)

  const { data, loading } = useGetCharacters(randomIDS)

  const isCardUnblock = isGameActive && flippedCards !== MAX_SELECTED_CARDS
  const isGameFinished = hits === HITS_TO_WIN

  useEffect(() => {
    if (data) {
      const { charactersByIds } = data
      if (charactersByIds) {
        const duplicateCharacters = [...charactersByIds, ...charactersByIds]
        const setCharactersProps = duplicateCharacters.map((character, indexID) => ({
          ...character,
          isFlipped: true,
          isMatched: false,
          indexID,
        }))
        setCardCharacters([...setCharactersProps])
      }
    }
  }, [data])

  useEffect(() => {
    if (hits === HITS_TO_WIN) setIsGameActive(false)
  }, [hits])

  const resetGame = () => {
    setHits(0)
    setTurns(0)
  }

  const handlePlay = () => {
    setIsGameActive((isActive) => !isActive)

    const sufflingCards = suffle(cardCharacters)
    setCardCharacters([...sufflingCards])
    setTimeout(() => {
      const flippedCards = sufflingCards.map((character, indexID) => ({
        ...character,
        isFlipped: false,
        indexID,
      }))

      setCardCharacters([...flippedCards])
    }, 3000)
  }

  const handleRepeat = () => {
    const revertCards = cardCharacters.map((character) => ({
      ...character,
      isFlipped: false,
      isMatched: false,
    }))

    resetGame()
    setIsGameActive(true)
    setCardCharacters(revertCards)
  }

  const handleStart = () => {
    resetGame()
    setRandomIDS(randomNumbers(6).map(String))
    setIsGameActive(false)
  }

  const handleFlippedCard = (character: CharactersProps, position: number) => {
    const countFlippedCard = flippedCards + 1
    const cloneCards = [...cardCharacters]

    if (countFlippedCard === MIN_SELECTED_CARDS) {
      cloneCards[position] = { ...character, isFlipped: true }

      setFirstCardSelected(cloneCards[position])
      setCardCharacters(cloneCards)
      setFlippedCards(countFlippedCard)
    }
    if (countFlippedCard === MAX_SELECTED_CARDS) {
      if (character.indexID === firstCardSelected.indexID) return

      cloneCards[position] = { ...character, isFlipped: true }
      setCardCharacters(cloneCards)
      setFlippedCards(countFlippedCard)

      if (firstCardSelected?.name === character.name) {
        cloneCards[firstCardSelected.indexID] = {
          ...firstCardSelected,
          isMatched: true,
          isFlipped: true,
        }
        cloneCards[position] = { ...character, isMatched: true, isFlipped: true }

        setTurns((turn) => turn + 1)
        setHits((hit) => hit + 1)
        setCardCharacters(cloneCards)
        setFlippedCards(0)
      } else {
        const revertCards = cloneCards.map((cloneChar) => {
          if (cloneChar.isMatched) return cloneChar
          return { ...cloneChar, isFlipped: false }
        })

        setTimeout(() => {
          setCardCharacters(revertCards)
          setFlippedCards(0)
        }, 1000)
        setTurns((turn) => turn + 1)
      }
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loader />
      </Layout>
    )
  }

  return (
    <Layout>
      <GameContainer hits={hits} turns={turns} isGameActive={isGameActive}>
        {isGameFinished ? (
          <FinishContainer turns={turns} />
        ) : (
          <CardsContainer>
            {cardCharacters.map((cardChar, position) => (
              <Card
                key={`${cardChar.name}-${position}`}
                imgUrl={`${cardChar.image}`}
                title={`${cardChar.name}`}
                subtitle={`${cardChar.status} - ${cardChar.species}`}
                isFlipped={cardChar.isFlipped}
                onClick={
                  isCardUnblock && !cardChar.isMatched
                    ? () => handleFlippedCard(cardChar, position)
                    : undefined
                }
              />
            ))}
          </CardsContainer>
        )}
        <ButtonContainer
          isGameActive={isGameActive}
          isGameFinished={isGameFinished}
          onPlay={handlePlay}
          onRepeat={handleRepeat}
          onStart={handleStart}
        />
      </GameContainer>
    </Layout>
  )
}
