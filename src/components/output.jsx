/* Output handlers */

import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import ReactTable from 'react-table'

import { Rep, Grip } from 'devtools-modules'

import { SimpleTable, makeMatrixText } from './pretty-matrix'

import nb from '../tools/nb'

const ObjectInspectorFactory = React.createFactory(ObjectInspector)

function renderValue(value, inContainer = false) {
  for (const handler of handlers) {
    if (handler.shouldHandle(value, inContainer)) {
      const resultElem = handler.render(value, inContainer)
      /* eslint-disable */
      if (typeof resultElem === 'string') {
        return <div dangerouslySetInnerHTML={{ __html: resultElem }} />
      } else if (resultElem.tagName !== undefined) {
        return <div dangerouslySetInnerHTML={{ __html: resultElem.outerHTML }} />
      } else if (resultElem.type !== undefined) {
        return resultElem
      } else {
        console.log('Unknown output handler result type ' + resultElem)
        // Fallback to other handlers if it's something invalid
      }
      /* eslint-enable */
    }
  }
}



const nullHandler = {
  shouldHandle: value => (value === null),

  render: () => <pre>null</pre>,
}

const undefinedHandler = {
  shouldHandle: value => (value === undefined),

  render: () => <pre>undefined</pre>,
}

const renderMethodHandler = {
  shouldHandle: value => (value !== undefined && typeof value.render === 'function'),

  render: (value, inContainer) => {
    const output = value.render(inContainer)
    if (typeof output === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: output }} /> // eslint-disable-line
    }
    return undefined
  },
}

const dataFrameHandler = {
  shouldHandle: (value, inContainer) => !inContainer && nb.isRowDf(value),

  render: (value) => {
    const columns = Object.keys(value[0])
      .map(k => ({
        Header: k,
        accessor: k,
        Cell: cell => renderValue(cell.value, true),
      }))
    const dataSetInfo = `array of objects: ${value.length} rows, ${columns.length} columns`
    let pageSize = value.length > 10 ? 10 : value.length
    return (
      <div>
        <div className="data-set-info">{dataSetInfo}</div>
        <ReactTable
          data={value}
          columns={columns}
          showPaginationTop
          showPaginationBottom={false}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          minRows={0}
          defaultPageSize={pageSize}
        />
      </div>
    )
  },
}

const matrixHandler = {
  shouldHandle: (value, inContainer) => !inContainer && nb.isMatrix(value),

  render: (value) => {
    const shape = nb.shape(value)
    const dataSetInfo = `${shape[0]} × ${shape[1]} matrix (array of arrays)`
    const tabledata = makeMatrixText(value, [10, 10])
    return (
      <div>
        <div className="data-set-info">{dataSetInfo}</div>
        <SimpleTable tabledata={tabledata} />
      </div>
    )
  },
}

const arrayHandler = {
  shouldHandle: (value, inContainer) => !inContainer && _.isArray(value),

  render: (value) => {
    const dataSetInfo = `${value.length} element array`
    const len = value.length

    let values = []

    function addValues(start, end) {
      for (let i = start; i < end; i++) {
        values.push(renderValue(value[i], true))
        if (i !== end - 1) {
          values.push(', ')
        }
      }
    }

    values.push('[')
    if (len < 500) {
      addValues(0, len)
    } else {
      addValues(0, 100)
      values.push(' … ')
      addValues(len - 100, len)
    }
    values.push(']')

    return (
      <div>
        <div className="data-set-info">{dataSetInfo}</div>
        {values}
      </div>
    )
  },
}

const dateHandler = {
  shouldHandle: value => Object.prototype.toString.call(value) === '[object Date]',

  render: value => value.toString(),
}

const scalarHandler = {
  scalarTypes: {
    string: true,
    number: true,
  },

  shouldHandle: value => (typeof (value) in scalarHandler.scalarTypes),

  render: value =>
  // TODO: This probably needs a new CSS class
    <span className="array-output">{value}</span>,

}

function createObjectClient(grip) {
  return ({ dispatch, client }) => client.getObjectClient(grip)
}

const defaultHandler = {
  shouldHandle: () => true,

  render: (value) => {
    /* return dom.div(
     *   ObjectInspectorFactory({
     *     roots: [{
     *       path: 'root',
     *       contents: {
     *         value,
     *       }
     *     }],
     *     autoExpandDepth: 0,
     *     createObjectClient,
     *     mode: MODE.LONG,
     *   })
     * );*/

    return Rep({ value, defaultRep: Grip, mode: MODE.LONG })
  }
}

const handlers = [
  nullHandler,
  undefinedHandler,
  renderMethodHandler,
  dataFrameHandler,
  matrixHandler,
  arrayHandler,
  dateHandler,
  // scalarHandler,
  defaultHandler,
]

export function addOutputHandler(handler) {
  // TODO: We may want to be smarter about inserting handlers at
  // certain places in the handler array.  Right now, this just
  // puts the new handler at the front.
  handlers.unshift(handler)
}

export default class CellOutput extends React.Component {
  static propTypes = {
    render: PropTypes.bool.isRequired,
    valueToRender: PropTypes.any,
  }

  render() {
    if (!this.props.render ||
        this.props.valueToRender === undefined) {
      return <div className="empty-resultset" />
    }

    const value = this.props.valueToRender
    const resultElem = renderValue(value)
    if (resultElem !== undefined) {
      return resultElem
    }
    return <div className="empty-resultset" />
  }
}
