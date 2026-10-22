export type JobOption = {
  id: string
  title: string
  weeklyIncome: number
  requirements: string
  qualifiedInitially: boolean
  qualifiedAfterPreparation: boolean
  lowerRequirement: boolean
}

export const jobOptions: JobOption[] = [
  {
    id: "dishwasher",
    title: "Dishwasher",
    weeklyIncome: 520,
    requirements: "No English or computer skills required",
    qualifiedInitially: true,
    qualifiedAfterPreparation: true,
    lowerRequirement: true,
  },
  {
    id: "custodial-assistant",
    title: "Custodial assistant",
    weeklyIncome: 560,
    requirements: "No computer skills required",
    qualifiedInitially: true,
    qualifiedAfterPreparation: true,
    lowerRequirement: true,
  },
  {
    id: "front-desk-assistant",
    title: "Front desk assistant",
    weeklyIncome: 640,
    requirements: "Conversational English required",
    qualifiedInitially: false,
    qualifiedAfterPreparation: true,
    lowerRequirement: false,
  },
  {
    id: "office-assistant",
    title: "Office assistant",
    weeklyIncome: 720,
    requirements: "English and basic computer skills required",
    qualifiedInitially: false,
    qualifiedAfterPreparation: true,
    lowerRequirement: false,
  },
  {
    id: "customer-service-representative",
    title: "Customer service representative",
    weeklyIncome: 760,
    requirements: "English, computer skills, and prior experience required",
    qualifiedInitially: false,
    qualifiedAfterPreparation: false,
    lowerRequirement: false,
  },
]

export const PROFESSIONAL_CLOTHING_COST = 60
