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
