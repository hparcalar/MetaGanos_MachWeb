export interface CreditRangeType {
  key: number
  value: string
}

export const creditRangeOption: CreditRangeType[] = [
  { key: 1, value: 'Daily' },
  { key: 2, value: 'Weekly' },
  { key: 3, value: 'Monthly' },
  { key: 4, value: 'Indefinite' },
]

export interface ControlTimeType {
  key: number
  value: string
}

export const controlTimeOption: ControlTimeType[] = [
  { key: 1, value: 'Daily' },
  { key: 2, value: 'Weekly' },
  { key: 3, value: 'Monthly' },
  { key: 4, value: 'Yearly' },
  { key: 5, value: 'Indefinite' },
]
