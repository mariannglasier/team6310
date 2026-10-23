import { useEffect, useState } from "react"
import HouseholdSelection from "./HouseholdSelection"
import LandingPage from "./LandingPage"
import SetupSupport from "./SetupSupport"
import SetupReview from "./SetupReview"
import GameSession from "./GameSession"
import type { SupportId } from "./supportOptions"
import { readSession } from "./gameSessionState"
import GroupFlow, { hasGroupView } from "./GroupFlow"
import CommunityLearning from "./CommunityLearning"
import { initializeGroupDocument } from "./groupSessionService"
import { GameButton } from "./GamePrimitives"
import { HomeNavigationContext } from "./HomeLink"
import { NavigationContext } from "./NavigationContext"

function initializeGroup() {
  try {
    initializeGroupDocument()
    return ""
  } catch {
    return "Group sessions are unavailable because browser storage could not be updated. Retry to close the previous session safely. Individual play is still available."
  }
}

export default function App() {
  const [groupStorageError, setGroupStorageError] = useState(initializeGroup)
  const [documentRevision, setDocumentRevision] = useState(0)
  const [savedSession] = useState(readSession)
  const [screen, setScreen] =
    useState<"landing" | "household" | "support" | "review" | "game" | "group" | "learn" | "donate">(
      () => (hasGroupView() ? "group" : savedSession ? "game" : "landing"),
    )
  const [groupEntry, setGroupEntry] = useState<"host" | "join" | "current">(
    "current",
  )
  const [learnReturn, setLearnReturn] = useState<"landing" | "group">("landing")
  const learn = (from: "landing" | "group") => {
    setLearnReturn(from)
    setScreen("learn")
  }
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
    savedSession?.householdId ?? null,
  )
  const [selectedSupportId, setSelectedSupportId] = useState<SupportId | null>(
    savedSession?.mode ?? null,
  )
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      setGroupStorageError(initializeGroup())
      setGroupEntry("current")
      setDocumentRevision((value) => value + 1)
      if (!hasGroupView())
        setScreen((current) => (current === "group" ? "landing" : current))
    }
    window.addEventListener("pageshow", restore)
    return () => window.removeEventListener("pageshow", restore)
  }, [])

  useEffect(() => {
    const main = document.querySelector("main")
    if (main) {
      main.setAttribute("tabindex", "-1")
      main.focus({ preventScroll: true })
      main.scrollTo({ top: 0, behavior: "instant" })
    }
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [screen])

  function renderScreen() {
    if (screen === "learn" || screen === "donate")
      return (
        <CommunityLearning
          page={screen}
          onBack={() => setScreen(learnReturn)}
        />
      )
    if (screen === "group")
      return (
        <GroupFlow
          key={documentRevision}
          entry={groupEntry}
          onHome={() => setScreen("landing")}
          onLearn={(returnToGroup) => {
            setGroupEntry("current")
            learn(returnToGroup ? "group" : "landing")
          }}
          onDonate={(returnToGroup) => {
            setGroupEntry("current")
            setLearnReturn(returnToGroup ? "group" : "landing")
            setScreen("donate")
          }}
        />
      )

    if (screen === "household") {
      return (
        <HouseholdSelection
          selectedHouseholdId={selectedHouseholdId}
          onSelect={setSelectedHouseholdId}
          onBack={() => setScreen("landing")}
          onContinue={() => setScreen("support")}
        />
      )
    }

    if (screen === "support") {
      return (
        <SetupSupport
          selectedHouseholdId={selectedHouseholdId}
          selectedSupportId={selectedSupportId}
          onSelect={setSelectedSupportId}
          onBack={() => setScreen("household")}
          onContinue={() => {
            if (selectedHouseholdId && selectedSupportId) setScreen("review")
          }}
        />
      )
    }

    if (screen === "review") {
      return (
        <SetupReview
          selectedHouseholdId={selectedHouseholdId}
          selectedSupportId={selectedSupportId}
          onBack={() => setScreen("support")}
          onEditHousehold={() => setScreen("household")}
          onStart={() => {
            if (selectedHouseholdId && selectedSupportId) setScreen("game")
          }}
        />
      )
    }

    if (screen === "game" && selectedHouseholdId && selectedSupportId) {
      return (
        <GameSession
          key={`${selectedHouseholdId}-${selectedSupportId}`}
          householdId={selectedHouseholdId}
          supportId={selectedSupportId}
          onReview={() => setScreen("landing")}
          onLearn={() => learn("landing")}
          onReplayMode={setSelectedSupportId}
        />
      )
    }

    return (
      <LandingPage
        onStart={() => setScreen("household")}
        onHost={() => {
          setGroupEntry("host")
          setScreen("group")
        }}
        onJoin={() => {
          setGroupEntry("join")
          setScreen("group")
        }}
        onLearn={() => learn("landing")}
      />
    )
  }
  return (
    <NavigationContext.Provider
      value={{
        activePage:
          screen === "learn" ? "Learn" : screen === "donate" ? "Donate" : null,
        navigate: (item) => {
          if (screen !== "learn" && screen !== "donate")
            setLearnReturn("landing")
          setScreen(item === "Learn" ? "learn" : "donate")
        },
      }}
    >
      <HomeNavigationContext.Provider
        value={() => {
          setScreen("landing")
          window.scrollTo({ top: 0, behavior: "instant" })
        }}
      >
        {groupStorageError && (
          <div role="alert" className="cac-notice">
            {groupStorageError}
            <GameButton
              variant="text"
              onClick={() => {
                const error = initializeGroup()
                setGroupStorageError(error)
                if (!error) {
                  setDocumentRevision((value) => value + 1)
                  if (hasGroupView()) setScreen("group")
                }
              }}
            >
              Retry group storage
            </GameButton>
          </div>
        )}
        {renderScreen()}
      </HomeNavigationContext.Provider>
    </NavigationContext.Provider>
  )
}
