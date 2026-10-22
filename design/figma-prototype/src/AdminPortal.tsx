import { FormEvent, useState } from "react"
import cacLogo from "./assets/cac-logo.png"

type Screen =
  | "login"
  | "dashboard"
  | "editor"
  | "preview"
  | "confirmation"
  | "updated-example"
  | "generated-review"

type Tab = "statistics" | "questions"
type ContentStatus = "Draft" | "Published"

type StatisticData = {
  title: string
  value: string
  unit: string
  area: string
  period: string
  sourceName: string
  sourceLink: string
  explanation: string
  appearance: string
  associatedQuestion: string
  locations: string[]
}

type AnswerOption = {
  label: string
  direction: "spend" | "gain"
  amount: string
  consequence: string
  next: string
}

type QuestionData = {
  title: string
  text: string
  personas: string[]
  options: [AnswerOption, AnswerOption]
  associatedStatistic: string
  appearance: string
}

type StatisticRecord = {
  id: string
  published: StatisticData | null
  draft: StatisticData | null
  updated: string
}

type QuestionRecord = {
  id: string
  published: QuestionData | null
  draft: QuestionData | null
  updated: string
}

type EditorSession = {
  kind: "statistic"
  id: string
  isNew: boolean
  initial: StatisticData
  value: StatisticData
} | {
  kind: "question"
  id: string
  isNew: boolean
  initial: QuestionData
  value: QuestionData
}

type PublicationInfo = {
  kind: "statistic" | "question"
  title: string
  locations: string[]
}

const DEMO_EMAIL = "admin@cac-example.org"
const DEMO_PASSWORD = "CACdemo2026!"

const locationChoices = [
  "Transportation decision recap",
  "End-of-game community results",
  "Day 8 transportation decision",
]

const questionDestinations = [
  { value: "transport-recap", label: "Transportation decision recap" },
  { value: "housing-week-two", label: "Week 2 housing decision" },
  { value: "community-results", label: "End-of-game community results" },
  { value: "missing", label: "Archived question (reference unavailable)" },
]

const initialStatisticRecords: StatisticRecord[] = [
  {
    id: "stat-transport",
    published: {
      title: "Example monthly transportation cost",
      value: "120",
      unit: "dollars",
      area: "Illustrative metro area",
      period: "Prototype example",
      sourceName: "Sample transportation source — not verified",
      sourceLink: "https://example.org/sample-transportation-source",
      explanation:
        "This fictional example helps players compare transportation costs during the simulated month.",
      appearance: "Transportation decision recap",
      associatedQuestion: "transport-question",
      locations: [
        "Transportation decision recap",
        "End-of-game community results",
      ],
    },
    draft: null,
    updated: "Apr 18, 2026",
  },
  {
    id: "stat-rent",
    published: {
      title: "Example share of income used for rent",
      value: "42",
      unit: "percent",
      area: "Illustrative metro area",
      period: "Prototype example",
      sourceName: "Sample housing source — not verified",
      sourceLink: "https://example.org/sample-housing-source",
      explanation: "A fictional comparison point used in the housing recap.",
      appearance: "Housing decision recap",
      associatedQuestion: "housing-question",
      locations: ["End-of-game community results"],
    },
    draft: null,
    updated: "Apr 12, 2026",
  },
  {
    id: "stat-food",
    published: {
      title: "Example weekly grocery amount",
      value: "85",
      unit: "dollars",
      area: "Illustrative household",
      period: "One week",
      sourceName: "Prototype content team example",
      sourceLink: "https://example.org/sample-grocery-source",
      explanation: "A fictional amount shown after the grocery decision.",
      appearance: "Grocery decision recap",
      associatedQuestion: "grocery-question",
      locations: ["End-of-game community results"],
    },
    draft: null,
    updated: "Mar 29, 2026",
  },
]

const initialQuestionRecords: QuestionRecord[] = [
  {
    id: "transport-question",
    published: {
      title: "Getting to work after a transit pass expires",
      text: "Your weekly transit pass expired, and you need to get to work for five days. What do you do?",
      personas: ["Maya and Eli", "Jordan"],
      options: [
        {
          label: "Buy a weekly transit pass",
          direction: "spend",
          amount: "35",
          consequence: "You have reliable transportation to work for the week.",
          next: "transport-recap",
        },
        {
          label: "Arrange rides with a coworker",
          direction: "spend",
          amount: "20",
          consequence:
            "You cover fuel costs, but your schedule depends on someone else.",
          next: "housing-week-two",
        },
      ],
      associatedStatistic: "stat-transport",
      appearance: "Day 8 transportation decision",
    },
    draft: null,
    updated: "Apr 16, 2026",
  },
  {
    id: "housing-question",
    published: {
      title: "Responding to a late rent notice",
      text: "A late fee was added to this month’s rent. What do you do next?",
      personas: ["Maya and Eli", "Jordan"],
      options: [
        {
          label: "Pay the balance today",
          direction: "spend",
          amount: "90",
          consequence: "The rent balance is resolved.",
          next: "community-results",
        },
        {
          label: "Ask for a payment arrangement",
          direction: "spend",
          amount: "45",
          consequence: "Part of the balance remains due next week.",
          next: "community-results",
        },
      ],
      associatedStatistic: "stat-rent",
      appearance: "Week 2 housing decision",
    },
    draft: null,
    updated: "Apr 10, 2026",
  },
  {
    id: "grocery-question",
    published: {
      title: "Planning groceries for the week",
      text: "Your household needs groceries through the weekend. What do you choose?",
      personas: ["Maya and Eli"],
      options: [
        {
          label: "Buy the full grocery list",
          direction: "spend",
          amount: "85",
          consequence: "The household has planned meals for the week.",
          next: "community-results",
        },
        {
          label: "Buy essentials only",
          direction: "spend",
          amount: "48",
          consequence: "You cover basic meals but have fewer options.",
          next: "community-results",
        },
      ],
      associatedStatistic: "stat-food",
      appearance: "Day 12 grocery decision",
    },
    draft: null,
    updated: "Mar 28, 2026",
  },
]

const blankStatistic = (): StatisticData => ({
  title: "",
  value: "",
  unit: "",
  area: "",
  period: "",
  sourceName: "",
  sourceLink: "",
  explanation: "",
  appearance: "",
  associatedQuestion: "",
  locations: [],
})

const blankOption = (): AnswerOption => ({
  label: "",
  direction: "spend",
  amount: "",
  consequence: "",
  next: "",
})

const blankQuestion = (): QuestionData => ({
  title: "",
  text: "",
  personas: [],
  options: [blankOption(), blankOption()],
  associatedStatistic: "",
  appearance: "",
})

const clone = <T,>(value: T): T => structuredClone(value)

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "text" | "danger"
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  type = "text",
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  type?: "text" | "email" | "password" | "number" | "url"
  hint?: string
}) {
  const id = `field-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`
  return (
    <label className={`field ${error ? "field--error" : ""}`} htmlFor={id}>
      <span className="field__label">
        {label} {required && <strong aria-label="required">*</strong>}
      </span>
      {hint && <span className="field__hint">{hint}</span>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  const id = `field-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`
  return (
    <label
      className={`field field--wide ${error ? "field--error" : ""}`}
      htmlFor={id}
    >
      <span className="field__label">
        {label} {required && <strong aria-label="required">*</strong>}
      </span>
      {hint && <span className="field__hint">{hint}</span>}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string label: string }[]
  error?: string
  required?: boolean
  hint?: string
}) {
  const id = `field-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`
  return (
    <label className={`field ${error ? "field--error" : ""}`} htmlFor={id}>
      <span className="field__label">
        {label} {required && <strong aria-label="required">*</strong>}
      </span>
      {hint && <span className="field__hint">{hint}</span>}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="field__error">{error}</span>}
    </label>
  )
}

function Status({ status }: { status: ContentStatus }) {
  return (
    <span className={`status status--${status.toLowerCase()}`}>{status}</span>
  )
}

function AdminHeader({
  onDashboard,
  onSignOut,
  onMainSite,
}: {
  onDashboard: () => void
  onSignOut: () => void
  onMainSite: () => void
}) {
  return (
    <header className="admin-header">
      <button className="admin-brand" type="button" onClick={onDashboard}>
        <img className="admin-brand__mark" src={cacLogo} alt="CAC" />
        <span>
          <strong>Content Administration</strong>
          <small>Poverty Simulation Prototype</small>
        </span>
      </button>
      <nav className="admin-nav" aria-label="Administration">
        <Button variant="text" onClick={onMainSite}>
          Main Site
        </Button>
        <Button variant="text" onClick={onDashboard}>
          Dashboard
        </Button>
        <Button variant="secondary" onClick={onSignOut}>
          Sign Out
        </Button>
      </nav>
    </header>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <p className="overline">Confirm action</p>
        <h2 id="dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="modal__actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default function AdminPortal({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>("login")
  const [tab, setTab] = useState<Tab>("statistics")
  const [statistics, setStatistics] = useState(initialStatisticRecords)
  const [questions, setQuestions] = useState(initialQuestionRecords)
  const [editor, setEditor] = useState<EditorSession | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [previewBlock, setPreviewBlock] = useState("")
  const [publication, setPublication] = useState<PublicationInfo | null>(null)

  const isDirty =
    editor !== null &&
    JSON.stringify(editor.initial) !== JSON.stringify(editor.value)

  const attemptLeave = (action: () => void) => {
    if (screen === "editor" || screen === "preview") {
      if (isDirty) {
        setPendingLeave(() => action)
        return
      }
    }
    action()
  }

  const signOut = () => {
    setEditor(null)
    setErrors({})
    setNotice("")
    setLoginEmail("")
    setLoginPassword("")
    setScreen("login")
  }

  const goDashboard = () => {
    setEditor(null)
    setErrors({})
    setNotice("")
    setScreen("dashboard")
  }

  const handleLogin = (event: FormEvent) => {
    event.preventDefault()
    if (loginEmail === DEMO_EMAIL && loginPassword === DEMO_PASSWORD) {
      setLoginError("")
      setScreen("dashboard")
      return
    }
    setLoginError(
      "We couldn’t sign you in. Check the sample email and password provided with this prototype.",
    )
  }

  const openStatistic = (id?: string) => {
    if (id) {
      const record = statistics.find((item) => item.id === id)
      const data = record?.draft ?? record?.published
      if (!record || !data) return
      setEditor({
        kind: "statistic",
        id,
        isNew: record.published === null,
        initial: clone(data),
        value: clone(data),
      })
    } else {
      const data = blankStatistic()
      setEditor({
        kind: "statistic",
        id: `stat-new-${Date.now()}`,
        isNew: true,
        initial: clone(data),
        value: data,
      })
    }
    setErrors({})
    setNotice("")
    setScreen("editor")
  }

  const openQuestion = (id?: string) => {
    if (id) {
      const record = questions.find((item) => item.id === id)
      const data = record?.draft ?? record?.published
      if (!record || !data) return
      setEditor({
        kind: "question",
        id,
        isNew: record.published === null,
        initial: clone(data),
        value: clone(data),
      })
    } else {
      const data = blankQuestion()
      setEditor({
        kind: "question",
        id: `question-new-${Date.now()}`,
        isNew: true,
        initial: clone(data),
        value: data,
      })
    }
    setErrors({})
    setNotice("")
    setScreen("editor")
  }

  const updateStatistic = (
    field: keyof StatisticData,
    value: string | string[],
  ) => {
    setEditor((current) =>
      current?.kind === "statistic"
        ? { ...current, value: { ...current.value, [field]: value } }
        : current,
    )
    setErrors((current) => ({ ...current, [field]: "" }))
    setNotice("")
  }

  const updateQuestion = (
    field: keyof QuestionData,
    value: string | string[],
  ) => {
    setEditor((current) =>
      current?.kind === "question"
        ? { ...current, value: { ...current.value, [field]: value } }
        : current,
    )
    setErrors((current) => ({ ...current, [field]: "" }))
    setNotice("")
  }

  const updateOption = (
    index: 0 | 1,
    field: keyof AnswerOption,
    value: string,
  ) => {
    setEditor((current) => {
      if (current?.kind !== "question") return current
      const options = clone(current.value.options)
      options[index] = { ...options[index], [field]: value }
      return { ...current, value: { ...current.value, options } }
    })
    setErrors((current) => ({ ...current, [`option-${index}-${field}`]: "" }))
    setNotice("")
  }

  const toggleListValue = (kind: "locations" | "personas", item: string) => {
    if (kind === "locations" && editor?.kind === "statistic") {
      const next = editor.value.locations.includes(item)
        ? editor.value.locations.filter((value) => value !== item)
        : [...editor.value.locations, item]
      updateStatistic("locations", next)
    }
    if (kind === "personas" && editor?.kind === "question") {
      const next = editor.value.personas.includes(item)
        ? editor.value.personas.filter((value) => value !== item)
        : [...editor.value.personas, item]
      updateQuestion("personas", next)
    }
  }

  const validateEditor = () => {
    if (!editor) return false
    const nextErrors: Record<string, string> = {}
    if (editor.kind === "statistic") {
      const value = editor.value
      if (!value.title.trim()) nextErrors.title = "Enter a statistic title."
      if (!value.value.trim()) nextErrors.value = "Enter a value."
      if (value.value && Number(value.value) < 0)
        nextErrors.value = "Enter zero or a positive number."
      if (!value.unit) nextErrors.unit = "Select a unit."
      if (!value.area.trim()) nextErrors.area = "Enter a geographic area."
      if (!value.period.trim())
        nextErrors.period = "Enter a year or time period."
      if (!value.sourceName.trim())
        nextErrors.sourceName = "Enter the source name."
      if (!value.sourceLink.trim())
        nextErrors.sourceLink = "Enter a source link."
      else if (!value.sourceLink.startsWith("https://"))
        nextErrors.sourceLink = "Use a complete link beginning with https://."
      if (!value.explanation.trim())
        nextErrors.explanation = "Enter the explanation shown to players."
      if (!value.appearance)
        nextErrors.appearance = "Choose where this statistic first appears."
      if (!value.associatedQuestion)
        nextErrors.associatedQuestion = "Choose an associated question."
      if (value.locations.length === 0)
        nextErrors.locations = "Select at least one affected location."
    } else {
      const value = editor.value
      if (!value.title.trim()) nextErrors.title = "Enter a question title."
      if (!value.text.trim()) nextErrors.text = "Enter the question text."
      if (!value.appearance.trim())
        nextErrors.appearance = "Enter where the question appears."
      if (value.personas.length === 0)
        nextErrors.personas = "Select at least one household persona."
      value.options.forEach((option, index) => {
        if (!option.label.trim())
          nextErrors[`option-${index}-label`] = "Enter an answer label."
        if (!option.amount.trim())
          nextErrors[`option-${index}-amount`] = "Enter a money amount."
        else if (Number(option.amount) < 0)
          nextErrors[`option-${index}-amount`] =
            "Enter zero or a positive amount."
        if (!option.consequence.trim())
          nextErrors[`option-${index}-consequence`] =
            "Enter a consequence explanation."
        if (!option.next)
          nextErrors[`option-${index}-next`] =
            "Choose the next question or outcome."
      })
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveDraft = () => {
    if (!editor) return
    if (editor.kind === "statistic") {
      setStatistics((current) => {
        const exists = current.some((record) => record.id === editor.id)
        if (!exists) {
          return [
            {
              id: editor.id,
              published: null,
              draft: clone(editor.value),
              updated: "Today",
            },
            ...current,
          ]
        }
        return current.map((record) =>
          record.id === editor.id
            ? { ...record, draft: clone(editor.value), updated: "Today" }
            : record,
        )
      })
    } else {
      setQuestions((current) => {
        const exists = current.some((record) => record.id === editor.id)
        if (!exists) {
          return [
            {
              id: editor.id,
              published: null,
              draft: clone(editor.value),
              updated: "Today",
            },
            ...current,
          ]
        }
        return current.map((record) =>
          record.id === editor.id
            ? { ...record, draft: clone(editor.value), updated: "Today" }
            : record,
        )
      })
    }
    setEditor({ ...editor, initial: clone(editor.value) } as EditorSession)
    setNotice(
      "Draft saved. The live simulation has not changed. Preview and publish when the content is ready.",
    )
  }

  const openPreview = () => {
    if (!validateEditor()) {
      setNotice("")
      window.scrollTo({ top: 0 })
      return
    }
    setPreviewBlock("")
    setNotice("")
    setScreen("preview")
    window.scrollTo({ top: 0 })
  }

  const generateQuestion = () => {
    if (editor?.kind !== "question" || !editor.isNew) return
    if (!editor.value.text.trim()) {
      setErrors({ text: "Enter a situation for the simulation." })
      window.scrollTo({ top: 0 })
      return
    }
    setErrors({})
    setScreen("generated-review")
    window.scrollTo({ top: 0 })
  }

  const submitGeneratedQuestion = () => {
    if (editor?.kind !== "question" || !editor.isNew) return
    const generatedQuestion: QuestionData = {
      title: "New generated scenario",
      text: editor.value.text,
      personas: ["Maya and Eli", "Jordan"],
      options: [
        {
          label: "Generated response option 1",
          direction: "spend",
          amount: "0",
          consequence: "Generated outcome placeholder.",
          next: "community-results",
        },
        {
          label: "Generated response option 2",
          direction: "spend",
          amount: "0",
          consequence: "Generated outcome placeholder.",
          next: "community-results",
        },
      ],
      associatedStatistic: "",
      appearance: "Generated simulation scenario",
    }
    setQuestions((current) => [
      {
        id: editor.id,
        published: null,
        draft: generatedQuestion,
        updated: "Today",
      },
      ...current.filter((record) => record.id !== editor.id),
    ])
    setEditor(null)
    setErrors({})
    setScreen("dashboard")
    window.scrollTo({ top: 0 })
  }

  const requestPublish = () => {
    if (!editor) return
    if (
      editor.kind === "question" &&
      editor.value.options.some((option) => option.next === "missing")
    ) {
      setPreviewBlock(
        "Publication is blocked because an answer points to an unavailable question. Return to the editor and choose an existing next question or outcome.",
      )
      return
    }
    if (!validateEditor()) {
      setPreviewBlock(
        "Publication is blocked because required information is missing. Return to the editor and complete the marked fields.",
      )
      return
    }
    setPreviewBlock("")
    setPublishConfirmOpen(true)
  }

  const publish = () => {
    if (!editor) return
    let info: PublicationInfo
    if (editor.kind === "statistic") {
      const value = clone(editor.value)
      setStatistics((current) => {
        const exists = current.some((record) => record.id === editor.id)
        if (!exists)
          return [
            { id: editor.id, published: value, draft: null, updated: "Today" },
            ...current,
          ]
        return current.map((record) =>
          record.id === editor.id
            ? { ...record, published: value, draft: null, updated: "Today" }
            : record,
        )
      })
      info = {
        kind: "statistic",
        title: value.title,
        locations: value.locations,
      }
    } else {
      const value = clone(editor.value)
      setQuestions((current) => {
        const exists = current.some((record) => record.id === editor.id)
        if (!exists)
          return [
            { id: editor.id, published: value, draft: null, updated: "Today" },
            ...current,
          ]
        return current.map((record) =>
          record.id === editor.id
            ? { ...record, published: value, draft: null, updated: "Today" }
            : record,
        )
      })
      info = {
        kind: "question",
        title: value.title,
        locations: [value.appearance],
      }
    }
    setPublication(info)
    setEditor({ ...editor, initial: clone(editor.value) } as EditorSession)
    setPublishConfirmOpen(false)
    setScreen("confirmation")
    window.scrollTo({ top: 0 })
  }

  const getPublishedOriginal = () => {
    if (!editor) return null
    if (editor.kind === "statistic")
      return (
        statistics.find((record) => record.id === editor.id)?.published ?? null
      )
    return (
      questions.find((record) => record.id === editor.id)?.published ?? null
    )
  }

  if (screen === "login") {
    return (
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-brand">
            <img className="admin-brand__mark" src={cacLogo} alt="CAC" />
            <span>
              <strong>Content Administration</strong>
              <small>Poverty Simulation Prototype</small>
            </span>
          </div>
          <nav className="admin-nav" aria-label="Administration">
            <Button variant="text" onClick={onExit}>
              Back to main site
            </Button>
          </nav>
        </header>
      <main className="login-page">
        <section className="login-intro">
          <img className="login-mark" src={cacLogo} alt="CAC" />
          <p className="overline">Administration portal</p>
          <h1>Manage the content players see.</h1>
          <p>
            Authorized Community Assistance Center employees can update
            simulation statistics and scenario questions without writing code.
          </p>
          <div className="prototype-note">
            <strong>Capstone prototype</strong>
            <span>
              All records and values in this portal are fictional examples.
            </span>
          </div>
        </section>
        <section className="login-panel">
          <p className="step-label">Employee access</p>
          <h2>Sign in</h2>
          <p>Use the sample credentials provided with this prototype.</p>
          {loginError && (
            <div className="alert alert--error" role="alert">
              <strong>Sign-in unsuccessful</strong>
              <span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="login-form">
            <Field
              label="Work email"
              type="email"
              value={loginEmail}
              onChange={setLoginEmail}
              placeholder="name@organization.org"
              required
            />
            <Field
              label="Password"
              type="password"
              value={loginPassword}
              onChange={setLoginPassword}
              placeholder="Enter your password"
              required
            />
            <Button type="submit" className="button--full">
              Sign In
            </Button>
          </form>
        </section>
      </main>
      </div>
    )
  }

  const dashboardAction = () => attemptLeave(goDashboard)
  const signOutAction = () => attemptLeave(signOut)

  return (
    <div className="admin-shell">
      <AdminHeader
        onDashboard={dashboardAction}
        onSignOut={signOutAction}
        onMainSite={() => attemptLeave(onExit)}
      />

      {screen === "dashboard" && (
        <main className="page">
          <div className="page-heading">
            <div>
              <p className="overline">Content administration</p>
              <h1>Manage Simulation Content</h1>
              <p>
                Update the information and choices shown in newly started
                simulations.
              </p>
            </div>
            <div className="page-heading__note">
              <strong>Before publishing</strong>
              <span>Review every location affected by the change.</span>
            </div>
          </div>

          <div className="tabs" role="tablist" aria-label="Content type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "statistics"}
              className={tab === "statistics" ? "is-active" : ""}
              onClick={() => setTab("statistics")}
            >
              Statistics
              <span>{statistics.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "questions"}
              className={tab === "questions" ? "is-active" : ""}
              onClick={() => setTab("questions")}
            >
              Scenario Questions
              <span>{questions.length}</span>
            </button>
          </div>

          <section className="content-section">
            <div className="section-heading">
              <div>
                <h2>
                  {tab === "statistics" ? "Statistics" : "Scenario Questions"}
                </h2>
                <p>
                  {tab === "statistics"
                    ? "Context shown in recaps and community results."
                    : "Choices, financial effects, and what happens next."}
                </p>
              </div>
              {tab === "questions" && (
                <Button onClick={() => openQuestion()}>Add Question</Button>
              )}
            </div>

            <div className="record-table" role="table">
              <div className="record-table__header" role="row">
                <span role="columnheader">Content</span>
                <span role="columnheader">Where it appears</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Last updated</span>
                <span role="columnheader">Action</span>
              </div>
              {(tab === "statistics" ? statistics : questions).map((record) => {
                const data = record.draft ?? record.published
                if (!data) return null
                const status: ContentStatus = record.draft
                  ? "Draft"
                  : "Published"
                const location =
                  "locations" in data
                    ? data.locations.join(", ") || "Location not selected"
                    : data.appearance || "Location not selected"
                const title =
                  data.title ||
                  `Untitled ${tab === "statistics" ? "statistic" : "question"}`
                return (
                  <div className="record-table__row" role="row" key={record.id}>
                    <span className="record-title" role="cell">
                      <strong>{title}</strong>
                      <small>
                        {record.published
                          ? "Fictional prototype record"
                          : "New draft"}
                      </small>
                    </span>
                    <span role="cell">{location}</span>
                    <span role="cell">
                      <Status status={status} />
                    </span>
                    <span role="cell">{record.updated}</span>
                    <span role="cell">
                      <Button
                        variant={tab === "statistics" ? "danger" : "text"}
                        onClick={() =>
                          tab === "statistics"
                            ? setStatistics((current) =>
                                current.filter(
                                  (item) => item.id !== record.id,
                                ),
                              )
                            : openQuestion(record.id)
                        }
                      >
                        {tab === "statistics" ? "Delete" : "Edit"}
                      </Button>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      )}

      {screen === "editor" && editor && (
        <main className="page page--editor">
          <div className="editor-heading">
            <div>
              <button
                type="button"
                className="back-link"
                onClick={() => attemptLeave(goDashboard)}
              >
                ← Back to dashboard
              </button>
              <p className="overline">
                {editor.isNew ? "Add" : "Edit"}{" "}
                {editor.kind === "statistic"
                  ? "statistic"
                  : "scenario question"}
              </p>
              <h1>
                {editor.isNew
                  ? editor.kind === "statistic"
                    ? "New statistic"
                    : "Describe a situation"
                  : editor.value.title}
              </h1>
            </div>
            <div className="required-key">
              <strong>
                {editor.kind === "question" && editor.isNew
                  ? "One required field"
                  : "* Required field"}
              </strong>
              <span>
                {editor.kind === "question" && editor.isNew
                  ? "The simulation generates the options and outcomes."
                  : "Plain-language examples appear below some fields."}
              </span>
            </div>
          </div>

          {notice && (
            <div className="alert alert--success" role="status">
              <strong>Draft saved</strong>
              <span>{notice}</span>
            </div>
          )}
          {Object.values(errors).some(Boolean) && (
            <div className="alert alert--error" role="alert">
              <strong>Some information needs attention</strong>
              <span>
                {editor.kind === "question" && editor.isNew
                  ? "Enter a situation before generating the scenario."
                  : "Correct the marked fields before previewing this content."}
              </span>
            </div>
          )}

          {editor.kind === "statistic" ? (
            <StatisticEditor
              data={editor.value}
              errors={errors}
              questions={questions}
              update={updateStatistic}
              toggleLocation={(location) =>
                toggleListValue("locations", location)
              }
            />
          ) : editor.isNew ? (
            <NewQuestionPrompt
              value={editor.value.text}
              error={errors.text}
              onChange={(value) => updateQuestion("text", value)}
            />
          ) : (
            <QuestionEditor
              data={editor.value}
              errors={errors}
              statistics={statistics}
              update={updateQuestion}
              updateOption={updateOption}
              togglePersona={(persona) => toggleListValue("personas", persona)}
            />
          )}

          {editor.kind === "question" && editor.isNew ? (
            <div className="editor-actions question-generator__actions">
              <Button
                variant="secondary"
                onClick={() => attemptLeave(goDashboard)}
              >
                Cancel
              </Button>
              <Button onClick={generateQuestion}>Generate Scenario</Button>
            </div>
          ) : (
            <>
              <div className="draft-note">
                <strong>
                  Saving a draft does not change the live simulation.
                </strong>
                <span>
                  The change becomes available to players only after preview
                  and publication.
                </span>
              </div>
              <div className="editor-actions">
                <Button
                  variant="secondary"
                  onClick={() => attemptLeave(goDashboard)}
                >
                  Cancel
                </Button>
                <div>
                  <Button variant="secondary" onClick={saveDraft}>
                    Save Draft
                  </Button>
                  <Button onClick={openPreview}>Preview Changes</Button>
                </div>
              </div>
            </>
          )}
        </main>
      )}

      {screen === "generated-review" &&
        editor?.kind === "question" &&
        editor.isNew && (
          <main className="page page--generated-review">
            <button
              type="button"
              className="back-link"
              onClick={() => setScreen("editor")}
            >
              ← Back to situation entry
            </button>
            <div className="page-heading">
              <div>
                <p className="overline">Scenario generation</p>
                <h1>Review the generated situation</h1>
                <p>
                  This page is a placeholder for reviewing the complete
                  scenario before it is saved or published.
                </p>
              </div>
              <Status status="Draft" />
            </div>
            <section className="generated-review-card">
              <div>
                <span>Your situation</span>
                <p>{editor.value.text}</p>
              </div>
              <div className="generated-review-card__placeholder">
                <strong>GENERATED SCENARIO REVIEW PLACEHOLDER</strong>
                <p>
                  The generated player prompt, response options, financial
                  effects, and outcomes will appear here for review.
                </p>
              </div>
            </section>
            <div className="editor-actions">
              <Button
                variant="secondary"
                onClick={() => setScreen("editor")}
              >
                Edit Situation
              </Button>
              <Button onClick={submitGeneratedQuestion}>
                Submit Scenario
              </Button>
            </div>
          </main>
        )}

      {screen === "preview" && editor && (
        <PreviewScreen
          editor={editor}
          original={getPublishedOriginal()}
          blockMessage={previewBlock}
          onBack={() => {
            setPreviewBlock("")
            setScreen("editor")
          }}
          onPublish={requestPublish}
        />
      )}

      {screen === "confirmation" && publication && (
        <main className="page confirmation-page">
          <div className="success-mark" aria-hidden="true">
            ✓
          </div>
          <p className="overline">Publication complete</p>
          <h1>Changes published</h1>
          <p className="confirmation-lead">
            <strong>{publication.title}</strong> is now published for newly
            started simulations.
          </p>
          <section className="confirmation-card">
            <h2>What was updated</h2>
            <dl>
              <div>
                <dt>Record</dt>
                <dd>{publication.title}</dd>
              </div>
              <div>
                <dt>Affected locations</dt>
                <dd>{publication.locations.join(", ")}</dd>
              </div>
              <div>
                <dt>Game versions</dt>
                <dd>
                  New games use this update. Games already in progress keep
                  their existing content version.
                </dd>
              </div>
            </dl>
          </section>
          <div className="confirmation-actions">
            <Button
              variant="secondary"
              onClick={() => setScreen("updated-example")}
            >
              View Updated Example
            </Button>
            <Button onClick={goDashboard}>Return to Dashboard</Button>
          </div>
        </main>
      )}

      {screen === "updated-example" && editor && publication && (
        <main className="page">
          <button
            type="button"
            className="back-link"
            onClick={() => setScreen("confirmation")}
          >
            ← Back to publication confirmation
          </button>
          <div className="page-heading">
            <div>
              <p className="overline">Published example</p>
              <h1>What players will see</h1>
              <p>This example uses the newly published content.</p>
            </div>
            <Status status="Published" />
          </div>
          <GamePreview editor={editor} />
          <div className="editor-actions">
            <span />
            <Button onClick={goDashboard}>Return to Dashboard</Button>
          </div>
        </main>
      )}

      {pendingLeave && (
        <ConfirmDialog
          title="Discard unsaved edits?"
          message="These edits have not been saved as a draft. You can keep editing or discard them and leave this page."
          confirmLabel="Discard Changes"
          cancelLabel="Keep Editing"
          destructive
          onCancel={() => setPendingLeave(null)}
          onConfirm={() => {
            const action = pendingLeave
            setPendingLeave(null)
            action()
          }}
        />
      )}

      {publishConfirmOpen && editor && (
        <ConfirmDialog
          title="Publish these changes?"
          message={`This will update “${editor.value.title}” for newly started simulations. Games already in progress will not change.`}
          confirmLabel="Confirm Publication"
          cancelLabel="Continue Reviewing"
          onCancel={() => setPublishConfirmOpen(false)}
          onConfirm={publish}
        />
      )}
    </div>
  )
}

function NewQuestionPrompt({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="question-generator">
      <section className="form-section">
        <div className="form-section__number">01</div>
        <div className="form-section__heading">
          <h2>What should happen?</h2>
          <p>
            Describe the situation in plain language. The simulation will
            generate the player prompt, choices, financial effects, and
            outcomes.
          </p>
        </div>
        <TextAreaField
          label="Situation"
          value={value}
          onChange={onChange}
          placeholder="Example: Halfway through the month, the household needs a $350 car repair to keep getting to work."
          error={error}
          required
        />
      </section>
    </div>
  )
}

function StatisticEditor({
  data,
  errors,
  questions,
  update,
  toggleLocation,
}: {
  data: StatisticData
  errors: Record<string, string>
  questions: QuestionRecord[]
  update: (field: keyof StatisticData, value: string | string[]) => void
  toggleLocation: (location: string) => void
}) {
  const questionOptions = questions
    .map((record) => ({
      value: record.id,
      label:
        (record.draft ?? record.published)?.title ?? "Untitled question draft",
    }))
    .filter((option) => option.label)

  return (
    <div className="editor-layout">
      <div className="editor-main">
        <section className="form-section">
          <div className="form-section__number">01</div>
          <div className="form-section__heading">
            <h2>Statistic details</h2>
            <p>
              Enter the value and the context players need to understand it.
            </p>
          </div>
          <div className="form-grid">
            <Field
              label="Statistic title"
              value={data.title}
              onChange={(value) => update("title", value)}
              placeholder="Example: Monthly transportation cost"
              error={errors.title}
              required
            />
            <Field
              label="Value"
              type="number"
              value={data.value}
              onChange={(value) => update("value", value)}
              placeholder="Example: 135"
              error={errors.value}
              required
            />
            <SelectField
              label="Unit"
              value={data.unit}
              onChange={(value) => update("unit", value)}
              options={[
                { value: "dollars", label: "Dollars" },
                { value: "percent", label: "Percent" },
                { value: "days", label: "Days" },
                { value: "households", label: "Households" },
              ]}
              error={errors.unit}
              required
            />
            <Field
              label="Geographic area"
              value={data.area}
              onChange={(value) => update("area", value)}
              placeholder="Example: Illustrative metro area"
              error={errors.area}
              required
            />
            <Field
              label="Year or time period"
              value={data.period}
              onChange={(value) => update("period", value)}
              placeholder="Example: Prototype example"
              error={errors.period}
              required
            />
          </div>
        </section>

        <section className="form-section">
          <div className="form-section__number">02</div>
          <div className="form-section__heading">
            <h2>Source and player explanation</h2>
            <p>
              Identify where the information came from and explain it in plain
              language.
            </p>
          </div>
          <div className="form-grid">
            <Field
              label="Source name"
              value={data.sourceName}
              onChange={(value) => update("sourceName", value)}
              placeholder="Example: Sample transportation source — not verified"
              error={errors.sourceName}
              required
            />
            <Field
              label="Source link"
              type="url"
              value={data.sourceLink}
              onChange={(value) => update("sourceLink", value)}
              placeholder="https://example.org/source"
              error={errors.sourceLink}
              required
            />
            <TextAreaField
              label="Short explanation shown to players"
              value={data.explanation}
              onChange={(value) => update("explanation", value)}
              placeholder="Explain what this example helps players understand."
              error={errors.explanation}
              required
            />
          </div>
        </section>

        <section className="form-section">
          <div className="form-section__number">03</div>
          <div className="form-section__heading">
            <h2>Placement</h2>
            <p>Connect this statistic to existing simulation content.</p>
          </div>
          <div className="form-grid">
            <SelectField
              label="Question or screen where it first appears"
              value={data.appearance}
              onChange={(value) => update("appearance", value)}
              options={locationChoices.map((item) => ({
                value: item,
                label: item,
              }))}
              error={errors.appearance}
              required
            />
            <SelectField
              label="Associated question"
              value={data.associatedQuestion}
              onChange={(value) => update("associatedQuestion", value)}
              options={questionOptions}
              error={errors.associatedQuestion}
              required
              hint="Choose the existing question that provides context for this statistic."
            />
          </div>
          <fieldset className="check-group">
            <legend>
              Used in <strong aria-label="required">*</strong>
            </legend>
            <p>Select every location that should display this statistic.</p>
            {locationChoices.slice(0, 2).map((location) => (
              <label key={location}>
                <input
                  type="checkbox"
                  checked={data.locations.includes(location)}
                  onChange={() => toggleLocation(location)}
                />
                <span>{location}</span>
              </label>
            ))}
            {errors.locations && (
              <span className="field__error">{errors.locations}</span>
            )}
          </fieldset>
        </section>
      </div>

      <aside className="impact-card">
        <p className="overline">Impact summary</p>
        <h2>What this changes</h2>
        <p>
          Players will see the updated statistic and explanation in the selected
          locations.
        </p>
        <div className="impact-card__rule" />
        <strong>What this does not change</strong>
        <p>
          A contextual statistic does not automatically change transportation
          costs, balances, or answer effects in gameplay. Edit the associated
          scenario question to change those amounts.
        </p>
      </aside>
    </div>
  )
}

function QuestionEditor({
  data,
  errors,
  statistics,
  update,
  updateOption,
  togglePersona,
}: {
  data: QuestionData
  errors: Record<string, string>
  statistics: StatisticRecord[]
  update: (field: keyof QuestionData, value: string | string[]) => void
  updateOption: (index: 0 | 1, field: keyof AnswerOption, value: string) => void
  togglePersona: (persona: string) => void
}) {
  const statisticOptions = statistics.map((record) => ({
    value: record.id,
    label:
      (record.draft ?? record.published)?.title ?? "Untitled statistic draft",
  }))
  return (
    <div className="editor-layout">
      <div className="editor-main">
        <section className="form-section">
          <div className="form-section__number">01</div>
          <div className="form-section__heading">
            <h2>Question details</h2>
            <p>Describe the situation players will respond to.</p>
          </div>
          <div className="form-grid">
            <Field
              label="Question title"
              value={data.title}
              onChange={(value) => update("title", value)}
              placeholder="Example: Getting to work after a transit pass expires"
              error={errors.title}
              required
            />
            <Field
              label="Where this question appears"
              value={data.appearance}
              onChange={(value) => update("appearance", value)}
              placeholder="Example: Day 8 transportation decision"
              error={errors.appearance}
              required
            />
            <TextAreaField
              label="Question text"
              value={data.text}
              onChange={(value) => update("text", value)}
              placeholder="Describe the decision in one or two concise sentences."
              error={errors.text}
              required
            />
          </div>
          <fieldset className="check-group check-group--inline">
            <legend>
              Applicable household personas{" "}
              <strong aria-label="required">*</strong>
            </legend>
            <label>
              <input
                type="checkbox"
                checked={data.personas.includes("Maya and Eli")}
                onChange={() => togglePersona("Maya and Eli")}
              />
              <span>Maya and Eli — single parent and child</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={data.personas.includes("Jordan")}
                onChange={() => togglePersona("Jordan")}
              />
              <span>Jordan — adult living alone</span>
            </label>
            {errors.personas && (
              <span className="field__error">{errors.personas}</span>
            )}
          </fieldset>
        </section>

        {data.options.map((option, index) => (
          <section className="form-section" key={index}>
            <div className="form-section__number">0{index + 2}</div>
            <div className="form-section__heading">
              <h2>Answer option {index + 1}</h2>
              <p>
                Set the choice label, financial effect, consequence, and next
                step.
              </p>
            </div>
            <div className="form-grid">
              <Field
                label={`Option ${index + 1} label`}
                value={option.label}
                onChange={(value) =>
                  updateOption(index as 0 | 1, "label", value)
                }
                placeholder={
                  index === 0
                    ? "Example: Buy a weekly transit pass"
                    : "Example: Arrange rides with a coworker"
                }
                error={errors[`option-${index}-label`]}
                required
              />
              <SelectField
                label={`Option ${index + 1} money effect`}
                value={option.direction}
                onChange={(value) =>
                  updateOption(index as 0 | 1, "direction", value)
                }
                options={[
                  { value: "spend", label: "Money spent (subtract)" },
                  { value: "gain", label: "Money gained (add)" },
                ]}
                required
              />
              <Field
                label={`Option ${index + 1} amount`}
                type="number"
                value={option.amount}
                onChange={(value) =>
                  updateOption(index as 0 | 1, "amount", value)
                }
                placeholder="Example: 35"
                error={errors[`option-${index}-amount`]}
                hint={`Players will see ${
                  option.direction === "spend" ? "−" : "+"
                }$${option.amount || "0"}.`}
                required
              />
              <SelectField
                label={`Option ${index + 1} next question or outcome`}
                value={option.next}
                onChange={(value) =>
                  updateOption(index as 0 | 1, "next", value)
                }
                options={questionDestinations}
                error={errors[`option-${index}-next`]}
                required
              />
              <TextAreaField
                label={`Option ${index + 1} consequence explanation`}
                value={option.consequence}
                onChange={(value) =>
                  updateOption(index as 0 | 1, "consequence", value)
                }
                placeholder="Briefly explain what happens after this choice."
                error={errors[`option-${index}-consequence`]}
                required
              />
            </div>
          </section>
        ))}

        <section className="form-section">
          <div className="form-section__number">04</div>
          <div className="form-section__heading">
            <h2>Related context</h2>
            <p>Optionally show a statistic alongside this decision.</p>
          </div>
          <SelectField
            label="Associated statistic"
            value={data.associatedStatistic}
            onChange={(value) => update("associatedStatistic", value)}
            options={statisticOptions}
            hint="Optional. This does not change either answer’s cost."
          />
        </section>
      </div>

      <aside className="impact-card">
        <p className="overline">Financial effect</p>
        <h2>What players’ balances will do</h2>
        {data.options.map((option, index) => (
          <div className="effect-row" key={index}>
            <span>{option.label || `Option ${index + 1}`}</span>
            <strong>
              {option.direction === "spend" ? "−" : "+"}${option.amount || "0"}
            </strong>
          </div>
        ))}
        <div className="impact-card__rule" />
        <p>
          Unlike a contextual statistic, changing an answer amount directly
          changes the player’s balance when that choice is selected.
        </p>
      </aside>
    </div>
  )
}

function PreviewScreen({
  editor,
  original,
  blockMessage,
  onBack,
  onPublish,
}: {
  editor: EditorSession
  original: StatisticData | QuestionData | null
  blockMessage: string
  onBack: () => void
  onPublish: () => void
}) {
  return (
    <main className="page">
      <div className="preview-heading">
        <div>
          <span className="draft-badge">Draft preview</span>
          <h1>Review changes and impact</h1>
          <p>
            Confirm what players will see and every location this edit affects.
          </p>
        </div>
        <div className="preview-heading__actions">
          <Button variant="secondary" onClick={onBack}>
            Back to Edit
          </Button>
          <Button onClick={onPublish}>Publish Changes</Button>
        </div>
      </div>

      {blockMessage && (
        <div className="alert alert--error" role="alert">
          <strong>Cannot publish yet</strong>
          <span>{blockMessage}</span>
        </div>
      )}

      <section className="preview-grid">
        <div>
          <div className="section-heading">
            <div>
              <p className="overline">Player view</p>
              <h2>Affected game screen</h2>
            </div>
          </div>
          <GamePreview editor={editor} />
        </div>
        <aside className="comparison-panel">
          <p className="overline">Change summary</p>
          <h2>Previous and proposed</h2>
          {editor.kind === "statistic" ? (
            <>
              <ComparisonRow
                label="Value"
                previous={
                  original && "value" in original
                    ? formatStatisticValue(original.value, original.unit)
                    : "Not published"
                }
                proposed={formatStatisticValue(
                  editor.value.value,
                  editor.value.unit,
                )}
              />
              <ComparisonRow
                label="Player explanation"
                previous={
                  original && "explanation" in original
                    ? original.explanation
                    : "Not published"
                }
                proposed={editor.value.explanation}
              />
              <div className="affected-list">
                <strong>Affected locations</strong>
                <ul>
                  {editor.value.locations.map((location) => (
                    <li key={location}>{location}</li>
                  ))}
                </ul>
              </div>
              <div className="neutral-note">
                This updates displayed context only. It does not change gameplay
                costs or balances.
              </div>
            </>
          ) : (
            <>
              <ComparisonRow
                label="Question"
                previous={
                  original && "text" in original
                    ? original.text
                    : "Not published"
                }
                proposed={editor.value.text}
              />
              <div className="affected-list">
                <strong>Applicable personas</strong>
                <ul>
                  {editor.value.personas.map((persona) => (
                    <li key={persona}>{persona}</li>
                  ))}
                </ul>
              </div>
              {editor.value.options.map((option, index) => {
                const oldOption =
                  original && "options" in original
                    ? original.options[index]
                    : null
                return (
                  <div className="option-comparison" key={index}>
                    <strong>Option {index + 1}</strong>
                    <ComparisonRow
                      label="Choice label"
                      previous={oldOption?.label ?? "Not published"}
                      proposed={option.label}
                    />
                    <ComparisonRow
                      label="Financial effect"
                      previous={
                        oldOption
                          ? `${
                              oldOption.direction === "spend" ? "−" : "+"
                            }$${oldOption.amount}`
                          : "Not published"
                      }
                      proposed={`${
                        option.direction === "spend" ? "−" : "+"
                      }$${option.amount}`}
                    />
                    <ComparisonRow
                      label="Next step"
                      previous={
                        oldOption
                          ? destinationLabel(oldOption.next)
                          : "Not published"
                      }
                      proposed={destinationLabel(option.next)}
                    />
                  </div>
                )
              })}
              <div className="affected-list">
                <strong>Affected location</strong>
                <ul>
                  <li>{editor.value.appearance}</li>
                </ul>
              </div>
            </>
          )}
        </aside>
      </section>
      <div className="editor-actions">
        <Button variant="secondary" onClick={onBack}>
          Back to Edit
        </Button>
        <Button onClick={onPublish}>Publish Changes</Button>
      </div>
    </main>
  )
}

function GamePreview({ editor }: { editor: EditorSession }) {
  if (editor.kind === "statistic") {
    return (
      <div className="game-frame">
        <div className="game-frame__bar">
          <span>DAY 8 · RECAP</span>
          <span>Prototype player view</span>
        </div>
        <div className="game-frame__body">
          <p className="overline">{editor.value.appearance}</p>
          <h3>{editor.value.title}</h3>
          <div className="stat-display">
            {formatStatisticValue(editor.value.value, editor.value.unit)}
          </div>
          <p>{editor.value.explanation}</p>
          <small>
            {editor.value.area} · {editor.value.period}
          </small>
          <div className="source-line">Source: {editor.value.sourceName}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="game-frame">
      <div className="game-frame__bar">
        <span>DAY 8 · DECISION</span>
        <span>Prototype player view</span>
      </div>
      <div className="game-frame__body">
        <p className="overline">{editor.value.appearance}</p>
        <h3>{editor.value.title}</h3>
        <p>{editor.value.text}</p>
        <div className="game-options">
          {editor.value.options.map((option, index) => (
            <div key={index}>
              <span>Option {index + 1}</span>
              <strong>{option.label}</strong>
              <b>
                {option.direction === "spend" ? "−" : "+"}${option.amount}
              </b>
              <small>{option.consequence}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ComparisonRow({
  label,
  previous,
  proposed,
}: {
  label: string
  previous: string
  proposed: string
}) {
  return (
    <div className="comparison-row">
      <strong>{label}</strong>
      <div>
        <span>Previous</span>
        <p>{previous}</p>
      </div>
      <div>
        <span>Proposed</span>
        <p>{proposed}</p>
      </div>
    </div>
  )
}

function formatStatisticValue(value: string, unit: string) {
  if (!value) return "No value entered"
  if (unit === "dollars") return `$${value}`
  if (unit === "percent") return `${value}%`
  return `${value} ${unit}`
}

function destinationLabel(value: string) {
  return (
    questionDestinations.find((destination) => destination.value === value)
      ?.label ?? "Not selected"
  )
}
