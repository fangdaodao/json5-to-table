const XLSX = require('xlsx')
const generateTable = require('./generateTable')

function generateExcel (data, schema, { writeTo, ...options }) {
  const table = generateTable(data, schema, options)

  const ws = buildWorksheet(table)
  const wb = {
    SheetNames: ['Sheet 1'],
    Sheets: {
      'Sheet 1': ws
    }
  }

  XLSX.writeFile(wb, writeTo)
}

function buildWorksheet (table) {
  const sheet = {
    '!merges': []
  }

  const headerRegion = writeDataToSheet(table.header, sheet)
  const bodyRegion = writeDataToSheet(table.body, sheet)

  const rowCount = headerRegion[0] + bodyRegion[0]
  const colCount = headerRegion[1] + bodyRegion[1]
  const beginAddress = XLSX.utils.encode_cell({ r: 0, c: 0 })
  const endAddress = XLSX.utils.encode_cell({ r: rowCount- 1, c: colCount- 1 })
  sheet['!ref'] = `${beginAddress}:${endAddress}`

  return sheet
}

function writeDataToSheet (rows, sheet) {
  let rowCount = 0
  let colCount = 0

  // TODO: 不知道 Table 的范围
  for (const row of rows) {
    rowCount++
    // 每一行的 cells 应该相等
    if (colCount === 0) {
      colCount = row.length
    } else if (colCount != row.length) {
      throw new Error('断言失败：每一行的列数应该相等')
    }

    for (const cell of row) {
      if (cell === undefined) {
        continue
      }

      const address = XLSX.utils.encode_cell({ r: cell.row - 1, c: cell.col - 1 })
      sheet[address] = { v: cell.val }

      if (cell.rowSpan > 1 || cell.colSpan > 1) {
        sheet['!merges'].push({ 
          s: { r: cell.row - 1, c: cell.col - 1 }, 
          e: { r: cell.row + cell.rowSpan - 2, c: cell.col + cell.colSpan - 2 } 
        })
      }
    }
  }

  return [rowCount, colCount]
}

module.exports = generateExcel