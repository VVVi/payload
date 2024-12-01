'use client'

import { Panel } from '@xyflow/react'
import React from 'react'

import './index.scss'
import { useSelectedTaskContext } from '../context.js'

const ErrorDisplay = ({ error }: { error: any }) => {
  const formatStack = (stack: string) => {
    return stack.split('\n').map((line, index) => (
      <div className="stack-line" key={index}>
        {line.trim()}
      </div>
    ))
  }

  return (
    <div className="error-container">
      <div className="detail-row">
        <span className="label">Error Type:</span>
        <span className="value error-type">{error.name}</span>
      </div>
      <div className="detail-row">
        <span className="label">Message:</span>
        <span className="value error-message">{error.message}</span>
      </div>
      {error.stack && (
        <div className="stack-trace">
          <div className="stack-header">Stack Trace:</div>
          <div className="stack-content">{formatStack(error.stack)}</div>
        </div>
      )}
    </div>
  )
}

export const NodePanel = () => {
  const { taskLog } = useSelectedTaskContext()

  if (!taskLog) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Panel className="nodePanel" position="top-right">
      <h1>
        {taskLog.taskSlug} Task {taskLog.taskID}
      </h1>
      <div className="task-details">
        <div className="detail-row">
          <span className="label">Task ID:</span>
          <span className="value">{taskLog.taskID}</span>
        </div>
        <div className="detail-row">
          <span className="label">Task Slug:</span>
          <span className="value">{taskLog.taskSlug}</span>
        </div>
        <div className="detail-row">
          <span className="label">State:</span>
          <span className={`value state ${taskLog.state}`}>{taskLog.state}</span>
        </div>
        <div className="detail-row">
          <span className="label">Executed At:</span>
          <span className="value">{formatDate(taskLog.executedAt)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Completed At:</span>
          <span className="value">{formatDate(taskLog.completedAt)}</span>
        </div>

        {taskLog.output && Object.keys(taskLog.output).length > 0 && (
          <div className="detail-row">
            <span className="label">Output:</span>
            <span className="value">{JSON.stringify(taskLog.output, null, 2)}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="label">ID:</span>
          <span className="value">{taskLog.id}</span>
        </div>
        {taskLog.error ? <ErrorDisplay error={taskLog.error} /> : null}
      </div>
    </Panel>
  )
}