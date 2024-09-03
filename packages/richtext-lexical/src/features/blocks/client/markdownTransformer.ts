/* eslint-disable */
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import type { ClientBlock } from 'payload'
import type { Transformer } from '@lexical/markdown'

import { propsToJSXString } from '../../../utilities/jsx/jsx.js'

import { createHeadlessEditor } from '@lexical/headless'

import {
  type Klass,
  type LexicalNode,
  type LexicalNodeReplacement,
  SerializedEditorState,
} from 'lexical'
import { $createBlockNode, $isBlockNode, BlockNode } from './nodes/BlocksNode.js'
import { extractPropsFromJSXPropsString } from '../../../utilities/jsx/extractPropsFromJSXPropsString.js'
import type { MultilineElementTransformer } from '../../../utilities/jsx/lexicalMarkdownCopy.js'

function createTagRegexes(tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    regExpStart: new RegExp(`<(${escapedTagName})([^>]*?)\\s*(/?)>`, 'i'),
    regExpEnd: new RegExp(`</(${escapedTagName})\\s*>|<${escapedTagName}[^>]*?/>`, 'i'),
  }
}
export const getBlockMarkdownTransformers = ({
  blocks,
}: {
  blocks: ClientBlock[]
}): ((props: {
  allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
  allTransformers: Transformer[]
}) => MultilineElementTransformer)[] => {
  if (!blocks?.length) {
    return
  }

  const transformers: ((props: {
    allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
    allTransformers: Transformer[]
  }) => MultilineElementTransformer)[] = []

  for (const block of blocks) {
    if (!block.jsx) {
      continue
    }
    const regex = createTagRegexes(block.slug)
    transformers.push(({ allTransformers, allNodes }) => ({
      dependencies: [BlockNode],
      export: (node) => {
        if (!$isBlockNode(node)) {
          return null
        }
        if (node.getFields()?.blockType?.toLowerCase() !== block.slug.toLowerCase()) {
          return null
        }

        const nodeFields = node.getFields()
        const lexicalToMarkdown = getLexicalToMarkdown(allNodes, allTransformers)

        const exportResult = block.jsx.export({
          fields: nodeFields,
          lexicalToMarkdown,
        })
        if (exportResult === false) {
          return null
        }
        if (typeof exportResult === 'string') {
          return exportResult
        }

        if (exportResult?.children?.length) {
          return `<${nodeFields.blockType} ${propsToJSXString({ props: exportResult.props })}>\n  ${exportResult.children}\n</${nodeFields.blockType}>`
        }

        return `<${nodeFields.blockType} ${propsToJSXString({ props: exportResult.props })}/>`
      },
      regExpEnd: block.jsx?.customEndRegex ?? regex.regExpEnd,
      regExpStart: block.jsx?.customStartRegex ?? regex.regExpStart,
      replace: (rootNode, children, openMatch, closeMatch, linesInBetween) => {
        if (block.jsx.import) {
          if (!linesInBetween) {
            // convert children to linesInBetween
            let line = ''
            for (const child of children) {
              line += child.getTextContent()
            }
            linesInBetween = [line]
          }

          const childrenString = linesInBetween.join('\n').trim()

          const propsString: string | null = openMatch?.length > 2 ? openMatch[2]?.trim() : null

          const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

          const blockFields = block.jsx.import({
            children: childrenString,
            props: propsString
              ? extractPropsFromJSXPropsString({
                  propsString,
                })
              : {},
            openMatch,
            closeMatch,
            markdownToLexical: markdownToLexical,
            htmlToLexical: null, // TODO
          })
          if (blockFields === false) {
            return false
          }

          const node = $createBlockNode({
            blockType: block.slug,
            ...blockFields,
          } as any)
          if (node) {
            rootNode.append(node)
          }

          return
        }
        return false // Run next transformer
      },
      type: 'multilineElement',
    }))
  }

  return transformers
}

export function getMarkdownToLexical(
  allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>,
  allTransformers: Transformer[],
): (args: { markdown: string }) => SerializedEditorState {
  const markdownToLexical = ({ markdown }: { markdown: string }): SerializedEditorState => {
    const headlessEditor = createHeadlessEditor({
      nodes: allNodes,
    })

    headlessEditor.update(
      () => {
        $convertFromMarkdownString(markdown, allTransformers)
      },
      { discrete: true },
    )

    const editorJSON = headlessEditor.getEditorState().toJSON()

    return editorJSON
  }
  return markdownToLexical
}

export function getLexicalToMarkdown(
  allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>,
  allTransformers: Transformer[],
): (args: { editorState: Record<string, any> }) => string {
  const lexicalToMarkdown = ({ editorState }: { editorState: Record<string, any> }): string => {
    const headlessEditor = createHeadlessEditor({
      nodes: allNodes,
    })

    try {
      headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState as any)) // This should commit the editor state immediately
    } catch (e) {
      console.error('getLexicalToMarkdown: ERROR parsing editor state', e)
    }

    let markdown: string
    headlessEditor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(allTransformers)
    })

    return markdown
  }
  return lexicalToMarkdown
}
