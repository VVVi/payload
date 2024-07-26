'use client'

import type { ErrorProps } from 'payload'

import React from 'react'

import { Tooltip } from '../../elements/Tooltip/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useFormFields, useFormSubmitted } from '../../forms/Form/context.js'
import { RenderMappedComponent } from '../../providers/ComponentMap/RenderMappedComponent.js'
import './index.scss'

const baseClass = 'field-error'

const DefaultFieldError: React.FC<ErrorProps> = (props) => {
  const {
    alignCaret = 'right',
    message: messageFromProps,
    path: pathFromProps,
    showError: showErrorFromProps,
  } = props

  const { path: pathFromContext } = useFieldProps()
  const path = pathFromContext ?? pathFromProps

  const hasSubmitted = useFormSubmitted()
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { errorMessage, valid } = field || {}

  const message = messageFromProps || errorMessage
  const showMessage = showErrorFromProps || (hasSubmitted && valid === false)

  if (showMessage && message?.length) {
    return (
      <Tooltip alignCaret={alignCaret} className={baseClass} delay={0} staticPositioning>
        {message}
      </Tooltip>
    )
  }

  return null
}

export const FieldError: React.FC<ErrorProps> = (props) => {
  const { CustomError } = props

  if (CustomError !== undefined) {
    return <RenderMappedComponent clientProps={props} component={CustomError} />
  }

  return <DefaultFieldError {...props} />
}
