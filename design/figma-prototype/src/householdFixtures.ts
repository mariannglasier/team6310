export type HouseholdFixture = {
  id: string
  name: string
  composition: string
  incomeDescription: string
  startingBalance: number
  biography: string
  photoTone: "rose" | "blue" | "green"
}

export const householdFixtures: HouseholdFixture[] = [
  {
    id: "jordan-maya",
    name: "Jordan & Maya",
    composition: "One parent · One child",
    incomeDescription: "Full-time employment",
    startingBalance: 500,
    biography:
      "Jordan is a dedicated parent working full time while raising Maya. Between work, school routines, and time together, they’re focused on creating a stable, caring home. Each month means balancing housing, groceries, transportation, and the things Maya needs as she grows. Jordan wants to build a small cushion for unexpected costs without sacrificing everyday essentials. Your choices will help them navigate those competing priorities and plan for what’s ahead.",
    photoTone: "rose",
  },
  {
    id: "alex",
    name: "Alex",
    composition: "One adult",
    incomeDescription: "Hourly employment",
    startingBalance: 650,
    biography:
      "Alex works hourly and is building financial stability while balancing work, housing, and everyday expenses. When working hours change, the amount available for the month can change too, making it important to plan carefully. Alex is focused on covering rent, keeping groceries stocked, and getting to work reliably while setting something aside for future goals. An unexpected expense can make that balance harder to maintain. Your choices will help Alex weigh immediate needs against longer-term stability.",
    photoTone: "blue",
  },
  {
    id: "patricia",
    name: "Patricia",
    composition: "One adult · Retired",
    incomeDescription: "Fixed monthly income",
    startingBalance: 400,
    biography:
      "Patricia is retired and lives on a fixed income. She values her independence, the comfort of her home, and staying connected to her community. With a set amount arriving each month, she plans carefully for housing, groceries, utilities, and transportation. When prices rise or an unexpected bill arrives, there is little room to increase her income to cover the difference. Your choices will help Patricia protect her everyday well-being while preparing for the expenses she cannot always predict.",
    photoTone: "green",
  },
]
