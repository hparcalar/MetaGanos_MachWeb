import moment from 'moment'

export const dateToStr = (dateString: string): string => {
  if (dateString && dateString.length > 0) {
    try {
      const dtObj = moment(dateString)
      return dtObj ? dtObj.format('DD.MM.YYYY') : dateString
    } catch (error) {}
  }

  return dateString
}

export const dateIsLtFromNow = (dateString: string): boolean => {
  if (dateString && dateString.length > 0) {
    try {
      const dtObj = removeTime(moment(dateString))
      return moment() > dtObj
    } catch (error) {}
  }
  return false
}

export const dateTimeToStr = (dateString: string): string => {
  if (dateString && dateString.length > 0) {
    try {
      const dtObj = moment(dateString)
      return dtObj ? dtObj.format('DD.MM.YYYY HH:mm') : dateString
    } catch (error) {}
  }

  return dateString
}

export const timeToStr = (dateString: string): string => {
  if (dateString && dateString.length > 0) {
    try {
      const dtObj = moment(dateString)
      return dtObj ? dtObj.format('HH:mm') : dateString
    } catch (error) {}
  }

  return dateString
}

export const removeTime = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
