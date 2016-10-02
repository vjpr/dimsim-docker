/**
 * @param {object} - an object specifying the command-line options to set
 * @param [options] {object}
 * @param [options.quote] {boolean} - enquote the option values
 * @param [options.optionEqualsValue] {boolean} - use `--option=value` notation
 */
export default function toSpawnArgs(object, options) {
  var output = []
  options = options || {}

  for (var prop in object) {
    var value = object[prop]
    if (value !== undefined) {
      var dash = prop.length === 1 ? '-' : '--'
      if (options.optionEqualsValue) {
        if (value === true) {
          output.push(dash + prop)
        } else {
          if (typeof value === 'object') {
            value.values.forEach((v) => {
              output.push(dash + prop + '=' + quote(v, options.quote))
            })
          } else if (Array.isArray(value)) {
            output.push(dash + prop + '=' + quote(value.join(','), options.quote))
          } else {
            output.push(dash + prop + '=' + quote(value, options.quote))
          }
        }
      } else {
        if (value === true) {
          output.push(dash + prop)
          continue
        }
        if (value !== true) {
          if (typeof value === 'object' && value.values) {
            value.values.forEach((v) => {
              output.push(dash + prop)
              output.push(quote(v, options.quote))
            })
          } else if (Array.isArray(value)) {
            output.push(dash + prop)
            value.forEach(function(item) {
              output.push(quote(item, options.quote))
            })
          } else {
            output.push(dash + prop)
            output.push(quote(value, options.quote))
          }
        }
      }
    }
  }
  return output
}

function quote(value, toQuote) {
  return toQuote ? '"' + value + '"' : value
}
